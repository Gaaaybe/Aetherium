# Aetherium — Design da Camada de Automação

Motor de regras: behaviors, targeting, modificações e pipeline de resolução

> Documento complementar ao Plano de Refatoração. Assume que a estrutura do `rules-engine` já existe com `cost/` e `schemas/`, e descreve o que entra em `automation/`.

---

## 1. O problema que a automação resolve

O catálogo de regras (`EffectBase`, `ModificationBase`) sempre modelou bem **quanto um poder custa** — custo é aritmética sobre tabelas, e isso já está resolvido em `calculate-power-cost.ts`. O que nunca existiu foi uma representação estruturada de **o que um efeito faz mecanicamente no momento de uso** (ou continuamente, se for passivo). Essa informação vivia só na `descricao` em texto livre, para o narrador interpretar na mesa.

A automação não é um sistema separado — é a segunda semântica que `EffectBase` e `ModificationBase` precisam ganhar, paralela à semântica de custo que já existe.

---

## 2. Agentes de mudança

Todos os agentes que produzem mudanças de estado no sistema compartilham a mesma camada. A distinção relevante não é "quem é o agente", mas **quando o efeito se aplica**:

| Agente | Exemplos | Quando aplica |
|---|---|---|
| Poder ativo | Dano, recuperação, marcador | No momento do uso |
| Poder passivo | Bônus de rolagem, modificador de recurso | Continuamente, enquanto equipado |
| Benefício | Ataque aprimorado, tolerância maior | Continuamente, enquanto ativo |
| Condição | Abalado, Lento, Faminto | Continuamente, enquanto aplicada |

Um poder com `parametros.acao = 5` (Nenhuma) e `parametros.duracao = 4` (Permanente) **é** um modificador passivo — os parâmetros já dizem o modo de resolução. Não é uma categoria separada de agente, é o mesmo mecanismo com modo diferente.

---

## 3. Modos de resolução

O campo `parametros.acao` do poder determina o modo:

```typescript
type ResolutionMode =
  | { mode: 'ON_USE';    context: PowerUseContext }  // acao != 5 — resolve no momento do uso
  | { mode: 'PASSIVE' }                               // acao = 5, mecânica estruturada e automática
  | { mode: 'NARRATIVE' }                             // acao = 5, sem mecânica precisa — narrador resolve

function getResolutionMode(parametros: PowerParametersInput): ResolutionMode {
  if (parametros.acao !== 5) return { mode: 'ON_USE', context: /* ... */ }
  // distinção PASSIVE vs NARRATIVE vem do kind do behavior (ver seção 4)
}
```

Benefícios e condições são sempre `PASSIVE` ou `NARRATIVE` — nunca `ON_USE`.

---

## 4. EfeitoBehavior — o discriminador de tipo

Cada `EffectBase` do catálogo ganha um campo `behavior: EfeitoBehavior | null`. `null` significa "ainda não mapeado" (legado ou narrativo sem definição). O `kind` determina qual executor roda e em qual modo.

```typescript
type EfeitoBehavior =
  // Ativos (ON_USE) ──────────────────────────────────────────────────────
  | { kind: 'DANO'
      formula?: string         // se null, usa coluna `dano` da tabela universal pelo grau
      tipoDano: string }

  | { kind: 'RECUPERACAO'
      recurso: 'PV' | 'PE'
      formula: string }

  | { kind: 'MARCADOR'
      markerId: string         // ex: 'laco-de-odio' — chave única do marcador
      label: string
      duracao: 'CENA' | 'PERMANENTE'
      visivel: boolean }

  | { kind: 'GATILHO'          // Fase 2
      evento: string           // ex: 'DANO_CORPO_A_CORPO_CAUSADO'
      condicao: string         // ex: 'alvo.tem_marcador:laco-de-odio'
      efeitosFilhos: string[]  // IDs de efeitos a disparar quando condição bater
    }

  // Passivos mecânicos (PASSIVE) ─────────────────────────────────────────
  | { kind: 'BONUS_ROLAGEM'
      rollType: string         // ex: 'ATAQUE_DISTANCIA', 'PERICIA_REFLEXOS'
      value: number
      isAdvantage: boolean }   // true = vantagem, false = desvantagem

  | { kind: 'MODIFICADOR_RECURSO'
      recurso: 'PV' | 'PE'
      formula: string }        // adiciona ao máximo do recurso

  | { kind: 'BLOQUEIO_RECUPERACAO'
      recurso: 'PE' | 'PV' }

  | { kind: 'MODIFICADOR_MOVIMENTO'
      multiplier?: number      // ex: 0.5 para Lento
      bonus?: number }

  | { kind: 'VULNERABILIDADE_DESCRITOR'
      descritor: string }      // ex: 'Frio' — registra para o narrador, sem automação ainda

  // Narrativo (NARRATIVE) ────────────────────────────────────────────────
  | { kind: 'NARRATIVO'
      descricao?: string }     // sem automação — exibido na ficha, narrador interpreta
```

