// Tipos e schemas públicos
export type {
  EfeitoBehavior,
  CasterEffect,
  ResolutionMode,
  GameMutation,
  PassiveModifier,
  SceneMarkerSnapshot,
  CasterSnapshot,
  PowerUseContext,
  PassiveContext,
  ResolvedModification,
  ResolvedEffect,
  ResolvedPower,
  ResolvedPassivePower,
  ResolvedBenefit,
} from './types.js';

export { getResolutionMode } from './types.js';

export {
  efeitoBehaviorSchema,
  modificationBaseAutomationSchema,
  parseBehavior,
  parseModificationAutomation,
} from './schemas.js';

export type { ModificationBaseAutomation } from './schemas.js';

// Pipeline ON_USE
export { resolvePowerUse } from './resolve-power-use.js';
export type { PowerUseInput } from './resolve-power-use.js';
export { applyDescargaToFormula } from './resolve-power-use.js';
export { applyGradativoExcessToFormula, resolveGradativoStage } from './resolve-power-use.js';
export type { GradativoStage } from './resolve-power-use.js';

// Pipeline PASSIVE
export { resolvePassiveModifiers } from './resolve-passive.js';

// Targeting (exposto para testes e extensões)
export { limitadoTransform, seletivoTransform, areaTransform } from './targeting/index.js';
export type { TargetingTransform } from './targeting/index.js';

// Behaviors dispatch
export { executeBehavior } from './behaviors/index.js';

// Fortalecer helpers
export {
  calcularBonusFortalecer,
  fortaleceAlvoMatch,
  executeFortalecerDanoRecuperacao,
  calcularBonusCriticoMultiplicador,
  calcularBonusCriticoMargem,
  calcularBonusAlcanceItem,
  parseFortalecerCaracteristicaItem,
  type FortalecerCaracteristicaItemInput,
} from './behaviors/fortalecer.behavior.js';

