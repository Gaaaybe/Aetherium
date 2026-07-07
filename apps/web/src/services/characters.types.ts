export interface CharacterAttributeResponse {
  baseValue: number;
  extraBonus: number;
  baseModifier: number;
  rollModifier: number;
}

export interface CharacterAttributesResponse {
  strength: CharacterAttributeResponse;
  dexterity: CharacterAttributeResponse;
  constitution: CharacterAttributeResponse;
  intelligence: CharacterAttributeResponse;
  wisdom: CharacterAttributeResponse;
  charisma: CharacterAttributeResponse;
  keyPhysical: 'strength' | 'dexterity' | 'constitution';
  keyMental: 'intelligence' | 'wisdom' | 'charisma';
}

export interface CharacterSkillResponse {
  name: string;
  proficiencyState: 'INEFFICIENT' | 'NEUTRAL' | 'EFFICIENT';
  trainingBonus: number;
  extraBonus: number;
}

export interface CharacterPowerResponse {
  id: string;
  powerId: string;
  isEquipped: boolean;
  finalPdaCost: number;
  slotCost: number;
}

export interface CharacterPowerArrayResponse {
  id: string;
  powerArrayId: string;
  isEquipped: boolean;
  finalPdaCost: number;
  slotCost: number;
}

export interface CharacterBenefitResponse {
  id: string;
  name: string;
  degree: number;
  pdaCost: number;
}

export interface CharacterDomainMasteryResponse {
  domainId: string;
  masteryLevel: 'INICIANTE' | 'PRATICANTE' | 'MESTRE';
  nome?: string | null;
  icone?: string | null;
}

export interface EquippedItemResponse {
  itemId: string;
  quantity: number;
}

export interface InventoryItemResponse {
  itemId: string;
  quantity: number;
}

export interface UnarmedMasteryResponse {
  customName?: string;
  degree: number;
  marginImprovements: number;
  multiplierImprovements: number;
  damageType: string;
  damageDie: string;
  criticalMargin: number;
  criticalMultiplier: number;
  totalPdaCost: number;
}

export interface CharacterResponse {
  id: string;
  userId: string;
  level: number;
  inspiration: number;
  calamityRank: string;
  efficiencyBonus: number;
  narrative: {
    name: string;
    identity: string;
    origin: string;
    motivations: string[];
    complications: string[];
    generalNotes: string;
  };
  attributes: CharacterAttributesResponse;
  skills: CharacterSkillResponse[];
  spiritualPrinciple: {
    isUnlocked: boolean;
    stage: 'NORMAL' | 'DIVINE';
  };
  domainMasteries: CharacterDomainMasteryResponse[];
  pda: {
    total: number;
    spent: number;
    extra: number;
    available: number;
  };
  health: {
    maxPV: number;
    currentPV: number;
    temporaryPV: number;
    limitMaxPV?: number | null;
  };
  energy: {
    maxPE: number;
    currentPE: number;
    temporaryPE: number;
    limitMaxPE?: number | null;
  };
  slots: {
    maxSlots: number;
    usedSlots: number;
    availableSlots: number;
  };
  conditions: string[];
  death: {
    state: 'ALIVE' | 'DYING' | 'DEAD';
    counter: number;
  };
  inventory: {
    runics: number;
    bag: InventoryItemResponse[];
  };
  equipment: {
    suitId: string | null;
    accessoryId: string | null;
    hands: EquippedItemResponse[];
    quickAccess: EquippedItemResponse[];
    numberOfHands: number;
    maxQuickAccessSlots: number;
  };
  powers: CharacterPowerResponse[];
  powerArrays: CharacterPowerArrayResponse[];
  benefits: CharacterBenefitResponse[];
  unarmedMastery: UnarmedMasteryResponse;
  symbol: string | null;
  art: string | null;
  combatStats: {
    dodge: number;
    baseRD: number;
    blockRD: number;
  };
  createdAt: Date;
  updatedAt: Date | null;
}

export interface SyncCharacterData {
  narrative?: {
    name?: string;
    identity?: string;
    origin?: string;
    motivations?: string[];
    complications?: string[];
    generalNotes?: string;
  };
  symbol?: string | null;
  art?: string | null;
  inspiration?: number;
  level?: number;
  extraPda?: number;
  pvChange?: number;
  peChange?: number;
  tempPvChange?: number;
  tempPeChange?: number;
  customMaxPV?: number;
  customMaxPE?: number;
  limitMaxPV?: number | null;
  limitMaxPE?: number | null;
  attributes?: {
    strength: { baseValue: number; extraBonus?: number };
    dexterity: { baseValue: number; extraBonus?: number };
    constitution: { baseValue: number; extraBonus?: number };
    intelligence: { baseValue: number; extraBonus?: number };
    wisdom: { baseValue: number; extraBonus?: number };
    charisma: { baseValue: number; extraBonus?: number };
    keyPhysical: 'strength' | 'dexterity' | 'constitution';
    keyMental: 'intelligence' | 'wisdom' | 'charisma';
  };
  skills?: {
    name: string;
    state: 'INEFFICIENT' | 'NEUTRAL' | 'EFFICIENT';
    trainingBonusIncrease?: number;
  }[];
  conditions?: string[];
}

export type EquipSlot = 'suit' | 'accessory' | 'hand' | 'quick-access';
