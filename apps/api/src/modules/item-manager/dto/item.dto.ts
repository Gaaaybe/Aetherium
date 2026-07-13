import {
  createPowerBodySchema,
  DomainSchema,
  EquipmentType,
  ItemType,
  WeaponRange,
} from '@aetherium/rules-engine';
import { z } from 'zod';

const dominioSchema = z
  .object({
    name: z.enum([
      'natural',
      'sagrado',
      'sacrilegio',
      'psiquico',
      'cientifico',
      'peculiar',
      'arma-branca',
      'arma-fogo',
      'arma-tensao',
      'arma-explosiva',
      'arma-tecnologica',
    ]),
    areaConhecimento: z.string().min(1).optional(),
    peculiarId: z.string().min(1).optional(),
  })
  .refine((d) => d.name !== 'cientifico' || !!d.areaConhecimento, {
    message: 'Domínio Científico requer área de conhecimento',
    path: ['areaConhecimento'],
  })
  .refine((d) => d.name !== 'peculiar' || !!d.peculiarId, {
    message: 'Domínio Peculiar requer ID da peculiaridade',
    path: ['peculiarId'],
  });

const damageDescriptorSchema = z.object({
  dado: z.string().regex(/^\d+d\d+$/, 'Formato inválido, use NdN (ex: 1d8)'),
  base: z.string().min(1),
  espiritual: z.boolean(),
  tipoDano: z.string().max(100).optional().nullable(),
});

const commonFields = {
  nome: z
    .string()
    .min(2, 'O nome do item deve ter pelo menos 2 caracteres')
    .max(100, 'O nome do item não pode exceder 100 caracteres'),
  descricao: z
    .string()
    .min(10, 'A descrição do item deve ter pelo menos 10 caracteres')
    .max(1000, 'A descrição do item não pode exceder 1000 caracteres'),
  dominio: dominioSchema.optional(),
  dominios: z.array(dominioSchema).max(2, 'O item pode ter no máximo 2 domínios').default([]),
  custoBase: z.number().int().min(0, 'O custo base não pode ser menor que zero'),
  nivelItem: z.number().int().min(1, 'O nível do item deve ser pelo menos 1').optional(),
  isPublic: z.boolean().default(false),
  notas: z.string().max(2000, 'As notas não podem exceder 2000 caracteres').optional(),
  powerIds: z.array(z.string().min(1, 'ID do poder inválido')).default([]),
  icone: z.union([z.url('Ícone deve ser um link válido'), z.null()]).optional(),
  powerArrayIds: z.array(z.string().min(1, 'ID do acervo inválido')).default([]),
  canStack: z.boolean().optional(),
  maxStack: z.number().int().min(2, 'O empilhamento máximo deve ser de pelo menos 2').optional(),
};

export const createItemBodySchema = z.preprocess((val: any) => {
  if (val && typeof val === 'object') {
    if (val.dominio && !val.dominios) {
      val.dominios = [val.dominio];
    }
  }
  return val;
}, z.discriminatedUnion('tipo', [
  z
    .object({
      ...commonFields,
      tipo: z.literal(ItemType.WEAPON),
      danos: z.array(damageDescriptorSchema).min(1),
      critMargin: z.number().int().min(2).max(20),
      critMultiplier: z.number().int().min(1).max(7),
      alcance: z.enum([
        WeaponRange.ADJACENTE,
        WeaponRange.NATURAL,
        WeaponRange.CURTO,
        WeaponRange.MEDIO,
        WeaponRange.LONGO,
      ]),
      alcanceExtraMetros: z.number().min(0).multipleOf(0.5).default(0),
      atributoEscalonamento: z.string().min(1).optional(),
      upgradeLevel: z.number().int().min(0).max(7).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.alcance !== WeaponRange.NATURAL && data.alcanceExtraMetros > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['alcanceExtraMetros'],
          message: 'Apenas armas de alcance natural podem ter alcance extra',
        });
      }
    }),
  z.object({
    ...commonFields,
    tipo: z.literal(ItemType.DEFENSIVE_EQUIPMENT),
    tipoEquipamento: z.enum([EquipmentType.TRAJE, EquipmentType.PROTECAO]),
    baseRD: z.number().int().min(0).optional(),
    atributoEscalonamento: z.string().min(1).optional(),
    upgradeLevel: z.number().int().min(0).max(9).optional(),
  }),
  z.object({
    ...commonFields,
    tipo: z.literal(ItemType.CONSUMABLE),
    descritorEfeito: z.string().min(1).max(500),
    qtdDoses: z.number().int().min(1),
    isRefeicao: z.boolean(),
  }),
  z.object({
    ...commonFields,
    tipo: z.literal(ItemType.ARTIFACT),
  }),
  z.object({
    ...commonFields,
    tipo: z.literal(ItemType.ACCESSORY),
  }),
  z.object({
    ...commonFields,
    tipo: z.literal(ItemType.GENERAL),
  }),
  z.object({
    ...commonFields,
    tipo: z.literal(ItemType.UPGRADE_MATERIAL),
    tier: z.number().int().min(1).max(4),
    maxUpgradeLimit: z.number().int().min(1),
  }),
]));

