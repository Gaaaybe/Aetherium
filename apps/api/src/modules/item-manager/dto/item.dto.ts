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
      'desarmado',
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
  icone: z.union([z.string().min(1, 'Ícone inválido'), z.null()]).optional(),
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
  icone: z.union([z.string().min(1, 'Ícone inválido'), z.null()]).optional(),
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
  icone: z.string().min(1, 'Ícone inválido').optional(),
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
  icone: z.union([z.string().min(1, 'Ícone inválido'), z.null()]).optional(),
  powers: z.array(createPowerBodySchema).default([]),
  powerArrays: z.array(importPowerArraySchema).default([]),
  canStack: z.boolean().optional(),
  maxStack: z.number().int().min(2, 'O empilhamento máximo deve ser de pelo menos 2').optional(),
  importWarnings: z.array(z.string()).default([]),
};

const LEGACY_ITEM_TYPES: Record<string, string> = {
  weapon: ItemType.WEAPON,
  arma: ItemType.WEAPON,
  defensiveequipment: ItemType.DEFENSIVE_EQUIPMENT,
  equipamentodefensivo: ItemType.DEFENSIVE_EQUIPMENT,
  armadura: ItemType.DEFENSIVE_EQUIPMENT,
  consumable: ItemType.CONSUMABLE,
  consumivel: ItemType.CONSUMABLE,
  artifact: ItemType.ARTIFACT,
  artefato: ItemType.ARTIFACT,
  accessory: ItemType.ACCESSORY,
  acessorio: ItemType.ACCESSORY,
  general: ItemType.GENERAL,
  geral: ItemType.GENERAL,
  upgradematerial: ItemType.UPGRADE_MATERIAL,
  materialdeupgrade: ItemType.UPGRADE_MATERIAL,
  materialaprimoramento: ItemType.UPGRADE_MATERIAL,
};

const LEGACY_DOMAINS: Record<string, string> = {
  natural: 'natural', sagrado: 'sagrado', sacrilegio: 'sacrilegio', psiquico: 'psiquico',
  cientifico: 'cientifico', peculiar: 'peculiar', desarmado: 'desarmado',
  armabranca: 'arma-branca', armafogo: 'arma-fogo', armatensao: 'arma-tensao',
  armaexplosiva: 'arma-explosiva', armatecnologica: 'arma-tecnologica',
};

function legacyKey(value: unknown): string {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function legacyNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function legacyBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const normalized = legacyKey(value);
  if (['true', 'sim', 'yes', '1'].includes(normalized)) return true;
  if (['false', 'nao', 'no', '0'].includes(normalized)) return false;
  return fallback;
}

function normalizeLegacyDomain(value: any, warnings: string[]) {
  const rawName = typeof value === 'string' ? value : value?.name ?? value?.nome ?? value?.id;
  let name = LEGACY_DOMAINS[legacyKey(rawName)] ?? 'natural';
  if (!LEGACY_DOMAINS[legacyKey(rawName)] && rawName) warnings.push(`Domínio desconhecido "${rawName}" convertido para Natural.`);
  const result: any = { name };
  const area = value?.areaConhecimento ?? value?.area ?? value?.knowledgeArea;
  const peculiarId = value?.peculiarId ?? value?.dominioIdPeculiar ?? value?.idPeculiar;
  if (name === 'cientifico') result.areaConhecimento = String(area || 'Área importada');
  if (name === 'peculiar') {
    if (peculiarId) result.peculiarId = String(peculiarId);
    else {
      name = 'natural';
      result.name = name;
      warnings.push('Domínio Peculiar sem identificação convertido para Natural.');
    }
  }
  return result;
}

