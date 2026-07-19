import { UNIVERSAL_TABLE } from '../../cost/calculate-power-cost.js';
import type { EfeitoBehavior, GameMutation, PowerUseContext } from '../types.js';

/**
 * Executor de RECUPERACAO.
 * Gera HEAL para PV ou RESTORE_PE para PE em cada alvo.
 *
 * Se o recurso for PV e a fórmula for 'tabela' ou ausente, usa a coluna `dano` da tabela universal pelo grau.
 * Se o recurso for PE e a fórmula for 'tabela' ou ausente, usa a regra de grau * 4.
 *
 * `context` é usado para aplicar a modificação `baseado-atributos`:
 * soma keyPhysicalModifier (ou keyMentalModifier se espiritual) do caster à fórmula.
 */
export function executeRecuperacao(
  behavior: Extract<EfeitoBehavior, { kind: 'RECUPERACAO' }>,
  targets: string[],
  grau: number,
  context?: PowerUseContext,
  basedOnAttribute = false,
  dadoModularizado?: string,
  isRecuperacaoAcoplada = false,
): GameMutation[] {
  const type = behavior.recurso === 'PV' ? ('HEAL' as const) : ('RESTORE_PE' as const);

  const row = UNIVERSAL_TABLE.find((r) => r.grau === grau);
  const baseRecuperacao = isRecuperacaoAcoplada && behavior.recurso === 'PV'
    ? `1d${4 * Math.pow(2, Math.max(1, grau) - 1)}`
    : (behavior.recurso === 'PV'
      ? (row?.dano ?? '1d6')
      : String(grau * 4));

  const formulaVal = (behavior.formula && behavior.formula !== 'tabela') ? behavior.formula : undefined;
  let formula = behavior.recurso === 'PE'
    ? baseRecuperacao
    : (dadoModularizado ?? formulaVal ?? baseRecuperacao);

  if (basedOnAttribute && context && behavior.recurso !== 'PE') {
    const mod = context.isEspiritual
      ? context.casterState.keyMentalModifier
      : context.casterState.keyPhysicalModifier;
    if (mod > 0) formula = `${formula}+${mod}`;
    else if (mod < 0) formula = `${formula}${mod}`;
  }

  return targets.map((targetId) => ({
    type,
    targetId,
    formula,
  }));
}
