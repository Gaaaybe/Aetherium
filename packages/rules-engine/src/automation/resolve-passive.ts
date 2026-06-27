import type { PassiveContext, PassiveModifier, EfeitoBehavior } from './types.js';

/**
 * Converte um EfeitoBehavior passivo em PassiveModifier com sourceId.
 * Retorna null para behaviors que não produzem modificador passivo.
 */
function toPassiveModifier(behavior: EfeitoBehavior, sourceId: string): PassiveModifier | null {
  switch (behavior.kind) {
    case 'BONUS_ROLAGEM':
      return {
        kind: 'ROLL_BONUS',
        rollType: behavior.rollType,
        value: behavior.value,
        isAdvantage: behavior.isAdvantage,
        sourceId,
      };
    case 'MODIFICADOR_RECURSO':
      return {
        kind: 'RESOURCE_MAX_MODIFIER',
        recurso: behavior.recurso,
        formula: behavior.formula,
        sourceId,
      };
    case 'BLOQUEIO_RECUPERACAO':
      return {
        kind: 'BLOCK_RESOURCE_RECOVERY',
        recurso: behavior.recurso,
        sourceId,
      };
    case 'MODIFICADOR_MOVIMENTO':
      return {
        kind: 'MOVEMENT_MODIFIER',
        multiplier: behavior.multiplier,
        bonus: behavior.bonus,
        sourceId,
      };
    default:
      return null;
  }
}

/**
 * Resolve todos os modificadores passivos ativos de um personagem.
 *
 * Recebe:
 *   - poderes passivos equipados (acao = 5, behavior mecânico)
 *   - benefícios ativos com behavior mapeado
 *   - condições ativas (Fase 1: apenas as que tiverem behavior mapeado)
 *
 * Devolve PassiveModifier[] combinados de todas as fontes.
 * Qualquer sistema que precise de modificadores passivos (rolagem, regen de PE,
 * movimentação) deve chamar essa função em vez de ter lógica espalhada.
 *
 * Condições com behavior ainda não mapeado são ignoradas silenciosamente —
 * o narrador as resolve na mesa (activeConditions[] string é mantido para exibição na ficha).
 */
export function resolvePassiveModifiers(ctx: PassiveContext): PassiveModifier[] {
  const modifiers: PassiveModifier[] = [];

  // Poderes passivos equipados
  for (const passivePower of ctx.equippedPassivePowers) {
    const mod = toPassiveModifier(passivePower.behavior, passivePower.powerId);
    if (mod) modifiers.push(mod);
  }

  // Benefícios ativos
  for (const benefit of ctx.activeBenefits) {
    const mod = toPassiveModifier(benefit.behavior, benefit.benefitId);
    if (mod) modifiers.push(mod);
  }

  return modifiers;
}