### Critério para mapear um efeito

Um efeito entra no espectro mecânico (`DANO`, `RECUPERACAO`, `MARCADOR` etc.) somente quando sua mecânica é precisa o suficiente para ser expressa como dado estruturado sem perder informação. `CARACTERISTICA` com `inputValue` em texto livre é `NARRATIVO` indefinidamente, ou até as regras formalizarem o que aquele trait significa mecanicamente.

---

## 5. ModificationBase — segunda semântica

Além de contribuir com número pro custo, cada `ModificationBase` do catálogo ganha dois campos:

```typescript
interface ModificationBaseAutomation {
  targetingEffect: 'AREA' | 'SELETIVO' | 'LIMITADO' | 'NENHUM'
  casterEffect:    'EFEITO_COLATERAL' | 'NENHUM'
  markerCondition?: string   // qual markerId o LIMITADO checa — ex: 'laco-de-odio'
}
```

Modificações com `targetingEffect: 'NENHUM'` e `casterEffect: 'NENHUM'` são puramente de custo (ou narrativas) — nenhum comportamento extra. Isso é a maioria do catálogo atual.

---

## 6. Outputs do motor

O motor produz dois tipos de output, nunca muta estado diretamente:

### 6.1 GameMutation — para poderes ON_USE

```typescript
type GameMutation =
  | { type: 'DEAL_DAMAGE';          targetId: string; formula: string; damageType: string; isSelfInflicted?: true }
  | { type: 'HEAL';                 targetId: string; formula: string }
  | { type: 'RESTORE_PE';           targetId: string; formula: string }
  | { type: 'APPLY_MARKER';         targetId: string; markerId: string; label: string; duracao: 'CENA' | 'PERMANENTE'; sourcePowerId: string }
  | { type: 'REMOVE_MARKER';        targetId: string; markerId: string }
```

O backend recebe essa lista e aplica cada mutação no `Character` (via `character-rules.ts`) ou na `SceneEffectInstance`.

### 6.2 PassiveModifier — para poderes PASSIVE, benefícios e condições

```typescript
type PassiveModifier =
  | { kind: 'ROLL_BONUS';              rollType: string; value: number; isAdvantage: boolean; sourceId: string }
  | { kind: 'RESOURCE_MAX_MODIFIER';   recurso: 'PV' | 'PE'; formula: string; sourceId: string }
  | { kind: 'BLOCK_RESOURCE_RECOVERY'; recurso: 'PE' | 'PV'; sourceId: string }
  | { kind: 'MOVEMENT_MODIFIER';       multiplier?: number; bonus?: number; sourceId: string }
```

`resolvePassiveModifiers()` recebe condições ativas, benefícios e poderes passivos equipados, e devolve a lista combinada de `PassiveModifier[]`. Qualquer cálculo que precise levar isso em conta (combate, roll de perícia, regen de PE) chama essa função — em vez de ter lógica espalhada em vários lugares.

---

## 7. Contextos de entrada

### 7.1 Contexto de uso de poder (ON_USE)

```typescript
interface PowerUseContext {
  casterId: string
  sceneId: string
  candidateTargetIds: string[]         // alvos candidatos filtrados por alcance — vem de fora do motor
  casterState: CasterSnapshot
  activeMarkers: SceneMarkerSnapshot[] // marcadores de cena ativos no momento
}

interface CasterSnapshot {
  id: string
  keyPhysicalModifier: number
  keyMentalModifier: number
  level: number
}

interface SceneMarkerSnapshot {
  markerId: string
  sourceId: string   // quem aplicou
  targetId: string   // em quem está aplicado
}
```

