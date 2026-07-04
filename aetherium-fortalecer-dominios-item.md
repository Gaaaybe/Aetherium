# Aetherium — Fortalecer Dano/Recuperação e Domínios de Item

Design do sub-tipo `dano`/`recuperacao` do efeito Fortalecer e reestruturação de domínios em itens.

---

## 1. Contexto

O efeito `fortalecer` com configuração `dano` ou `recuperacao` permite ao personagem aumentar o dano (ou cura) proveniente de uma fonte específica — um domínio de poder ou uma categoria de arma. O bônus tem tipo de dano próprio (descritor), que pode ser diferente do dano original.

O desafio é que "tipo de dano" no sistema é um **descritor livre** — não um enum fixo. O sistema explicitamente deixa isso a cargo do narrador e dos jogadores. Tentar enumerar todos os tipos possíveis (Fogo, Frio, Sombrio, etc.) vai contra o design do jogo e cria manutenção desnecessária.

---

## 2. Alvo do Fortalecer (compra do efeito)

O alvo é discriminado por tipo, sem texto livre:

```typescript
type FortaleceAlvo =
  | { tipo: 'DOMINIO';   dominio: DomainName }  // cobre poderes E armas pelo domínio
  | { tipo: 'DESARMADO' }                        // separado — já é tratado separado na ficha
```

`DomainName` já cobre todos os casos necessários:

- Poderes: o poder tem `dominio: DomainName` — matching direto.
- Armas: cada arma tem `domains: DomainName[]` (ver seção 4) — `source.domains.includes(alvo.dominio)`.
- Desarmado: caso especial já separado na ficha — tipo próprio sem domínio.

Não é necessário um enum de categoria de arma separado (CORTE, PERFURACAO etc.) porque o domínio já cumpre esse papel de forma estruturada: uma espada é `ARMA_BRANCA`, um arco é `ARMA_TENSAO`, uma pistola é `ARMA_FOGO`.

---

## 3. Tipo do bônus (descritor)

O descritor do bônus de dano é **texto livre** — o jogador define na compra do efeito:

```typescript
interface FortaleceDanoConfig {
  alvo: FortaleceAlvo
  bonusDescritor: string   // ex: 'Fogo', 'Sombrio', 'Físico', 'Mesmo tipo do alvo'
}
```

Isso está alinhado com o design do sistema: descritores são palavras-chave de sabor e contexto, não categorias enumeradas. O sistema não faz lógica automática em cima do descritor — ele é exibido na fórmula de dano para o narrador aplicar resistências e imunidades manualmente.

Tentar enumerar (Fogo, Frio, Ácido, Sônico...) criaria um enum infinito impossível de manter e iria contra a filosofia do sistema.

---

## 4. Mudança nos itens: `domains: DomainName[]`

### 4.1 Problema atual

Hoje o `Item` tem `domainName: DomainName` — um único domínio. Isso não cobre o caso real de uma arma com múltiplos domínios: uma espada mágica pode ser simultaneamente `ARMA_BRANCA` (técnica) e `NATURAL` (espiritual). O matching do Fortalecer não funcionaria corretamente com um campo único. Itens também podem ter dominio nenhum.

### 4.2 Mudança

```prisma
// schema.prisma — Item
// Antes:
domainName             DomainName
domainAreaConhecimento String?
domainPeculiarId       String?

// Depois:
domains                DomainName[]   // suporta múltiplos domínios
domainAreaConhecimento String?        // mantido — área de conhecimento ainda faz sentido
domainPeculiarIds      String[]       // plural: item pode ter mais de uma peculiaridade
```

### 4.3 Impacto

- O seed e os dados existentes precisam ser migrados: `domainName` vira `domains: [domainName]`.
- O `item.schemas.ts` no `rules-engine` precisa refletir o array.
- O criador de item no frontend passa a permitir seleção de múltiplos domínios.
- O matching no executor usa `source.domains.includes(alvo.dominio)`.

---

## 5. Fórmula de progressão

O bônus cresce dobrando a cada grau:

$$\text{bônus} = 4 \times 2^{(\text{grau} - 1)}$$

| Grau | Bônus |
|---|---|
| 1 | +4 |
| 2 | +8 |
| 3 | +16 |
| 4 | +32 |
| 5 | +64 |
| 6 | +128 |
| 7 | +256 |
| 8 | +512 |
| 9 | +1024 |

```typescript
function calcularBonusFortalecer(grau: number): number {
  return 4 * Math.pow(2, grau - 1)
}
```

---

## 6. Output do executor

O executor de `FORTALECER_DANO` não produz `GameMutation` diretamente — ele produz um `DamageComponent` adicional que é somado à fórmula de dano da fonte original:

```typescript
interface DamageComponent {
  formula: string      // ex: '+8', '+64'
  descritor: string    // ex: 'Fogo' — vem do bonusDescritor da compra
}

function executeFortalecer(
  config: FortaleceDanoConfig,
  grau: number,
  source: DamageSource,
): DamageComponent | null {
  if (!fortaleceAlvoMatch(config.alvo, source)) return null

  return {
    formula: `+${calcularBonusFortalecer(grau)}`,
    descritor: config.bonusDescritor,
  }
}
```

O resultado na fórmula final de dano fica legível e separado por tipo:

```
1d8 [Físico] + 8 [Fogo]    ← arma com Fortalecer Dano (Fogo) grau 2
```

Isso mantém os tipos de dano distinguíveis para resistências e imunidades — o narrador vê `[Fogo]` e aplica a imunidade correspondente se o alvo a tiver.

---

## 7. Função de matching

```typescript
type DamageSource =
  | { tipo: 'PODER';    dominio: DomainName }
  | { tipo: 'ARMA';     domains: DomainName[] }
  | { tipo: 'DESARMADO' }

function fortaleceAlvoMatch(alvo: FortaleceAlvo, source: DamageSource): boolean {
  if (alvo.tipo === 'DESARMADO') {
    return source.tipo === 'DESARMADO'
  }

  if (alvo.tipo === 'DOMINIO') {
    if (source.tipo === 'PODER') return source.dominio === alvo.dominio
    if (source.tipo === 'ARMA')  return source.domains.includes(alvo.dominio)
    return false  // DESARMADO não bate com DOMINIO
  }

  return false
}
```

---

## 8. Onde isso vive no monorepo

```
packages/rules-engine/src/
└── automation/
    └── behaviors/
        └── fortalecer.behavior.ts   # calcularBonusFortalecer + executeFortalecer + fortaleceAlvoMatch

apps/web/src/
└── features/
    └── criador-de-item/
        └── components/
            └── DominiosSelect.tsx   # multi-select de DomainName[] em vez de select único

apps/api/src/
└── modules/
    └── item-manager/
        └── dto/
            └── item.dto.ts          # domains: z.array(DomainNameSchema)
```

---

## 9. Questões abertas

- **`domainPeculiarIds` no item:** hoje é um único ID. Um item pode de fato ter mais de uma peculiaridade vinculada, ou o plural é desnecessário?
- **`domainAreaConhecimento` com múltiplos domínios:** esse campo hoje é único. Se o item tem dois domínios, um deles pode ser de área de conhecimento e o outro não — como representar isso? Provavelmente vira `{ dominio: DomainName, areaConhecimento?: string }[]` em vez de campos separados.
- **`FORTALECER_RECUPERACAO`:** a lógica é idêntica à de dano, só muda o que é somado (fórmula de cura em vez de dano). Vale um executor separado ou um único com flag `modo: 'DANO' | 'RECUPERACAO'`?
