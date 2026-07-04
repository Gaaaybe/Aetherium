import { UNIVERSAL_TABLE } from '../../cost/calculate-power-cost.js';
import type { EfeitoBehavior, GameMutation, PowerUseContext } from '../types.js';

export interface FortaleceAlvo {
  tipo: 'DOMINIO' | 'DESARMADO' | 'ITEM';
  dominio?: string;
}

export interface DamageSource {
  tipo: 'PODER' | 'ARMA' | 'DESARMADO';
  dominio?: string;
  domains?: string[];
  itemId?: string;
  originItemId?: string;
}

export interface DamageComponent {
  formula: string;
  descritor: string;
}

export function calcularBonusFortalecer(grau: number): number {
  return 4 * Math.pow(2, grau - 1);
}

export function fortaleceAlvoMatch(
  alvo: FortaleceAlvo,
  source: DamageSource,
  effectOriginItemId?: string
): boolean {
  if (alvo.tipo === 'ITEM') {
    if (!effectOriginItemId) return false;
    if (source.tipo === 'ARMA') {
      return source.itemId === effectOriginItemId;
    }
    if (source.tipo === 'PODER') {
      return source.originItemId === effectOriginItemId;
    }
    return false;
  }

  if (alvo.tipo === 'DESARMADO') {
    return source.tipo === 'DESARMADO';
  }

  if (alvo.tipo === 'DOMINIO' && alvo.dominio) {
    const alvoDomNormalized = alvo.dominio.toLowerCase().replace(/_/g, '-');

    if (source.tipo === 'PODER' && source.dominio) {
      return source.dominio.toLowerCase().replace(/_/g, '-') === alvoDomNormalized;
    }

    if (source.tipo === 'ARMA' && source.domains) {
      return source.domains.some(
        (d) => d.toLowerCase().replace(/_/g, '-') === alvoDomNormalized
      );
    }
  }

  return false;
}

export function executeFortalecerDanoRecuperacao(
  config: { alvo: FortaleceAlvo; bonusDescritor: string },
  grau: number,
  source: DamageSource,
  effectOriginItemId?: string
): DamageComponent | null {
  if (!fortaleceAlvoMatch(config.alvo, source, effectOriginItemId)) return null;

  return {
    formula: `+${calcularBonusFortalecer(grau)}`,
    descritor: config.bonusDescritor,
  };
}

/**
 * Executor de FORTALECER (configs ON_USE).
 *
 * - PV_TEMP: concede PV temporários usando a coluna `dano` da tabela universal
 *            (mesma fórmula de cura do sistema). Se o behavior trouxer `formula`,
 *            ela tem precedência.
 * - PE_TEMP: concede PE temporários com fórmula fixa do sistema: grau × 4.
 *            Se o behavior trouxer `formula`, ela tem precedência.
 * - Demais (DANO_BONUS, RECUPERACAO_BONUS, RD_BONUS, ACOES): Fase 2 — rastreamento de buff com
 *   duração na SceneEffectInstance. Por ora retorna vazio para não travar o pipeline.
 */
export function executeFortalecer(
  behavior: Extract<EfeitoBehavior, { kind: 'FORTALECER' }>,
  targets: string[],
  grau: number,
  context?: PowerUseContext,
  basedOnAttribute = false,
): GameMutation[] {
  if (behavior.alvo === 'PV_TEMP') {
    const row = UNIVERSAL_TABLE.find((r) => r.grau === grau);
    let formula = behavior.formula ?? row?.dano ?? '1d6';

    if (basedOnAttribute && context) {
      const mod = context.isEspiritual
        ? context.casterState.keyMentalModifier
        : context.casterState.keyPhysicalModifier;
      if (mod > 0) formula = `${formula}+${mod}`;
      else if (mod < 0) formula = `${formula}${mod}`;
    }

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

  // DANO_BONUS, RECUPERACAO_BONUS, RD_BONUS, ACOES → Fase 2 (buff com duração)
  return [];
}

export interface FortalecerCaracteristicaItemInput {
  alvo: {
    tipo: 'ITEM' | 'DESARMADO';
  };
}

export function parseFortalecerCaracteristicaItem(
  input: string | undefined
): FortalecerCaracteristicaItemInput {
  if (input) {
    try {
      const parsed = JSON.parse(input);
      if (parsed && parsed.alvo && typeof parsed.alvo === 'object') {
        return {
          alvo: {
            tipo: parsed.alvo.tipo === 'DESARMADO' ? 'DESARMADO' : 'ITEM',
          },
        };
      }
    } catch (e) {
      // ignore
    }
  }
  return {
    alvo: { tipo: 'ITEM' },
  };
}

export function calcularBonusCriticoMultiplicador(grau: number): number {
  return Math.floor(grau / 2);
}

export function calcularBonusCriticoMargem(grau: number): number {
  return Math.floor(grau / 2);
}

export function calcularBonusAlcanceItem(grau: number): number {
  return grau * 2;
}

