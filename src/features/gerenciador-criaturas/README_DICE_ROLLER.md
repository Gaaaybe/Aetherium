# Sistema de Rolagem de Dados 🎲

> ⚠️ **SISTEMA PROVISÓRIO** - Este é um sistema temporário e simplificado para testes e desenvolvimento inicial. Será substituído por um sistema mais robusto no futuro.

Sistema básico de rolagem de dados para o Gerenciador de Criaturas.

## Componentes

### `DiceRoller`
Modal interativo para rolagem de dados d20 e dano.

**Props:**
- `label`: Nome do teste (ex: "Ataque com Espada")
- `modifier`: Modificador a ser aplicado no d20
- `damageFormula`: Fórmula de dano opcional (ex: "2d6+5")
- `onClose`: Callback ao fechar o modal

**Características:**
- Rolagem de ataque (d20 + modificador)
- Indica críticos (natural 20) e falhas (natural 1)
- Rolagem de dano separada
- Interface limpa e visual

### Utilitários (`diceRoller.ts`)

**Funções disponíveis:**

#### `rollD20(modifier: number): RollResult`
Rola um d20 com modificador.

```typescript
const result = rollD20(5);
// { total: 18, d20: 13, modifier: 5, isCritical: false, isFumble: false }
```

#### `rollDice(numDice: number, diceSides: number): number`
Rola múltiplos dados (ex: 2d6, 3d8).

```typescript
const damage = rollDice(2, 6); // Rola 2d6
```

#### `rollDamage(damageFormula: string)`
Rola dano baseado em fórmula (ex: "2d6+5").

```typescript
const result = rollDamage("2d6+5");
// { total: 14, rolls: [4, 5], modifier: 5 }
```

#### `formatRollResult(result: RollResult): string`
Formata resultado para exibição.

```typescript
formatRollResult(result);
// "🎲 13 +5 = 18"
// "🎲 20 +5 = 25 ⭐ CRÍTICO!"
// "🎲 1 +5 = 6 💀 FALHA!"
```

## Uso no CreatureNode

O sistema já está integrado nos cards de criaturas. **Todas as rolagens são clicáveis:**

### 1. **Ataques** 🎲
- Abra o painel lateral da criatura
- Passe o mouse sobre qualquer ataque
- Clique no ícone roxo 🎲
- Rola: `1d20 + bônus de ataque` e depois `fórmula de dano + bônus`

### 2. **Atributos** 🎲
- No card principal, seção "ATRIBUTOS"
- Passe o mouse sobre For, Des, Con, Int, Sab ou Car
- Clique (ícone azul aparece)
- Rola: `1d20 + modificador do atributo`

### 3. **Resistências** 🎲
- Seção "RESISTÊNCIAS"
- Clique em Fortitude, Reflexos ou Vontade
- Ícone verde 🎲 aparece no hover
- Rola: `1d20 + bônus de resistência`

### 4. **Perícias-Chave** 🎲
- Seção "PERÍCIAS-CHAVE"
- Clique em qualquer perícia listada
- Ícone roxo 🎲 aparece no hover
- Rola: `1d20 + bônus da perícia`

## Exemplos de Uso

### Rolagem simples de perícia
```tsx
<DiceRoller
  label="Percepção"
  modifier={8}
  onClose={() => setShowRoller(false)}
/>
```

### Rolagem de ataque com dano
```tsx
<DiceRoller
  label="Espada Longa"
  modifier={5}
  damageFormula="1d8+3"
  onClose={() => setShowRoller(false)}
/>
```

### Uso direto das funções
```typescript
import { rollD20, rollDamage } from '../utils/diceRoller';

// Rolagem de perícia
const skillCheck = rollD20(8);
console.log(`Resultado: ${skillCheck.total}`);

// Rolagem de dano
const damage = rollDamage("3d6+5");
console.log(`Dano: ${damage.total}`);
```

## Melhorias Futuras

> 🚧 **Este sistema será substituído** - As funcionalidades abaixo são sugestões para o sistema definitivo:

- [ ] Histórico de rolagens persistente
- [ ] Rolagens com vantagem/desvantagem
- [ ] Som de dados ao rolar
- [ ] Animação de rolagem dos dados
- [ ] Suporte a rolagens múltiplas simultâneas
- [ ] Integração com log de combate
- [ ] Compartilhamento de resultados entre jogadores
- [ ] Rolagens secretas do mestre
- [ ] Atalhos de teclado
- [ ] Rolagens customizadas com fórmulas complexas
- [ ] Modificadores temporários (buffs/debuffs)
- [ ] Sistema de reroll/advantage
- [ ] Estatísticas de rolagens

## Limitações Conhecidas (Sistema Provisório)

⚠️ **Funcionalidades ausentes temporariamente:**
- Não há histórico de rolagens (cada rolagem é independente)
- Não persiste dados entre sessões
- Não há comunicação multiplayer
- Interface simplificada sem animações complexas
- Sem validação de regras avançadas

## Notas Técnicas

⚠️ **Sistema Provisório - Implementação Atual:**
- Totalmente funcional no lado do cliente
- **Não persiste histórico** entre sessões ou reloads
- Usa `Math.random()` para aleatoriedade (suficiente para testes)
- Modal com backdrop para evitar cliques acidentais
- Compatível com dark mode
- Performance otimizada para uso local

**Quando substituir este sistema:**
- Quando implementar funcionalidades multiplayer
- Quando adicionar histórico de combate persistente
- Quando necessitar validação de regras mais complexa
- Quando integrar com backend para sincronização