export type CreateItemBodySchema = z.infer<typeof createItemBodySchema>;

const commonOptional = {
  nome: z
    .string()
    .min(2, 'O nome do item deve ter pelo menos 2 caracteres')
    .max(100, 'O nome do item não pode exceder 100 caracteres')
    .optional(),
  descricao: z
    .string()
    .min(10, 'A descrição do item deve ter pelo menos 10 caracteres')
    .max(1000, 'A descrição do item não pode exceder 1000 caracteres')
    .optional(),
  dominio: dominioSchema.optional(),
  dominios: z.array(dominioSchema).max(2, 'O item pode ter no máximo 2 domínios').optional(),
  custoBase: z.number().int().min(0, 'O custo base não pode ser menor que zero').optional(),
  nivelItem: z.number().int().min(1, 'O nível do item deve ser pelo menos 1').optional(),
  isPublic: z.boolean().optional(),
  notas: z.string().max(2000, 'As notas não podem exceder 2000 caracteres').optional(),
  powerIds: z.array(z.string().min(1, 'ID do poder inválido')).optional(),
  icone: z.union([z.url('Ícone deve ser um link válido'), z.null()]).optional(),
  powerArrayIds: z.array(z.string().min(1, 'ID do acervo inválido')).optional(),
  canStack: z.boolean().optional(),
  maxStack: z.number().int().min(2, 'O empilhamento máximo deve ser de pelo menos 2').optional(),
};

export const updateItemBodySchema = z.preprocess((val: any) => {
  if (val && typeof val === 'object') {
    if (val.dominio && !val.dominios) {
      val.dominios = [val.dominio];
    }
  }
  return val;
}, z.discriminatedUnion('tipo', [
  z
    .object({
      ...commonOptional,
      tipo: z.literal(ItemType.WEAPON),
      danos: z.array(damageDescriptorSchema).min(1).optional(),
      critMargin: z.number().int().min(2).max(20).optional(),
      critMultiplier: z.number().int().min(1).max(7).optional(),
      alcance: z
        .enum([
          WeaponRange.ADJACENTE,
          WeaponRange.NATURAL,
          WeaponRange.CURTO,
          WeaponRange.MEDIO,
          WeaponRange.LONGO,
        ])
        .optional(),
      alcanceExtraMetros: z.number().min(0).multipleOf(0.5).optional(),
      atributoEscalonamento: z.string().min(1).optional(),
    })
    .superRefine((data, ctx) => {
      const alcanceEfetivo = data.alcance;

      if (
        alcanceEfetivo !== undefined &&
        alcanceEfetivo !== WeaponRange.NATURAL &&
        (data.alcanceExtraMetros ?? 0) > 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['alcanceExtraMetros'],
          message: 'Apenas armas de alcance natural podem ter alcance extra',
        });
      }
    }),
  z.object({
    ...commonOptional,
    tipo: z.literal(ItemType.DEFENSIVE_EQUIPMENT),
    tipoEquipamento: z.enum([EquipmentType.TRAJE, EquipmentType.PROTECAO]).optional(),
    baseRD: z.number().int().min(0).optional(),
    atributoEscalonamento: z.string().min(1).optional(),
  }),
  z.object({
    ...commonOptional,
    tipo: z.literal(ItemType.CONSUMABLE),
    descritorEfeito: z.string().min(1).max(500).optional(),
    qtdDoses: z.number().int().min(1).optional(),
  }),
  z.object({
    ...commonOptional,
    tipo: z.literal(ItemType.ARTIFACT),
  }),
  z.object({
    ...commonOptional,
    tipo: z.literal(ItemType.ACCESSORY),
  }),
  z.object({
    ...commonOptional,
    tipo: z.literal(ItemType.GENERAL),
  }),
  z.object({
    ...commonOptional,
    tipo: z.literal(ItemType.UPGRADE_MATERIAL),
    tier: z.number().int().min(1).max(4).optional(),
    maxUpgradeLimit: z.number().int().min(1).optional(),
  }),
]));

export type UpdateItemBodySchema = z.infer<typeof updateItemBodySchema>;

