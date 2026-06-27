import type { PowerUseContext } from '../types.js';

export type TargetingTransform = (
  candidateTargetIds: string[],
  ctx: PowerUseContext,
) => string[];

/**
 * LIMITADO: mantém apenas alvos que possuem o markerId aplicado pelo caster.
 * Usado para poderes como Agonia (requer Laço de Ódio no alvo).
 */
export function limitadoTransform(markerId: string): TargetingTransform {
  return (candidates, ctx) =>
    candidates.filter((id) =>
      ctx.activeMarkers.some(
        (m) => m.targetId === id && m.markerId === markerId && m.sourceId === ctx.casterId,
      ),
    );
}

/**
 * SELETIVO: mantém apenas alvos que o jogador escolheu explicitamente.
 * Candidatos que não estiverem em selectedIds são removidos.
 */
export function seletivoTransform(selectedIds: string[]): TargetingTransform {
  return (candidates) => candidates.filter((id) => selectedIds.includes(id));
}

/**
 * AREA: não filtra — candidateTargetIds já chegam corretos por cálculo geométrico externo.
 * O motor não sabe calcular raios/cones — isso é responsabilidade de quem chama.
 */
export const areaTransform: TargetingTransform = (candidates) => candidates;
