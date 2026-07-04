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
  allRolls: number[];
  modifier: number;
  advantage: number; // >0 para vantagem, <0 para desvantagem
  isCritical: boolean;
  isFumble: boolean;
  timestamp: Date;
}

/**
 * Rola um d20 com modificador e suporte a múltiplas vantagens/desvantagens
 * @param modifier Modificador a ser somado
 * @param extraDice Quantidade de dados extras a rolar (0 a 6)
 * @param rule Regra de escolha ('advantage' | 'disadvantage' | 'normal')
 * @param critMargin Valor mínimo no d20 para considerar crítico (padrão 20)
 */
export function rollD20(
  modifier: number = 0, 
  extraDice: number = 0, 
  rule: 'advantage' | 'disadvantage' | 'normal' = 'normal',
  critMargin: number = 20
): RollResult {
  const numDice = 1 + extraDice;
  const rolls: number[] = [];
  
  for (let i = 0; i < numDice; i++) {
    rolls.push(Math.floor(Math.random() * 20) + 1);
  }
  
  let d20: number;
  if (rule === 'advantage') {
    d20 = Math.max(...rolls);
  } else if (rule === 'disadvantage') {
    d20 = Math.min(...rolls);
  } else {
    d20 = rolls[0];
  }
  
  const total = d20 + modifier;
  
  return {
    total,
    d20,
    allRolls: rolls,
    modifier,
    advantage: rule === 'advantage' ? extraDice : rule === 'disadvantage' ? -extraDice : 0,
    isCritical: d20 >= critMargin,
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
 * Rola dano (ex: "2d6+5", "1d8 + 1d6 + 5") com suporte a multiplicador de crítico.
 * O multiplicador afeta o resultado final do dano (soma total).
 */
export function rollDamage(damageFormula: string, multiplier: number = 1): { total: number; rolls: number[]; modifier: number; baseTotal: number; components: Array<{ value: number; label: string }> } {
  const cleanFormula = damageFormula.replace(/\s+/g, ' ');
  const parts = cleanFormula.split(/([+-])/);
  
  let currentSign = 1;
  let baseTotal = 0;
  let finalTotal = 0;
  let modifier = 0;
  const allRolls: number[] = [];
  const components: Array<{ value: number; label: string }> = [];

  for (const rawPart of parts) {
    const part = rawPart.trim();
    if (part === '+') {
      currentSign = 1;
      continue;
    }
    if (part === '-') {
      currentSign = -1;
      continue;
    }
    if (!part) continue;

    const annotations: string[] = [];
    const annotationRegex = /\[([^\]]*)\]/g;
    let match;
    while ((match = annotationRegex.exec(part)) !== null) {
      annotations.push(match[1].trim());
    }
    const annotation = annotations.join('] [');
    
    const cleanPart = part.replace(/\[[^\]]*\]/g, '').trim().toLowerCase();
    const isAcopladoComponent = part.toLowerCase().includes('acoplado');

    const diceMatch = cleanPart.match(/^(\d+)d(\d+)$/);
    if (diceMatch) {
      const numDice = parseInt(diceMatch[1], 10);
      const diceSides = parseInt(diceMatch[2], 10);
      const rolls: number[] = [];
      let partSum = 0;
      for (let i = 0; i < numDice; i++) {
        const roll = Math.floor(Math.random() * diceSides) + 1;
        allRolls.push(roll);
        rolls.push(roll);
        partSum += roll;
      }
      const val = partSum * currentSign;
      baseTotal += val;
      
      const componentMultiplier = isAcopladoComponent ? 1 : multiplier;
      finalTotal += val * componentMultiplier;

      components.push({
        value: val * componentMultiplier,
        label: `${numDice}d${diceSides}${annotation ? ` [${annotation}]` : ''} (${rolls.join('+')})${componentMultiplier > 1 ? ` x${componentMultiplier}` : ''}`
      });
    } else {
      const flatValue = parseInt(cleanPart, 10);
      if (!isNaN(flatValue)) {
        const val = flatValue * currentSign;
        baseTotal += val;
        modifier += val;

        const componentMultiplier = isAcopladoComponent ? 1 : multiplier;
        finalTotal += val * componentMultiplier;

        components.push({
          value: val * componentMultiplier,
          label: annotation ? `${flatValue} [${annotation}]${componentMultiplier > 1 ? ` x${componentMultiplier}` : ''}` : `${flatValue}${componentMultiplier > 1 ? ` x${componentMultiplier}` : ''}`
        });
      }
    }
  }

  return { 
    total: finalTotal, 
    rolls: allRolls, 
    modifier, 
    baseTotal,
    components
  };
}

/**
 * Formata resultado de rolagem para exibição
 */
export function formatRollResult(result: RollResult): string {
  const criticalText = result.isCritical ? ' ⭐ CRÍTICO!' : result.isFumble ? ' 💀 FALHA!' : '';
  const modifierText = result.modifier >= 0 ? `+${result.modifier}` : `${result.modifier}`;
  
  let advantageText = '';
  if (result.advantage > 0) {
    advantageText = ` (Vantagem: [${result.allRolls.join(', ')}])`;
  } else if (result.advantage < 0) {
    advantageText = ` (Desvantagem: [${result.allRolls.join(', ')}])`;
  }
  
  return `🎲 ${result.d20} ${modifierText} = ${result.total}${criticalText}${advantageText}`;
}
