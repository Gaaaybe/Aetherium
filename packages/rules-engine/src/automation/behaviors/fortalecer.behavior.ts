import { UNIVERSAL_TABLE } from '../../cost/calculate-power-cost.js';
import type { EfeitoBehavior, GameMutation } from '../types.js';

/**
 * Executor de FORTALECER (configs ON_USE).
 *
 * - PV_TEMP: concede PV temporários usando a coluna `dano` da tabela universal
 *            (mesma fórmula de cura do sistema). Se o behavior trouxer `formula`,
 *            ela tem precedência.
 * - PE_TEMP: concede PE temporários com fórmula fixa do sistema: grau × 4.
 *            Se o behavior trouxer `formula`, ela tem precedência.
 * - Demais (DANO_BONUS, RD_BONUS, ACOES): Fase 2 — rastreamento de buff com
 *   duração na SceneEffectInstance. Por ora retorna vazio para não travar o pipeline.
 */
export function executeFortalecer(
  behavior: Extract<EfeitoBehavior, { kind: 'FORTALECER' }>,
  targets: string[],
  grau: number,
): GameMutation[] {
  if (behavior.alvo === 'PV_TEMP') {
    const row = UNIVERSAL_TABLE.find((r) => r.grau === grau);
    const formula = behavior.formula ?? row?.dano ?? '1d6';
    return targets.map((targetId) => ({
      type: 'ADD_TEMP_PV' as const,
      targetId,
      formula,
    }));
  }

  if (behavior.alvo === 'PE_TEMP') {
    // Regra do sistema: grau × 4 PE temporários
    const formula = behavior.formula ?? String(grau * 4);
    return targets.map((targetId) => ({
      type: 'ADD_TEMP_PE' as const,
      targetId,
      formula,
    }));
  }

  // DANO_BONUS, RD_BONUS, ACOES → Fase 2 (buff com duração)
  return [];
}