import {
  calculateItemBaseValue,
  calculateItemSellPrice,
  scaleWeaponDie,
} from '@aetherium/rules-engine';

export function formatItemToHTTP(raw: any) {
  const base = {
    id: raw.id,
    userId: raw.userId ?? null,
    characterId: raw.characterId ?? null,
    tipo: raw.tipo.toLowerCase().replace(/_/g, '-'),
    nome: raw.nome,
    descricao: raw.descricao,
    isPublic: raw.isPublic,
    canStack: raw.canStack,
    maxStack: raw.maxStack,
    icone: raw.icone ?? null,
    notas: raw.notas ?? null,
    dominio: {
      name: raw.domains && raw.domains[0] ? raw.domains[0].toLowerCase().replace(/_/g, '-') : 'natural',
      areaConhecimento: raw.domainAreaConhecimento ?? null,
      peculiarId: raw.domainPeculiarIds && raw.domainPeculiarIds[0] ? raw.domainPeculiarIds[0] : null,
    },
    dominios: raw.domains ? raw.domains.map((d: any, idx: number) => ({
      name: d.toLowerCase().replace(/_/g, '-'),
      areaConhecimento: d === 'CIENTIFICO' ? raw.domainAreaConhecimento : null,
      peculiarId: d === 'PECULIAR' ? (raw.domainPeculiarIds?.[idx] ?? raw.domainPeculiarIds?.[0] ?? null) : null,
    })) : [],
    custoBase: raw.custoBase,
    nivelItem: raw.nivelItem,
    valorBase: calculateItemBaseValue(raw.custoBase, raw.nivelItem),
    precoVenda: calculateItemSellPrice(raw.custoBase, raw.nivelItem),
    durabilidade: raw.durabilidade,
    powerIds: raw.itemPowers ? raw.itemPowers.map((ip: any) => ip.powerId) : [],
    powerArrayIds: raw.itemPowerArrays
      ? raw.itemPowerArrays.map((ipa: any) => ipa.powerArrayId)
      : [],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? null,
    userName: raw.user?.name ?? null,
  };

  const tipo = raw.tipo;

  if (tipo === 'WEAPON') {
    const upgradeLevel = raw.upgradeLevelValue ?? 0;
    const danosAtuais = raw.itemDamages.map((d: any) => ({
      dado: scaleWeaponDie(d.dado, upgradeLevel),
      base: d.base,
      espiritual: d.espiritual,
      tipoDano: d.tipoDano ?? null,
    }));
    const baseDanos = raw.itemDamages.map((d: any) => ({
      dado: d.dado,
      base: d.base,
      espiritual: d.espiritual,
      tipoDano: d.tipoDano ?? null,
    }));

    return {
      ...base,
      danos: danosAtuais,
      baseDanos,
      upgradeLevel,
      upgradeLevelMax: raw.upgradeLevelMax ?? 7,
      critMargin: raw.critMargin,
      critMultiplier: raw.critMultiplier,
      alcance: raw.alcance?.toLowerCase() ?? null,
      alcanceExtraMetros: raw.alcanceExtraMetrosMetades ? raw.alcanceExtraMetrosMetades / 2 : 0,
      atributoEscalonamento: raw.atributoEscalonamento ?? null,
    };
  }

  if (tipo === 'DEFENSIVE_EQUIPMENT') {
    const upgradeLevel = raw.upgradeLevelValue ?? 0;
    const rdAtual = (raw.baseRD ?? 2) * 2 ** upgradeLevel;

    return {
      ...base,
      tipoEquipamento: raw.tipoEquipamento?.toLowerCase() ?? null,
      baseRD: raw.baseRD,
      rdAtual,
      upgradeLevel,
      upgradeLevelMax: raw.upgradeLevelMax ?? 9,
      atributoEscalonamento: raw.atributoEscalonamento ?? null,
    };
  }

  if (tipo === 'CONSUMABLE') {
    return {
      ...base,
      descritorEfeito: raw.descritorEfeito,
      qtdDoses: raw.qtdDoses,
      isRefeicao: raw.isRefeicao,
      spoilageState: raw.spoilageState ?? null,
    };
  }

  if (tipo === 'ARTIFACT') {
    return {
      ...base,
      isAttuned: raw.isAttuned ?? false,
    };
  }

  if (tipo === 'UPGRADE_MATERIAL') {
    return {
      ...base,
      tier: raw.materialTier,
      maxUpgradeLimit: raw.materialMaxUpgradeLimit,
    };
  }

  return base;
}