O motor não sabe calcular "quem está no alcance" — isso é geométrico/situacional, responsabilidade de quem chama. O motor recebe `candidateTargetIds` já prontos e apenas filtra/transforma a partir deles.

### 7.2 Contexto de modificadores passivos

```typescript
interface PassiveContext {
  characterId: string
  equippedPassivePowers: ResolvedPassivePower[]
  activeConditions: string[]           // ex: ['Abalado', 'Lento']
  activeBenefits: ResolvedBenefit[]
}
```

---

## 8. Targeting — transformações de conjunto de alvos

Cada modificação com `targetingEffect != 'NENHUM'` é uma função que transforma `candidateTargetIds`:

```typescript
type TargetingTransform = (
  candidateTargetIds: string[],
  ctx: PowerUseContext,
  params?: Record<string, unknown>
) => string[]

// LIMITADO: mantém só quem tem o marcador especificado, aplicado pelo caster
function limitadoTransform(markerId: string): TargetingTransform {
  return (candidates, ctx) =>
    candidates.filter(id =>
      ctx.activeMarkers.some(
        m => m.targetId === id && m.markerId === markerId && m.sourceId === ctx.casterId
      )
    )
}

// SELETIVO: mantém só quem o jogador escolheu explicitamente
function seletivoTransform(selectedIds: string[]): TargetingTransform {
  return (candidates) => candidates.filter(id => selectedIds.includes(id))
}

// AREA: não filtra — os candidatos já chegam corretos, a área foi calculada por fora
const areaTransform: TargetingTransform = (candidates) => candidates
```

---

## 9. Pipeline de resolução (ON_USE)

```typescript
interface PowerUseInput {
  power: ResolvedPower          // poder com efeitos e modificações já hidratados do catálogo
  context: PowerUseContext
  selectedTargetIds?: string[]  // para SELETIVO — jogador escolhe quem entre os candidatos
}

function resolvePowerUse({ power, context, selectedTargetIds }: PowerUseInput): GameMutation[] {
  const mutations: GameMutation[] = []

  for (const appliedEffect of power.effects) {
    const behavior = appliedEffect.behavior
    if (!behavior || behavior.kind === 'NARRATIVO') continue  // motor não automatiza

    if (behavior.kind === 'GATILHO') {
      // registra inscrição na SceneEffectInstance — Fase 2
      continue
    }

    // 1. Começa com todos os candidatos
    let targets = [...context.candidateTargetIds]

    // 2. Aplica transformações de targeting das modificações locais (na ordem de posicao)
    for (const mod of appliedEffect.modifications) {
      if (mod.targetingEffect === 'LIMITADO' && mod.markerCondition) {
        targets = limitadoTransform(mod.markerCondition)(targets, context)
      }
      if (mod.targetingEffect === 'SELETIVO' && selectedTargetIds) {
        targets = seletivoTransform(selectedTargetIds)(targets, context)
      }
    }

    // 3. Executa o behavior contra os alvos filtrados
    mutations.push(...executeBehavior(behavior, targets, appliedEffect.grau, context))
  }

  // 4. Targeting das modificações globais (afeta todos os efeitos do poder)
  // AREA já foi tratado fora (candidateTargetIds já chegam corretos)
  // SELETIVO global aplica sobre o conjunto total se presente

  // 5. Efeito colateral no caster
  const temEfeitoColateral = power.globalModifications.some(
    m => m.casterEffect === 'EFEITO_COLATERAL'
  )
  if (temEfeitoColateral) {
    mutations.push({
      type: 'DEAL_DAMAGE',
      targetId: context.casterId,
      formula: power.colateralFormula ?? '2d8',
      damageType: 'sombrio',
      isSelfInflicted: true,
    })
  }

  return mutations
}
```

---

## 10. Executores por kind

Cada `kind` tem um executor isolado — mesma estrutura que `calculate-power-cost.ts`:

