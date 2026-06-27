import type { EfeitoBehavior, GameMutation } from '../types.js';

/**
 * Executor de RECUPERACAO.
 * Gera HEAL para PV ou RESTORE_PE para PE em cada alvo.
 */
export function executeRecuperacao(
  behavior: Extract<EfeitoBehavior, { kind: 'RECUPERACAO' }>,
  targets: string[],
): GameMutation[] {
  const type = behavior.recurso === 'PV' ? ('HEAL' as const) : ('RESTORE_PE' as const);
  return targets.map((targetId) => ({
    type,
    targetId,
    formula: behavior.formula,
  }));
}
