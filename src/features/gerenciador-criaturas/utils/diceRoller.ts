/**
 * Utilitários de Rolagem de Dados
 * Sistema simples e provisório para rolagem de dados d20
 */

/**
 * Resultado de uma rolagem
 */
export interface RollResult {
  total: number;
  d20: number;
  modifier: number;
  isCritical: boolean;
  isFumble: boolean;
  timestamp: Date;
}

/**
 * Rola um d20 com modificador
 */
export function rollD20(modifier: number = 0): RollResult {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const total = d20 + modifier;
  
  return {
    total,
    d20,
    modifier,
    isCritical: d20 === 20,
    isFumble: d20 === 1,
    timestamp: new Date(),
  };
}

/**
 * Rola múltiplos dados (ex: 2d6, 3d8)
 */
export function rollDice(numDice: number, diceSides: number): number {
  let total = 0;
  for (let i = 0; i < numDice; i++) {
    total += Math.floor(Math.random() * diceSides) + 1;
  }
  return total;
}

/**
 * Rola dano (ex: "2d6+5")
 * Formato: XdY+Z ou XdY-Z
 */
export function rollDamage(damageFormula: string): { total: number; rolls: number[]; modifier: number } {
  const match = damageFormula.match(/(\d+)d(\d+)([+-]\d+)?/i);
  
  if (!match) {
    // Se não for uma fórmula válida, retorna 0
    return { total: 0, rolls: [], modifier: 0 };
  }
  
  const numDice = parseInt(match[1]);
  const diceSides = parseInt(match[2]);
  const modifier = match[3] ? parseInt(match[3]) : 0;
  
  const rolls: number[] = [];
  let total = 0;
  
  for (let i = 0; i < numDice; i++) {
    const roll = Math.floor(Math.random() * diceSides) + 1;
    rolls.push(roll);
    total += roll;
  }
  
  total += modifier;
  
  return { total, rolls, modifier };
}

/**
 * Formata resultado de rolagem para exibição
 */
export function formatRollResult(result: RollResult): string {
  const criticalText = result.isCritical ? ' ⭐ CRÍTICO!' : result.isFumble ? ' 💀 FALHA!' : '';
  const modifierText = result.modifier >= 0 ? `+${result.modifier}` : `${result.modifier}`;
  return `🎲 ${result.d20} ${modifierText} = ${result.total}${criticalText}`;
}