```typescript
// automation/behaviors/dano.behavior.ts
function executeDano(
  behavior: Extract<EfeitoBehavior, { kind: 'DANO' }>,
  targets: string[],
  grau: number,
): GameMutation[] {
  const formula = behavior.formula ?? (UNIVERSAL_TABLE.find(r => r.grau === grau)?.dano ?? '1')
  return targets.map(targetId => ({
    type: 'DEAL_DAMAGE' as const,
    targetId,
    formula,
    damageType: behavior.tipoDano,
  }))
}

// automation/behaviors/recuperacao.behavior.ts
function executeRecuperacao(
  behavior: Extract<EfeitoBehavior, { kind: 'RECUPERACAO' }>,
  targets: string[],
): GameMutation[] {
  const mutationType = behavior.recurso === 'PV' ? 'HEAL' : 'RESTORE_PE'
  return targets.map(targetId => ({
    type: mutationType as const,
    targetId,
    formula: behavior.formula,
  }))
}

// automation/behaviors/marcador.behavior.ts
function executeMarcador(
  behavior: Extract<EfeitoBehavior, { kind: 'MARCADOR' }>,
  targets: string[],
  sourcePowerId: string,
): GameMutation[] {
  return targets.map(targetId => ({
    type: 'APPLY_MARKER' as const,
    targetId,
    markerId: behavior.markerId,
    label: behavior.label,
    duracao: behavior.duracao,
    sourcePowerId,
  }))
}

// automation/behaviors/index.ts — lookup por kind
const BEHAVIOR_EXECUTORS = { DANO: executeDano, RECUPERACAO: executeRecuperacao, MARCADOR: executeMarcador }
```

---

## 11. Estado de cena — SceneEffectInstance

Marcadores e gatilhos têm ciclo de vida diferente do `Character` (persistente entre sessões). Eles vivem numa tabela separada, efêmera por cena:

```prisma
model SceneEffectInstance {
  id                String    @id @default(uuid())
  sceneId           String
  kind              String    // 'MARCADOR' | 'GATILHO'
  sourceCharacterId String
  targetCharacterId String?
  sourcePowerId     String
  payload           Json      // validado por Zod específico do kind
  expiresAt         DateTime?
  createdAt         DateTime  @default(now())

  @@index([sceneId])
  @@index([sceneId, targetCharacterId])
  @@index([sceneId, kind])
  @@map("scene_effect_instances")
}
```

Na consulta `PowerUseContext.activeMarkers`, o backend faz um `findMany` filtrando por `sceneId` e `kind = 'MARCADOR'` antes de chamar o motor — o motor recebe o snapshot já pronto, sem I/O.

---

## 12. Gatilhos — Fase 2

O `kind: 'GATILHO'` não produz `GameMutation` imediatamente. Ele registra uma inscrição em `SceneEffectInstance`:

```json
{
  "kind": "GATILHO",
  "evento": "DANO_CORPO_A_CORPO_CAUSADO",
  "condicao": "alvo.tem_marcador:laco-de-odio",
  "efeitosFilhos": ["recuperacao-pv-1d4", "recuperacao-pe-4"]
}
```

Quando o evento ocorre (ex: o caster causa dano corpo a corpo), o backend:
1. Busca `SceneEffectInstance` do `sceneId` com `kind = 'GATILHO'` e `sourceCharacterId` correspondente
2. Avalia a condição contra o contexto atual (alvo tem o marcador certo?)
3. Se bater, executa os efeitos filhos como `GameMutation[]` normais

A Agonia é o caso de validação da Fase 2: depende inteiramente do marcador Laço de Ódio (Fase 1) já existindo na cena.

---

## 13. Estrutura de arquivos

```
packages/rules-engine/src/
├── cost/
│   ├── calculate-power-cost.ts     # já existe
│   └── tables/universal-table.json
├── automation/
│   ├── types.ts                    # GameMutation, PassiveModifier, PowerUseContext, ResolutionMode
│   ├── resolve-power-use.ts        # pipeline principal ON_USE
│   ├── resolve-passive.ts          # resolvePassiveModifiers() para PASSIVE/benefícios/condições
│   ├── behaviors/
│   │   ├── index.ts                # BEHAVIOR_EXECUTORS lookup
│   │   ├── dano.behavior.ts
│   │   ├── recuperacao.behavior.ts
│   │   └── marcador.behavior.ts
│   └── targeting/
│       └── index.ts                # limitadoTransform, seletivoTransform, areaTransform
├── schemas/
│   ├── character.schemas.ts        # já existe
│   ├── domain.schemas.ts           # já existe
│   ├── item.schemas.ts             # já existe
│   └── automation.schemas.ts       # EfeitoBehavior, ModificationBaseAutomation (Zod)
└── index.ts
```

