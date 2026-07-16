import type { PowerParametersInput } from '../cost/calculate-power-cost.js';

// ─── EfeitoBehavior ───────────────────────────────────────────────────────────

export type EfeitoBehavior =
  // Ativos (ON_USE)
  | { kind: 'DANO'; formula?: string; tipoDano: string }
  | { kind: 'RECUPERACAO'; recurso: 'PV' | 'PE'; formula: string }
  | { kind: 'MARCADOR'; markerId: string; label: string; duracao: 'CENA' | 'PERMANENTE'; visivel: boolean }
  | { kind: 'GATILHO'; evento: string; condicao: string; efeitosFilhos: string[] }
  /**
   * FORTALECER — cobre as configs on-use de fortalecer:
   * - alvo: 'PV_TEMP' → concede PV temporários (fórmula da tabela universal pelo grau)
   * - alvo: 'PE_TEMP' → concede PE temporários (grau × 4)
   * - alvo: 'DANO_BONUS' → bônus de dano temporário (Fase 2 — rastreamento de buff)
   * - alvo: 'RD_BONUS'  → bônus de RD temporário (Fase 2)
   * - alvo: 'ACOES'     → ações extras (Fase 2)
   */
  | {
      kind: 'FORTALECER';
      alvo: 'PV_TEMP' | 'PE_TEMP' | 'DANO_BONUS' | 'RECUPERACAO_BONUS' | 'RD_BONUS' | 'ACOES';
      formula?: string;
      configDano?: {
        alvo: { tipo: 'DOMINIO'; dominio: string } | { tipo: 'DESARMADO' };
        bonusDescritor: string;
      };
    }
  /**
   * APLICAR_CONDICAO — afligir. Impõe condição de sistema ao alvo.
   * condicaoId: string da condição (ex: 'Abalado', 'Lento', 'Cego').
   * patamar: 1-4, usado para validação de grau mínimo no banco.
   */
  | { kind: 'APLICAR_CONDICAO'; condicaoId: string; patamar: 1 | 2 | 3 | 4 }
  // Passivos mecânicos (PASSIVE)
  | { kind: 'BONUS_ROLAGEM'; rollType: string; value: number; isAdvantage: boolean }
  | { kind: 'MODIFICADOR_RECURSO'; recurso: 'PV' | 'PE'; formula: string }
  | { kind: 'BLOQUEIO_RECUPERACAO'; recurso: 'PE' | 'PV' }
  | { kind: 'MODIFICADOR_MOVIMENTO'; multiplier?: number; bonus?: number }
  | { kind: 'VULNERABILIDADE_DESCRITOR'; descritor: string }
  // Narrativo — sem automação, narrador resolve
  | { kind: 'NARRATIVO'; descricao?: string };

// ─── CasterEffect ─────────────────────────────────────────────────────────────
// Variante expandida em relação ao plano: distingue 'sempre' de 'ao falhar'
// para cobrir as duas opções que já existem em modificacoes.json.

export type CasterEffect =
  | 'EFEITO_COLATERAL_SEMPRE'
  | 'EFEITO_COLATERAL_AO_FALHAR'
  | 'NENHUM';

// ─── Resolution Mode ─────────────────────────────────────────────────────────

export type ResolutionMode =
  | { mode: 'ON_USE' }
  | { mode: 'PASSIVE' }
  | { mode: 'NARRATIVE' };

export function getResolutionMode(
  parametros: Pick<PowerParametersInput, 'acao'>,
  hasMechanicalBehavior: boolean,
): ResolutionMode {
  if (parametros.acao !== 5) return { mode: 'ON_USE' };
  return hasMechanicalBehavior ? { mode: 'PASSIVE' } : { mode: 'NARRATIVE' };
}

// ─── GameMutation (output ON_USE) ────────────────────────────────────────────

