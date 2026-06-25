import { z } from 'zod';
import { DomainSchema } from './domain.schemas.js';

export enum ItemType {
  WEAPON = 'weapon',
  DEFENSIVE_EQUIPMENT = 'defensive-equipment',
  CONSUMABLE = 'consumable',
  ARTIFACT = 'artifact',
  ACCESSORY = 'accessory',
  GENERAL = 'general',
  UPGRADE_MATERIAL = 'upgrade-material',
}

export enum WeaponRange {
  ADJACENTE = 'adjacente',
  NATURAL = 'natural',
  CURTO = 'curto',
  MEDIO = 'medio',
  LONGO = 'longo',
}

export enum EquipmentType {
  TRAJE = 'traje',
  PROTECAO = 'protecao',
}

export enum DurabilityStatus {
  INTACTO = 'INTACTO',
  DANIFICADO = 'DANIFICADO',
}

export enum SpoilageState {
  PERFEITA = 'PERFEITA',
  BOA = 'BOA',
  NORMAL = 'NORMAL',
  RUIM = 'RUIM',
  TERRIVEL = 'TERRIVEL',
}

export const DamageDescriptorSchema = z.object({
  dado: z.string().regex(/^\d+d\d+$/, 'Formato inválido, use NdN (ex: 1d8)'),
  base: z.string().min(1),
  espiritual: z.boolean(),
});

export type DamageDescriptor = z.infer<typeof DamageDescriptorSchema>;

export const commonItemFields = {
  id: z.string().uuid().optional(),
  userId: z.string().uuid().nullable().optional(),
  characterId: z.string().uuid().nullable().optional(),
  nome: z.string().min(2).max(100),
  descricao: z.string().min(10).max(1000),
  dominio: DomainSchema,
  custoBase: z.number().int().min(0),
  nivelItem: z.number().int().min(1).default(1),
  durabilidade: z.nativeEnum(DurabilityStatus).default(DurabilityStatus.INTACTO),
  canStack: z.boolean().default(false),
  maxStack: z.number().int().min(2).default(2),
  icone: z.string().url('Ícone deve ser um link válido').nullable().optional(),
  isPublic: z.boolean().default(false),
  notas: z.string().max(2000).nullable().optional(),
  powerIds: z.array(z.string().uuid()).default([]),
  powerArrayIds: z.array(z.string().uuid()).default([]),
  createdAt: z.date().optional(),
  updatedAt: z.date().nullable().optional(),
};

export const WeaponSchema = z.object({
  ...commonItemFields,
  tipo: z.literal(ItemType.WEAPON),
  danos: z.array(DamageDescriptorSchema).min(1),
  critMargin: z.number().int().min(2).max(20),
  critMultiplier: z.number().int().min(1).max(7),
  alcance: z.nativeEnum(WeaponRange),
  alcanceExtraMetros: z.number().min(0).multipleOf(0.5).default(0),
  atributoEscalonamento: z.string().min(1).nullable().optional(),
  upgradeLevelValue: z.number().int().min(0).max(7).default(0),
  upgradeLevelMax: z.number().int().default(7),
}).superRefine((data, ctx) => {
  if (data.alcance !== WeaponRange.NATURAL && data.alcanceExtraMetros > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['alcanceExtraMetros'],
      message: 'Apenas armas de alcance natural podem ter alcance extra',
    });
  }
});

export const DefensiveEquipmentSchema = z.object({
  ...commonItemFields,
  tipo: z.literal(ItemType.DEFENSIVE_EQUIPMENT),
  tipoEquipamento: z.nativeEnum(EquipmentType),
  baseRD: z.number().int().min(1).default(2),
  upgradeLevelValue: z.number().int().min(0).max(9).default(0),
  upgradeLevelMax: z.number().int().default(9),
  atributoEscalonamento: z.string().min(1).nullable().optional(),
});

export const ConsumableSchema = z.object({
  ...commonItemFields,
  tipo: z.literal(ItemType.CONSUMABLE),
  descritorEfeito: z.string().min(1).max(500),
  qtdDoses: z.number().int().min(1),
  isRefeicao: z.boolean(),
  spoilageState: z.nativeEnum(SpoilageState).optional().nullable(),
});

export const ArtifactSchema = z.object({
  ...commonItemFields,
  tipo: z.literal(ItemType.ARTIFACT),
  isAttuned: z.boolean().default(false),
});

export const AccessorySchema = z.object({
  ...commonItemFields,
  tipo: z.literal(ItemType.ACCESSORY),
});

export const GeneralItemSchema = z.object({
  ...commonItemFields,
  tipo: z.literal(ItemType.GENERAL),
});

export const UpgradeMaterialSchema = z.object({
  ...commonItemFields,
  tipo: z.literal(ItemType.UPGRADE_MATERIAL),
  tier: z.number().int().min(1).max(4),
  maxUpgradeLimit: z.number().int().min(1),
});

export const ItemSchema = z.discriminatedUnion('tipo', [
  WeaponSchema,
  DefensiveEquipmentSchema,
  ConsumableSchema,
  ArtifactSchema,
  AccessorySchema,
  GeneralItemSchema,
  UpgradeMaterialSchema,
]);

export type ItemInput = z.infer<typeof ItemSchema>;

export function calculateItemBaseValue(custoBase: number, nivelItem: number): number {
  return custoBase * nivelItem;
}

export function calculateItemSellPrice(custoBase: number, nivelItem: number): number {
  return Math.floor(calculateItemBaseValue(custoBase, nivelItem) / 2);
}

export function scaleWeaponDie(dado: string, upgradeLevelValue: number): string {
  if (upgradeLevelValue === 0) return dado;
  const [count, size] = dado.split('d').map(Number);
  const multiplier = Math.pow(2, upgradeLevelValue);
  const newSize = size * multiplier;
  return `${count}d${newSize}`;
}