function normalizeLegacyPower(value: any, warnings: string[]) {
  if (!value || typeof value !== 'object') return value;
  const power = { ...value };
  power.nome = String(power.nome ?? power.name ?? 'Poder importado').slice(0, 100);
  if (power.nome.length < 2) power.nome = `${power.nome || 'P'} importado`;
  power.descricao = String(power.descricao ?? power.description ?? 'Poder recuperado de um backup antigo.').slice(0, 1000);
  if (power.descricao.length < 10) power.descricao = `${power.descricao} (importado)`;
  power.dominio = normalizeLegacyDomain(power.dominio ?? power.domain ?? power.dominioId, warnings);
  const params = power.parametros ?? power.parameters ?? {};
  power.parametros = {
    acao: Math.max(0, Math.min(5, Math.trunc(legacyNumber(params.acao ?? power.parametrosAcao, 2)))),
    alcance: Math.max(0, Math.min(6, Math.trunc(legacyNumber(params.alcance ?? power.parametrosAlcance, 1)))),
    duracao: Math.max(0, Math.min(4, Math.trunc(legacyNumber(params.duracao ?? power.parametrosDuracao, 0)))),
  };
  power.effects = (power.effects ?? power.efeitos ?? []).map((effect: any) => ({
    effectBaseId: String(effect.effectBaseId ?? effect.efeitoBaseId ?? effect.id ?? ''),
    grau: Math.max(1, Math.trunc(legacyNumber(effect.grau, 1))),
    configuracaoId: effect.configuracaoId ?? undefined,
    inputValue: effect.inputValue ?? effect.valorInput ?? undefined,
    dadoModularizado: effect.dadoModularizado ?? effect.dadoModular ?? undefined,
    nota: effect.nota ?? undefined,
    modifications: (effect.modifications ?? effect.modificacoes ?? []).map((mod: any) => ({
      modificationBaseId: String(mod.modificationBaseId ?? mod.modificacaoBaseId ?? mod.id ?? ''),
      scope: 'local',
      grau: Math.max(1, Math.trunc(legacyNumber(mod.grau ?? mod.grauModificacao, 1))),
      parametros: mod.parametros ?? undefined,
      nota: mod.nota ?? undefined,
    })).filter((mod: any) => mod.modificationBaseId),
  })).filter((effect: any) => effect.effectBaseId);
  power.globalModifications = (power.globalModifications ?? power.modificacoesGlobais ?? []).map((mod: any) => ({
    modificationBaseId: String(mod.modificationBaseId ?? mod.modificacaoBaseId ?? mod.id ?? ''),
    scope: 'global',
    grau: Math.max(1, Math.trunc(legacyNumber(mod.grau ?? mod.grauModificacao, 1))),
    parametros: mod.parametros ?? undefined,
    nota: mod.nota ?? undefined,
  })).filter((mod: any) => mod.modificationBaseId);
  power.isPublic = false;
  if (power.icone === null || power.icone === '') delete power.icone;
  return power;
}