export type GameMutation =
  | { type: 'DEAL_DAMAGE'; targetId: string; formula: string; damageType: string; isSelfInflicted?: true }
  | { type: 'HEAL'; targetId: string; formula: string }
  | { type: 'RESTORE_PE'; targetId: string; formula: string }
  | { type: 'ADD_TEMP_PV'; targetId: string; formula: string }
  | { type: 'ADD_TEMP_PE'; targetId: string; formula: string }
  | { type: 'APPLY_CONDITION'; targetId: string; condicaoId: string }
  | { type: 'APPLY_MARKER'; targetId: string; markerId: string; label: string; duracao: 'CENA' | 'PERMANENTE'; sourcePowerId: string }
  | { type: 'REMOVE_MARKER'; targetId: string; markerId: string }
  | { type: 'REGISTER_TRIGGER'; targetId: string | null; trigger: { evento: string; condicao: string; efeitosFilhos: string[] }; sourcePowerId: string };

// ─── PassiveModifier (output PASSIVE) ────────────────────────────────────────

export type PassiveModifier =
  | { kind: 'ROLL_BONUS'; rollType: string; value: number; isAdvantage: boolean; sourceId: string }
  | { kind: 'RESOURCE_MAX_MODIFIER'; recurso: 'PV' | 'PE'; formula: string; sourceId: string }
  | { kind: 'BLOCK_RESOURCE_RECOVERY'; recurso: 'PE' | 'PV'; sourceId: string }
  | { kind: 'MOVEMENT_MODIFIER'; multiplier?: number; bonus?: number; sourceId: string };

// ─── Snapshots ────────────────────────────────────────────────────────────────

export interface SceneMarkerSnapshot {
  markerId: string;
  sourceId: string; // quem aplicou
  targetId: string; // em quem está aplicado
}

export interface CasterSnapshot {
  id: string;
  keyPhysicalModifier: number;
  keyMentalModifier: number;
  level: number;
}

// ─── Contextos de entrada ─────────────────────────────────────────────────────

export interface PowerUseContext {
  casterId: string;
  sceneId: string;
  /** Alvos candidatos filtrados por alcance — responsabilidade de quem chama */
  candidateTargetIds: string[];
  casterState: CasterSnapshot;
  activeMarkers: SceneMarkerSnapshot[];
  /**
   * Se o teste de ataque acertou ou não.
   * Necessário apenas quando o poder tem EFEITO_COLATERAL_AO_FALHAR.
   * undefined é tratado como "acertou" (seguro para Fase 1).
   */
  attackSucceeded?: boolean;
  isEspiritual?: boolean;
}

export interface PassiveContext {
  characterId: string;
  equippedPassivePowers: ResolvedPassivePower[];
  activeConditions: string[];
  activeBenefits: ResolvedBenefit[];
}

// ─── Poder hidratado (input do motor) ────────────────────────────────────────

export interface ResolvedModification {
  modificationBaseId: string;
  grau: number;
  targetingEffect: 'AREA' | 'SELETIVO' | 'LIMITADO' | 'NENHUM';
  casterEffect: CasterEffect;
  markerCondition?: string;
}

export interface ResolvedEffect {
  id: string;
  effectBaseId: string;
  grau: number;
  dadoModularizado?: string;
  behavior: EfeitoBehavior | null;
  modifications: ResolvedModification[];
}

export interface ResolvedPower {
  id: string;
  parametros: PowerParametersInput;
  effects: ResolvedEffect[];
  globalModifications: ResolvedModification[];
  /** Fórmula de dano no caster quando EFEITO_COLATERAL dispara. Default: '2d8' */
  colateralFormula?: string;
  isDanoAcoplado?: boolean;
  isRecuperacaoAcoplada?: boolean;
}

export interface ResolvedPassivePower {
  powerId: string;
  effectId: string;
  behavior: EfeitoBehavior;
}

export interface ResolvedBenefit {
  benefitId: string;
  behavior: EfeitoBehavior;
}
