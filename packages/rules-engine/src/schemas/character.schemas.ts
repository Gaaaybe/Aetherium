import { z } from 'zod';

export const AttributeSchema = z.object({
  baseValue: z.number().int().min(0),
  extraBonus: z.number().int().default(0),
});

export const PhysicalAttributeSchema = z.enum(['strength', 'dexterity', 'constitution']);
export const MentalAttributeSchema = z.enum(['intelligence', 'wisdom', 'charisma']);

export const AttributesSchema = z.object({
  strength: AttributeSchema,
  dexterity: AttributeSchema,
  constitution: AttributeSchema,
  intelligence: AttributeSchema,
  wisdom: AttributeSchema,
  charisma: AttributeSchema,
  keyPhysical: PhysicalAttributeSchema,
  keyMental: MentalAttributeSchema,
});

export const DeityDevotionSchema = z.object({
  name: z.string().default(''),
  aspects: z.array(z.string()).default([]),
  precepts: z.string().default(''),
  minorPrecepts: z.string().default(''),
  taboos: z.string().default(''),
  personality: z.string().default(''),
  isSealed: z.boolean().default(false),
});

export const PsychicStateSchema = z.object({
  stress: z.number().int().nonnegative().default(0),
});

export const NarrativeProfileSchema = z.object({
  name: z.string().optional().default(''),
  identity: z.string(),
  origin: z.string(),
  motivations: z.array(z.string()),
  complications: z.array(z.string()),
  generalNotes: z.string().default(''),
  deity: DeityDevotionSchema.optional(),
  psychicState: PsychicStateSchema.optional(),
});

export const SkillEntrySchema = z.object({
  proficiencyState: z.string().default('NEUTRAL'),
  trainingBonus: z.number().int().default(0),
  extraBonus: z.number().int().default(0),
});

export const SkillsSchema = z.record(z.string(), SkillEntrySchema);

export const PdaStateSchema = z.object({
  extraPda: z.number().int().default(0),
  spentPda: z.number().int().default(0),
});

export const HealthStateSchema = z.object({
  currentPV: z.number().int(),
  temporaryPV: z.number().int().default(0),
  limitMaxPV: z.number().int().nullable().optional(),
});

export const EnergyStateSchema = z.object({
  currentPE: z.number().int(),
  temporaryPE: z.number().int().default(0),
  limitMaxPE: z.number().int().nullable().optional(),
});

export const SpiritualStageSchema = z.enum(['NORMAL', 'DIVINE']);

export const SpiritualPrincipleSchema = z.object({
  isUnlocked: z.boolean(),
  stage: SpiritualStageSchema,
});

export const EquippedItemSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

export const EquipmentSlotsSchema = z.object({
  suitId: z.string().uuid().optional().nullable(),
  accessoryId: z.string().uuid().optional().nullable(),
  hands: z.array(EquippedItemSchema).default([]),
  quickAccess: z.array(EquippedItemSchema).default([]),
  numberOfHands: z.number().int().default(2),
});

export const InventoryItemSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

export const InventorySchema = z.object({
  runics: z.number().int().nonnegative().default(0),
  bag: z.array(InventoryItemSchema).default([]),
});

export const UnarmedMasterySchema = z.object({
  degree: z.number().int().min(0).max(9).default(0),
  marginImprovements: z.number().int().min(0).default(0),
  multiplierImprovements: z.number().int().min(0).default(0),
  damageType: z.string().default('Impacto'),
  customName: z.string().optional().nullable(),
});

export const CharacterSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  level: z.number().int().min(1).max(20),
  inspiration: z.number().int().nonnegative().default(0),
  attributes: AttributesSchema,
  narrativeProfile: NarrativeProfileSchema,
  skills: SkillsSchema,
  pdaState: PdaStateSchema,
  healthState: HealthStateSchema,
  energyState: EnergyStateSchema,
  spiritualPrinciple: SpiritualPrincipleSchema,
  equipmentSlots: EquipmentSlotsSchema,
  inventory: InventorySchema,
  conditions: z.array(z.string()).default([]),
  unarmedMastery: UnarmedMasterySchema.nullable().optional(),
  deathState: z.enum(['ALIVE', 'DYING', 'DEAD']).default('ALIVE'),
  deathCounter: z.number().int().default(0),
  symbol: z.string().nullable().optional(),
  art: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Character = z.infer<typeof CharacterSchema> & {
  powers?: {
    id: string;
    powerId: string;
    isEquipped: boolean;
    finalPdaCost: number;
    slotCost: number;
    posicao?: number;
  }[];
  powerArrays?: {
    id: string;
    powerArrayId: string;
    isEquipped: boolean;
    finalPdaCost: number;
    slotCost: number;
    posicao?: number;
  }[];
  benefits?: {
    id: string;
    name: string;
    degree: number;
    pdaCost: number;
    posicao?: number;
  }[];
  domains?: {
    id: string;
    characterId: string;
    domainId: string;
    masteryLevel: 'INICIANTE' | 'PRATICANTE' | 'MESTRE';
  }[];
};