export function normalizeLegacyItemBackup(input: any): any {
  const warnings: string[] = [];
  const source = input?.item ?? input?.data ?? input;
  if (!source || typeof source !== 'object' || Array.isArray(source)) return source;
  const item: any = { ...source };
  const rawType = item.tipo ?? item.type ?? item.itemType;
  item.tipo = LEGACY_ITEM_TYPES[legacyKey(rawType)] ?? ItemType.GENERAL;
  if (!LEGACY_ITEM_TYPES[legacyKey(rawType)] && rawType) warnings.push(`Tipo desconhecido "${rawType}" convertido para Geral.`);
  item.nome = String(item.nome ?? item.name ?? 'Item importado').slice(0, 100);
  if (item.nome.length < 2) item.nome = `${item.nome || 'I'} importado`;
  item.descricao = String(item.descricao ?? item.description ?? 'Item recuperado de um backup antigo.').slice(0, 1000);
  if (item.descricao.length < 10) item.descricao = `${item.descricao} (importado)`;
  const rawDomains = item.dominios ?? item.domains ?? (item.dominio ?? item.domain ? [item.dominio ?? item.domain] : []);
  item.dominios = (Array.isArray(rawDomains) ? rawDomains : [rawDomains]).slice(0, 2).map((domain) => normalizeLegacyDomain(domain, warnings));
  if (item.dominios.length === 0) item.dominios = [{ name: 'natural' }];
  item.dominio = item.dominios[0];
  item.custoBase = Math.max(0, Math.trunc(legacyNumber(item.custoBase ?? item.baseCost ?? item.custo, 0)));
  item.isPublic = false;
  item.canStack = legacyBoolean(item.canStack ?? item.empilhavel, false);
  if (item.canStack) item.maxStack = Math.max(2, Math.trunc(legacyNumber(item.maxStack ?? item.empilhamentoMaximo, 2)));
  if (item.icone === null || item.icone === '') delete item.icone;
  item.powers = (item.powers ?? item.poderes ?? []).map((power: any) => normalizeLegacyPower(power, warnings));
  if (item.powers.length === 0 && Array.isArray(item.powerIds) && item.powerIds.length > 0) {
    warnings.push('O backup continha apenas IDs de poderes; o item foi recuperado sem esses poderes.');
  }
  item.powerArrays = (item.powerArrays ?? item.acervos ?? []).map((array: any) => ({
    ...array,
    nome: String(array.nome ?? array.name ?? 'Acervo importado').padEnd(2, ' '),
    descricao: String(array.descricao ?? array.description ?? 'Acervo recuperado de backup antigo.').padEnd(10, ' '),
    dominio: normalizeLegacyDomain(array.dominio ?? array.domain, warnings),
    parametrosBase: array.parametrosBase ?? array.baseParameters ?? undefined,
    powers: (array.powers ?? array.poderes ?? []).map((power: any) => normalizeLegacyPower(power, warnings)),
    isPublic: false,
    icone: array.icone || undefined,
  }));
  if (item.powerArrays.length === 0 && Array.isArray(item.powerArrayIds) && item.powerArrayIds.length > 0) {
    warnings.push('O backup continha apenas IDs de acervos; o item foi recuperado sem esses acervos.');
  }
  if (item.tipo === ItemType.WEAPON) {
    const damages = item.danos ?? item.baseDanos ?? item.damages ?? [];
    item.danos = (Array.isArray(damages) ? damages : [damages]).map((damage: any) => {
      const die = String(damage.dado ?? damage.die ?? damage.formula ?? '1d4').toLowerCase().replace(/\s/g, '');
      return {
        dado: /^\d+d\d+$/.test(die) ? die : '1d4',
        base: String(damage.base ?? damage.atributo ?? 'FOR'),
        espiritual: legacyBoolean(damage.espiritual ?? damage.spiritual, false),
        tipoDano: damage.tipoDano ?? damage.damageType ?? undefined,
      };
    });
    if (item.danos.length === 0) item.danos = [{ dado: '1d4', base: 'FOR', espiritual: false }];
    item.critMargin = Math.max(2, Math.min(20, Math.trunc(legacyNumber(item.critMargin ?? item.margemCritico, 20))));
    item.critMultiplier = Math.max(1, Math.min(7, Math.trunc(legacyNumber(item.critMultiplier ?? item.multiplicadorCritico, 2))));
    const range = legacyKey(item.alcance ?? item.range);
    item.alcance = ({ adjacente: 'adjacente', natural: 'natural', curto: 'curto', medio: 'medio', longo: 'longo' } as any)[range] ?? 'natural';
    item.alcanceExtraMetros = Math.max(0, Math.round(legacyNumber(item.alcanceExtraMetros, 0) * 2) / 2);
    item.upgradeLevel = Math.max(0, Math.min(7, Math.trunc(legacyNumber(item.upgradeLevel, 0))));
  } else if (item.tipo === ItemType.DEFENSIVE_EQUIPMENT) {
    item.tipoEquipamento = legacyKey(item.tipoEquipamento) === 'protecao' ? 'protecao' : 'traje';
    item.baseRD = Math.max(0, Math.trunc(legacyNumber(item.baseRD ?? item.rdBase, 2)));
    item.upgradeLevel = Math.max(0, Math.min(9, Math.trunc(legacyNumber(item.upgradeLevel, 0))));
  } else if (item.tipo === ItemType.CONSUMABLE) {
    item.descritorEfeito = String(item.descritorEfeito ?? item.effectDescriptor ?? 'Efeito descrito no backup original.');
    item.qtdDoses = Math.max(1, Math.trunc(legacyNumber(item.qtdDoses ?? item.doses, 1)));
    item.isRefeicao = legacyBoolean(item.isRefeicao ?? item.isMeal, false);
  } else if (item.tipo === ItemType.UPGRADE_MATERIAL) {
    item.tier = Math.max(1, Math.min(4, Math.trunc(legacyNumber(item.tier ?? item.materialTier, 1))));
    item.maxUpgradeLimit = Math.max(1, Math.trunc(legacyNumber(item.maxUpgradeLimit ?? item.materialMaxUpgradeLimit, 1)));
  }
  item.powers = item.powers.flatMap((power: any, index: number) => {
    const parsed = createPowerBodySchema.safeParse(power);
    if (parsed.success) return [parsed.data];
    warnings.push(`Poder ${index + 1} ignorado porque não pôde ser recuperado.`);
    return [];
  });
  item.powerArrays = item.powerArrays.flatMap((array: any, index: number) => {
    array.powers = (array.powers ?? []).flatMap((power: any, powerIndex: number) => {
      const parsedPower = createPowerBodySchema.safeParse(power);
      if (parsedPower.success) return [parsedPower.data];
      warnings.push(`Poder ${powerIndex + 1} do acervo ${index + 1} foi ignorado.`);
      return [];
    });
    if (array.powers.length === 0) {
      warnings.push(`Acervo ${index + 1} ignorado porque não restaram poderes válidos.`);
      return [];
    }
    const parsed = importPowerArraySchema.safeParse(array);
    if (parsed.success) return [parsed.data];
    warnings.push(`Acervo ${index + 1} ignorado porque não pôde ser recuperado.`);
    return [];
  });
  item.importWarnings = warnings;
  return item;
}

export const importItemBodySchema = z.preprocess((val: any) => {
  return normalizeLegacyItemBackup(val);
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
