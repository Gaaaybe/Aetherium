import type { EfeitoBehavior, GameMutation } from '../types.js';

/**
 * Executor de MARCADOR.
 * Aplica o marcador em cada alvo, referenciando o poder de origem.
 */
export function executeMarcador(
  behavior: Extract<EfeitoBehavior, { kind: 'MARCADOR' }>,
  targets: string[],
  sourcePowerId: string,
): GameMutation[] {
  return targets.map((targetId) => ({
    type: 'APPLY_MARKER' as const,
    targetId,
    markerId: behavior.markerId,
    label: behavior.label,
    duracao: behavior.duracao,
    sourcePowerId,
  }));
}
