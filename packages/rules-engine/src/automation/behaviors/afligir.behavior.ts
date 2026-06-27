import type { EfeitoBehavior, GameMutation } from '../types.js';

/**
 * Executor de APLICAR_CONDICAO (afligir).
 *
 * Gera uma mutação APPLY_CONDITION para cada alvo.
 * A API aplica via `applyCondition(character, condicaoId)` do character-rules,
 * que já lida com evolução de condições (Abalado → Apavorado, Fraco → Debilitado, etc).
 *
 * O patamar está no behavior para que o backend possa validar se o grau do efeito
 * é suficiente antes de aplicar (ex: patamar 3 exige grau ≥ 6).
 */
export function executeAfligir(
  behavior: Extract<EfeitoBehavior, { kind: 'APLICAR_CONDICAO' }>,
  targets: string[],
): GameMutation[] {
  return targets.map((targetId) => ({
    type: 'APPLY_CONDITION' as const,
    targetId,
    condicaoId: behavior.condicaoId,
  }));
}
