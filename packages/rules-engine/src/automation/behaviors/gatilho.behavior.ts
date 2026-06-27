import type { EfeitoBehavior, GameMutation } from '../types.js';

/**
 * Executor de GATILHO.
 * Gera mutações de REGISTER_TRIGGER para associar o gatilho a alvos (ou global se vazio).
 */
export function executeGatilho(
  behavior: Extract<EfeitoBehavior, { kind: 'GATILHO' }>,
  targets: string[],
  sourcePowerId: string,
): GameMutation[] {
  if (targets.length === 0) {
    return [
      {
        type: 'REGISTER_TRIGGER' as const,
        targetId: null,
        trigger: {
          evento: behavior.evento,
          condicao: behavior.condicao,
          efeitosFilhos: behavior.efeitosFilhos,
        },
        sourcePowerId,
      },
    ];
  }

  return targets.map((targetId) => ({
    type: 'REGISTER_TRIGGER' as const,
    targetId,
    trigger: {
      evento: behavior.evento,
      condicao: behavior.condicao,
      efeitosFilhos: behavior.efeitosFilhos,
    },
    sourcePowerId,
  }));
}
