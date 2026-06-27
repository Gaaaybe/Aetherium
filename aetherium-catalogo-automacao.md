# Aetherium — Classificação do Catálogo para Automação

Mapeamento de `EfeitoBehavior`, `targetingEffect` e `casterEffect` para cada entrada do catálogo.

> Leitura direta dos arquivos `efeitos.json` e `modificacoes.json`. Use como guia para preencher os campos `behavior`, `targetingEffect`, `casterEffect` e `markerCondition` no seed e no schema Prisma.

---

## 1. Efeitos (`EffectBase.behavior`)

### Legenda de modos

| Símbolo | Significado |
|---|---|
| ✅ Fase 1 | Implementar imediatamente |
| 🔜 Fase 2 | Depende de gatilho ou sistema mais complexo |
| 📖 Narrativo | Sem automação — `kind: 'NARRATIVO'` |
| ⚙️ Passivo | Modifica estado contínuo — `kind` passivo |

---

### 1.1 Efeitos com automação clara (Fase 1)

| id | kind | mode | Observação |
|---|---|---|---|
| `dano` | `DANO` | ON_USE | Fórmula vem da tabela universal pelo grau. Extra `baseado-atributos` soma modificador do caster no executor. |
| `recuperacao` | `RECUPERACAO` | ON_USE | Dois sub-kinds via `configuracaoId`: `dano` → recurso `PV`; `energia` → recurso `PE`. `condicao` e `lesao` são Fase 2 ou Narrativo. |

### 1.2 Efeitos de marcador (Fase 1 — novo kind)

| id | kind | mode | Observação |
|---|---|---|---|
| `afligir` | `APLICAR_CONDICAO` | ON_USE | Aplica uma ou mais condições do sistema (Patamar 1-4). `inputValue` = nome da condição. Diferente de MARCADOR: usa o sistema de condições existente, não cria marcador ad-hoc. |

> **Nota:** `APLICAR_CONDICAO` é um kind novo além dos quatro originalmente planejados. `afligir` é tão central no sistema (base de venenos, paralisias, debuffs de combate) que vale entrar na Fase 1.

### 1.3 Efeitos passivos mecânicos (Fase 1 — resolvePassiveModifiers)

| id | kind | mode | PassiveModifier produzido |
|---|---|---|---|
| `fortalecer` | `FORTALECER` | PASSIVE ou ON_USE | Depende dos parâmetros do poder. Se `acao=5`: `PassiveModifier` com `kind: RESOURCE_MAX_MODIFIER` (PV/PE) ou `ROLL_BONUS` (perícia, atributo). Se `acao!=5`: `GameMutation FORTALECER` temporário → Fase 2. |
| `enfraquecer` | `ENFRAQUECER` | ON_USE | Inverso de FORTALECER. Produz `GameMutation ENFRAQUECER` com `recurso`, `valor` e `alvo`. Fase 1 para sub-tipos `pericia`, `atributo`, `pv`, `pe`. Sub-tipos `critico-*` são Fase 2. |
| `imunidade` | `IMUNIDADE` | PASSIVE | `PassiveModifier { kind: 'IMUNIDADE', descritor: string, patamar: 1-5 }`. Checagem é narrativa na maioria dos casos, mas o registro é útil pra exibição na ficha e futura automação de resistência. |
| `aceleracao` | `MODIFICADOR_MOVIMENTO` | PASSIVE | `PassiveModifier { kind: 'MOVEMENT_MODIFIER', bonus: grau * 2 }` (deslocamento em metros). |
| `voo` | `MODIFICADOR_MOVIMENTO` | PASSIVE | Mesmo kind, `tipoMovimento: 'VOO'`. |
| `natacao` | `MODIFICADOR_MOVIMENTO` | PASSIVE | Mesmo kind, `tipoMovimento: 'NATACAO'`. |
| `salto` | `MODIFICADOR_MOVIMENTO` | PASSIVE | Mesmo kind, `tipoMovimento: 'SALTO'`. |
| `escavacao` | `MODIFICADOR_MOVIMENTO` | PASSIVE | Mesmo kind, `tipoMovimento: 'ESCAVACAO'`. |
| `membros-extras` | `NARRATIVO` | PASSIVE | Mecânica de ações extras com membros é muito situacional para automatizar agora. |

### 1.4 Efeitos narrativos (sem automação)

Todos os abaixo recebem `behavior: { kind: 'NARRATIVO' }`. O sistema os exibe na ficha e o narrador interpreta.