---

## 14. Mudanças necessárias no catálogo

Antes de implementar a Fase 1, o catálogo precisa dos campos novos. Isso afeta:

**`EffectBase` (tabela `effect_bases` + `efeitos.json`)**
- `behavior: Json | null` — o `EfeitoBehavior` serializado, validado por Zod na leitura

**`ModificationBase` (tabela `modification_bases` + `modificacoes.json`)**
- `targetingEffect: String` — `'AREA' | 'SELETIVO' | 'LIMITADO' | 'NENHUM'`
- `casterEffect: String` — `'EFEITO_COLATERAL' | 'NENHUM'`
- `markerCondition: String?` — markerId checado pelo LIMITADO

O seed existente (`seed.ts`) precisa ser atualizado pra preencher esses campos nos registros que serão automatizados na Fase 1.

---

## 15. Plano faseado

**Fase 1 — Primitivos e targeting básico**

Objetivo: resolver os poderes *Laço de Ódio* e *Pacto do Vingador* de ponta a ponta, sem gatilho.

1. Criar `automation/types.ts` com todos os tipos desta seção.
2. Criar `automation/behaviors/` com executores de DANO, RECUPERACAO e MARCADOR.
3. Criar `automation/targeting/index.ts` com LIMITADO, SELETIVO e AREA.
4. Criar `automation/resolve-power-use.ts` com o pipeline principal.
5. Criar `automation/resolve-passive.ts` com `resolvePassiveModifiers()`.
6. Criar `automation/schemas.ts` com o schema Zod de `EfeitoBehavior`.
7. Adicionar campos `behavior`, `targetingEffect`, `casterEffect` e `markerCondition` no Prisma e nos JSONs do catálogo.
8. Atualizar o seed para mapear Dano, Recuperação e Marcador nos efeitos relevantes.
9. Criar `SceneEffectInstance` no schema Prisma.
10. Validar com testes unitários: input dos três poderes → output esperado em `GameMutation[]`.

**Fase 2 — Sistema de gatilho**

Objetivo: resolver *Agonia* de ponta a ponta.

1. Implementar executor `GATILHO` que grava em `SceneEffectInstance`.
2. Implementar o listener de eventos de cena no backend (EventEmitter2), avaliando condições e disparando efeitos filhos.
3. Validar: equipar Agonia → causar dano corpo a corpo em alvo com Laço de Ódio → recuperações ativam automaticamente.

---

## 16. Questões abertas

- **Lista completa de `kind`s passivos:** os identificados cobrem os exemplos analisados, mas o catálogo completo (`efeitos.json`) pode revelar outros. Vale classificar todos os `EffectBase` antes de fechar o schema de `EfeitoBehavior`.
- **Fórmulas de dano passivas:** efeitos como `VULNERABILIDADE_DESCRITOR` registram a informação mas não têm automação ainda. Quando e como isso se torna mecânico precisa ser decidido nas regras antes de entrar no motor.
- **Grau de automação desejado:** o motor produz `GameMutation[]` e o backend aplica. Mas o narrador precisa confirmar antes de aplicar, ou é automático? Isso afeta o design do endpoint que recebe o resultado do motor.
- **Condições com evolução** (ex: Abalado → Apavorado "se ficar abalado novamente"): o `kind: 'CONDITION_ESCALATION'` foi identificado mas ainda não está modelado acima. Entra na Fase 1 ou 2 dependendo de prioridade.
- **Resolução de teste de resistência:** mencionada implicitamente em Laço de Ódio ("não tem teste de resistência" implica que outros poderes têm). Provavelmente um passo adicional no pipeline entre targeting e execução de behavior, a modelar quando houver um poder real que dependa disso.