export const importPowerArraySchema = z.object({
  nome: z
    .string()
    .min(2, 'O nome do acervo deve ter pelo menos 2 caracteres')
    .max(100, 'O nome do acervo não pode exceder 100 caracteres'),
  descricao: z
    .string()
    .min(10, 'A descrição do acervo deve ter pelo menos 10 caracteres')
    .max(1000, 'A descrição do acervo não pode exceder 1000 caracteres'),
  dominio: DomainSchema,
  parametrosBase: z
    .object({
      acao: z.number().int().min(0).max(5),
      alcance: z.number().int().min(0).max(6),
      duracao: z.number().int().min(0).max(4),
    })
    .optional(),
  powers: z.array(createPowerBodySchema).min(1, 'O acervo deve ter pelo menos 1 poder'),
  isPublic: z.boolean().default(false),
  notas: z.string().max(2000, 'As notas não podem exceder 2000 caracteres').optional(),
  icone: z.string().url('Ícone deve ser um link válido').optional(),
});

const importCommonFields = {
  nome: z
    .string()
    .min(2, 'O nome do item deve ter pelo menos 2 caracteres')
    .max(100, 'O nome do item não pode exceder 100 caracteres'),
  descricao: z
    .string()
    .min(10, 'A descrição do item deve ter pelo menos 10 caracteres')
    .max(1000, 'A descrição do item não pode exceder 1000 caracteres'),
  dominio: dominioSchema.optional(),
  dominios: z.array(dominioSchema).max(2, 'O item pode ter no máximo 2 domínios').default([]),
  custoBase: z.number().int().min(0, 'O custo base não pode ser menor que zero'),
  isPublic: z.boolean().default(false),
  notas: z.string().max(2000, 'As notas não podem exceder 2000 caracteres').optional(),
  icone: z.union([z.url('Ícone deve ser um link válido'), z.null()]).optional(),
  powers: z.array(createPowerBodySchema).default([]),
  powerArrays: z.array(importPowerArraySchema).default([]),
  canStack: z.boolean().optional(),
  maxStack: z.number().int().min(2, 'O empilhamento máximo deve ser de pelo menos 2').optional(),
};

export const importItemBodySchema = z.preprocess((val: any) => {
  if (val && typeof val === 'object') {
    if (val.dominio && !val.dominios) {
      val.dominios = [val.dominio];
    }
  }
  return val;
}, z.discriminatedUnion('tipo', [
  z
    .object({
      ...importCommonFields,
      tipo: z.literal(ItemType.WEAPON),
      danos: z.array(damageDescriptorSchema).min(1),
      critMargin: z.number().int().min(2).max(20),
      critMultiplier: z.number().int().min(1).max(7),
      alcance: z.enum([
        WeaponRange.ADJACENTE,
        WeaponRange.NATURAL,
        WeaponRange.CURTO,
        WeaponRange.MEDIO,
        WeaponRange.LONGO,
      ]),
      alcanceExtraMetros: z.number().min(0).multipleOf(0.5).default(0),
      atributoEscalonamento: z.string().min(1).optional(),
      upgradeLevel: z.number().int().min(0).max(7).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.alcance !== WeaponRange.NATURAL && data.alcanceExtraMetros > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['alcanceExtraMetros'],
          message: 'Apenas armas de alcance natural podem ter alcance extra',
        });
      }
    }),
  z.object({
    ...importCommonFields,
    tipo: z.literal(ItemType.DEFENSIVE_EQUIPMENT),
    tipoEquipamento: z.enum([EquipmentType.TRAJE, EquipmentType.PROTECAO]),
    baseRD: z.number().int().min(0).optional(),
    atributoEscalonamento: z.string().min(1).optional(),
    upgradeLevel: z.number().int().min(0).max(9).optional(),
  }),
  z.object({
    ...importCommonFields,
    tipo: z.literal(ItemType.CONSUMABLE),
    descritorEfeito: z.string().min(1).max(500),
    qtdDoses: z.number().int().min(1),
    isRefeicao: z.boolean(),
  }),
  z.object({
    ...importCommonFields,
    tipo: z.literal(ItemType.ARTIFACT),
  }),
  z.object({
    ...importCommonFields,
    tipo: z.literal(ItemType.ACCESSORY),
  }),
  z.object({
    ...importCommonFields,
    tipo: z.literal(ItemType.GENERAL),
  }),
  z.object({
    ...importCommonFields,
    tipo: z.literal(ItemType.UPGRADE_MATERIAL),
    tier: z.number().int().min(1).max(4),
    maxUpgradeLimit: z.number().int().min(1),
  }),
]));

export type ImportItemBodySchema = z.infer<typeof importItemBodySchema>;