| id | Justificativa |
|---|---|
| `caracteristica` | `inputValue` em texto livre por definição — não tem forma mecânica fixa. Exemplo: "Fotossíntese" vs "Longevidade" são coisas completamente diferentes. |
| `camuflagem` | Depende do sistema de sentidos que ainda não existe como dado estruturado. |
| `compreender` | Comunicação com animais/espíritos/máquinas — consequências totalmente narrativas. |
| `comunicacao` | Igual a compreender — sem mecânica automatizável. |
| `leitura-mental` | Requer teste oposto e sistema de "nível de contato" — Fase 2 no mínimo. |
| `controle-mental` | Idem — teste oposto + patamares de controle — muito complexo para Fase 1. |
| `sentidos` | Amplia percepção — sem mecânica de combate direta automatizável agora. |
| `sentido-remoto` | Desloca percepção — puramente narrativo até ter sistema de cena com posição. |
| `alongamento` | Alcance de toque variável — situacional e narrativo. |
| `crescimento` / `encolhimento` | Modifica tamanho com várias consequências encadeadas — sistema próprio futuro. |
| `intangibilidade` | Exige sistema de "forma atual" no personagem — fora do escopo atual. |
| `mudar-forma` | Idem — cosmético mas narrativamente rico. |
| `imortalidade` | Ressurreição com timer — narrativo, mestre controla. |
| `nulificar` | Cancela poderes ativos — requer sistema de "poderes em uso" na cena. Fase 2+. |
| `ambiente` | Cria zonas com efeitos — requer sistema de posição/área de cena. Fase 2+. |
| `criar` | Materializa objetos — narrativo. |
| `fabricar` | Processo de crafting — totalmente fora do motor de combate. |
| `transformacao` | Altera matéria inanimada — narrativo. |
| `imbuir-poder` | Encantamento de itens — narrativo, fora do combate. |
| `controle-da-sorte` | Manipula inspiração — requer sistema de inscrição de bônus condicional. Fase 2. |
| `ilusao` | Cria percepções falsas — narrativo, mestre arbitra. |
| `invocar` | Lacaio como personagem independente — sistema futuro. |
| `mover-alvo` | Movimentação forçada — requer posição no mapa, fora do escopo atual. |
| `mudar-efeito` | Modifica poderes em uso de outro personagem — Fase 2+. |
| `oscilante` | Pool de PdA realocável — meta-mecânica, fora do motor. |
| `metamorfia` | Forma alternativa como personagem — sistema futuro. |
| `teleporte` | Posicionamento instantâneo — requer sistema de mapa. |
| `movimentacao` | Formas especiais de movimento — narrativo. |

### 1.5 Efeito com kind próprio para Fase 2

| id | kind futuro | Dependência |
|---|---|---|
| `afligir` (condições com evolução) | `APLICAR_CONDICAO` com `evolucao: true` | Requer sistema de condição escalável — `CONDITION_ESCALATION` |
| `recuperacao` (sub-tipo `condicao`) | `REMOVER_CONDICAO` | Requer sistema de condições estruturado |
| `enfraquecer` / `fortalecer` (duração temporária) | `FORTALECER_TEMPORARIO` / `ENFRAQUECER_TEMPORARIO` | Requer rastreamento de buffs/debuffs com duração na cena |
| `nulificar` | `NULIFICAR` | Requer sistema de "poderes ativos em cena" |

---

## 2. Modificações (`ModificationBase`) — targetingEffect e casterEffect

### 2.1 Mapeamento de targeting e caster effect

| id | targetingEffect | casterEffect | markerCondition | Observação |
|---|---|---|---|---|
| `area` | `AREA` | `NENHUM` | — | Expande candidatos para todos numa forma geométrica. Formato e tamanho vêm dos `parametros` da AppliedModification. |
| `seletivo` | `SELETIVO` | `NENHUM` | — | O jogador filtra quem entre os candidatos é afetado. Variante `restrito` tem filtro fixo (ex: "apenas inimigos"); `variavel` é livre por uso. |
| `limitado` | `LIMITADO` | `NENHUM` | Depende do `inputValue` | Filtra candidatos por condição específica. Quando a condição for um marcador rastreável (ex: "apenas alvos com Laço de Ódio"), `markerCondition` recebe o `markerId`. Condições não rastreáveis (ex: "apenas sob luz da lua") ficam como `NARRATIVO` — narrador decide. |
| `efeito-colateral` | `NENHUM` | `EFEITO_COLATERAL` | — | Aplica consequência negativa no caster. Configuração `ao-falhar` = só se o poder falhar; `sempre` = toda ativação. O executor usa `inputValue` ou `parametros.descricao` para determinar o que acontece. Automação plena só quando o colateral for do tipo `DANO` com fórmula definida. |
| `dividido` | `SELETIVO` | `NENHUM` | — | Variante de SELETIVO: divide graus entre múltiplos alvos escolhidos. Grau de cada alvo vem dos `parametros`. |
| `afeta-outros` | `NENHUM` | `NENHUM` | — | Permite compartilhar poder pessoal — muda quem pode ser alvo mas não é targeting no sentido do pipeline. Tratar como ajuste de alcance. |
| `afeta-objetos` | `NENHUM` | `NENHUM` | — | Habilita categoria de alvo (objetos inanimados). Não filtra o conjunto — expande o tipo de candidatos. |
| `afeta-intangivel` | `NENHUM` | `NENHUM` | — | Idem — expande tipo de candidatos. |
| `afeta-corporeo` | `NENHUM` | `NENHUM` | — | Idem — contexto de intangibilidade do caster. |
| `contagioso` | `AREA` | `NENHUM` | — | Variante de AREA: expande por contato a partir do alvo original. Lógica própria futura (Fase 2). |
| Todos os demais | `NENHUM` | `NENHUM` | — | Só contribuem para custo ou são narrativos. |

