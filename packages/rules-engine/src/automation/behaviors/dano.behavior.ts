import { UNIVERSAL_TABLE } from '../../cost/calculate-power-cost.js';
import type { EfeitoBehavior, GameMutation, PowerUseContext } from '../types.js';

/**
 * Executor de DANO.
 * Se o behavior não traz formula, usa a coluna `dano` da tabela universal pelo grau.
 * Fallback final: '1d6' para não produzir mutation vazia.
 *
 * `context` é usado para aplicar a modificação `baseado-atributos`:
 * soma keyPhysicalModifier do caster à fórmula (ex: '1d8' + mod 3 → '1d8+3').
 * O chamador (resolve-power-use) passa a flag `basedOnAttribute` quando detecta
 * a modificação no efeito.
 */
export function executeDano(
  behavior: Extract<EfeitoBehavior, { kind: 'DANO' }>,
  targets: string[],
  grau: number,
  context: PowerUseContext,
  basedOnAttribute = false,
  dadoModularizado?: string,
  isDanoAcoplado = false,
): GameMutation[] {
  const row = UNIVERSAL_TABLE.find((r) => r.grau === grau);
  const baseDano = isDanoAcoplado
    ? `1d${4 * Math.pow(2, Math.max(1, grau) - 1)}`
    : (row?.dano ?? '1d6');
  let formula = dadoModularizado ?? behavior.formula ?? baseDano;

  if (basedOnAttribute) {
    const mod = context.casterState.keyPhysicalModifier;
    if (mod > 0) formula = `${formula}+${mod}`;
    else if (mod < 0) formula = `${formula}${mod}`; // já é negativo, ex: -2
  }

  return targets.map((targetId) => ({
    type: 'DEAL_DAMAGE' as const,
    targetId,
    formula,
    damageType: behavior.tipoDano,
  }));
}