### 2.2 Modificações que afetam o pipeline mas não o targeting

Essas modificações precisam ser checadas no executor de behavior, não no targeting:

| id | Onde afeta | O que muda |
|---|---|---|
| `baseado-atributos` | Executor de DANO | Soma `casterSnapshot.keyModifier` à fórmula de dano. |
| `escalonamento-dano` | Executor de DANO | Escala dano base pelo nível/evolução do caster. |
| `efeito-secundario` | Pipeline ON_USE | Registra segundo disparo pro fim do próximo turno — Fase 2. |
| `engatilhado` | Pipeline ON_USE | Arma o efeito em vez de disparar imediatamente — Fase 2 (usa `SceneEffectInstance`). |
| `progressiva` | Executor de APLICAR_CONDICAO | Condição evolui automaticamente se alvo falhar no teste — Fase 2. |
| `dano-continuo` | Executor de APLICAR_CONDICAO | Condição causa dano no início de cada turno — Fase 2. |
| `descarga` | Executor de DANO | Multiplica dados pagando PE múltiplas vezes — Fase 2. |

### 2.3 Modificações puramente de custo (não afetam pipeline)

Todos os abaixo contribuem apenas para o cálculo de custo e não têm impacto no motor de automação:

`inato`, `suscetibilidade`, `duracao-permanente`, `efeito-duradouro`, `custo-pe-dobrado`, `custo-pe-total`, `custo-pe-reduzido`, `custo-pe-minimo`, `dominio-iniciante`, `dominio-mestre`, `corpo-a-corpo-estendido`, `a-distancia-estendido`, `aumentar-massa`, `ativacao`, `cansativo`, `distracao`, `dissipacao`, `distancia-reduzida`, `exige-teste`, `inconstante`, `incontrolavel`, `impreciso`, `dependente-sentido`, `baseado-agarrar`, `sutil`, `traicoeiro`, `teleguiado`, `ricochetear`, `resistivel`, `retroalimentacao`, `perceptivel`, `peculiaridade`, `caracteristica` (modificação), `descritor-variavel`, `dimensional`, `amplo`, `condicao-extra`, `recuperacao-instantanea`, `exige-resistencia`, `dano-critico`.

---

## 3. Casos especiais que precisam de decisão antes de implementar

### 3.1 `limitado` com condição não-rastreável

`limitado` é a modificação mais ambígua: às vezes a condição é rastreável pelo sistema ("apenas alvos com Laço de Ódio" → `markerCondition: 'laco-de-odio'`), às vezes é situacional ("apenas sob luz da lua", "apenas contra mortos-vivos", "apenas ao causar dano corpo a corpo"). Para os casos não rastreáveis, a saída mais segura é `markerCondition: null` — o motor não filtra, e o executor trata a condição como `NARRATIVO` no campo de observação. Narrador aplica a limitação manualmente.

### 3.2 `efeito-colateral` com consequência não-dano

No Pacto do Vingador o colateral é `"Custa PVs"` — dano no caster com fórmula definida. Na Biologia Namek o colateral é `"Não recebe benefícios de nenhuma alimentação"` — narrativo puro. O executor deve verificar: se `parametros.descricao` contém uma fórmula de dano reconhecível, produz `GameMutation DEAL_DAMAGE isSelfInflicted`. Caso contrário, registra o colateral como nota na `SceneEffectInstance` para exibição ao narrador.

### 3.3 `fortalecer` passivo vs temporário

`fortalecer` com `acao=5` (sempre ativo) é um `PassiveModifier`. `fortalecer` com `acao!=5` (buffa o alvo por uma duração) é uma `GameMutation` com duração — isso exige rastreamento de buffs ativos na cena, que é Fase 2. Para a Fase 1, automatizar apenas a variante passiva.

### 3.4 `afligir` e o sistema de condições

`afligir` produz condições do sistema (Abalado, Caído, Faminto etc.), não marcadores ad-hoc. Isso significa que as condições precisam existir como dado estruturado com seus `PassiveModifier`s mapeados antes de `afligir` poder ser automatizado completamente. O executor de `APLICAR_CONDICAO` só resolve automaticamente condições que já estejam no catálogo com `behavior` definido. Condições sem mapeamento ficam como nota para o narrador.

---

## 4. Schema Zod — tipos revisados com base no catálogo completo

```typescript
// packages/rules-engine/src/schemas/automation.schemas.ts

export const EfeitoBehaviorSchema = z.discriminatedUnion('kind', [
  // Fase 1 — ON_USE
  z.object({ kind: z.literal('DANO'),
    formula: z.string().optional(),   // null = tabela universal pelo grau
    tipoDano: z.string() }),

  z.object({ kind: z.literal('RECUPERACAO'),
    recurso: z.enum(['PV', 'PE']),
    formula: z.string() }),

  z.object({ kind: z.literal('APLICAR_CONDICAO'),
    condicaoId: z.string(),           // id da condição no catálogo
    patamar: z.number().int().min(1).max(4) }),

  // Fase 1 — PASSIVE
  z.object({ kind: z.literal('MODIFICADOR_MOVIMENTO'),
    tipoMovimento: z.enum(['TERRESTRE', 'VOO', 'NATACAO', 'SALTO', 'ESCAVACAO']),
    bonus: z.number().optional(),
    multiplier: z.number().optional() }),

  z.object({ kind: z.literal('IMUNIDADE'),
    descritor: z.string(),
    patamar: z.number().int().min(1).max(6) }),

  z.object({ kind: z.literal('FORTALECER_PASSIVO'),
    alvo: z.enum(['PV_MAX', 'PE_MAX', 'PERICIA', 'ATRIBUTO', 'DANO', 'RD']),
    formula: z.string() }),

  // Fase 2 (placeholder — definição completa depois)
  z.object({ kind: z.literal('GATILHO'),
    evento: z.string(),
    condicao: z.string(),
    efeitosFilhos: z.array(z.string()) }),

  z.object({ kind: z.literal('FORTALECER_TEMPORARIO'),
    alvo: z.string(),
    formula: z.string() }),

  z.object({ kind: z.literal('ENFRAQUECER'),
    alvo: z.string(),
    formula: z.string() }),

  // Narrativo — sem automação
  z.object({ kind: z.literal('NARRATIVO'),
    descricao: z.string().optional() }),
])

export type EfeitoBehavior = z.infer<typeof EfeitoBehaviorSchema>

export const ModificationAutomationSchema = z.object({
  targetingEffect: z.enum(['AREA', 'SELETIVO', 'LIMITADO', 'NENHUM']),
  casterEffect: z.enum(['EFEITO_COLATERAL', 'NENHUM']),
  markerCondition: z.string().nullable(),  // markerId checado pelo LIMITADO
})
```

---

## 5. Prioridade de implementação (Fase 1 revisada)

Com base no catálogo completo, a Fase 1 cobre:

**Efeitos:** `dano`, `recuperacao` (sub-tipos PV e PE), `afligir` (condições simples sem evolução).

**Modificações de targeting:** `area`, `seletivo`, `limitado` (apenas quando `markerCondition` está definido), `efeito-colateral` (apenas quando consequência é dano com fórmula).

**Modificações no executor:** `baseado-atributos` (soma modificador ao dano).

**Passivos:** `fortalecer` (variante `acao=5`), `imunidade`, `aceleracao`, `voo`, `natacao`, `salto`, `escavacao`.

Tudo isso já cobre: Laço de Ódio (MARCADOR → ainda sem kind, mas o marcador é uma `SceneEffectInstance` criada manualmente por enquanto), Pacto do Vingador (DANO × 2 com SELETIVO + LIMITADO + AREA + EFEITO_COLATERAL), e boa parte dos poderes de movimento e buff passivo do catálogo.

**O que fica para Fase 2:** buffs/debuffs temporários com duração, condições com evolução, dano contínuo, gatilhos, efeito secundário, nulificar, controle mental, marcadores ad-hoc (Laço de Ódio como `kind: MARCADOR` completo).
