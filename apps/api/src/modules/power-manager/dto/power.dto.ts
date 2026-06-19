import { z } from 'zod';

export const dominioSchema = z
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
    peculiarId: z.string().optional(),
  })
  .refine((d) => d.name !== 'cientifico' || !!d.areaConhecimento, {
    message: 'Domínio Científico requer área de conhecimento',
    path: ['areaConhecimento'],
  })
  .refine((d) => d.name !== 'peculiar' || !!d.peculiarId, {
    message: 'Domínio Peculiar requer ID da peculiaridade',
    path: ['peculiarId'],
  });

export const appliedModificationSchema = z.object({
  modificationBaseId: z.string().min(1, 'ID da modificação base é obrigatório'),
  scope: z.enum(['global', 'local']),
  grau: z.number().int().min(1).optional(),
  parametros: z.record(z.string(), z.unknown()).optional(),
  nota: z.string().max(500).optional(),
});

export const appliedEffectSchema = z.object({
  effectBaseId: z.string().min(1, 'ID do efeito base é obrigatório'),
  grau: z.number().int().min(-5).max(20),
  configuracaoId: z.string().min(1).optional(),
  inputValue: z.union([z.string(), z.number()]).optional(),
  modifications: z.array(appliedModificationSchema).default([]),
  nota: z.string().max(500).optional(),
});

export const custoAlternativoSchema = z.object({
  tipo: z.enum(['pe', 'pv', 'atributo', 'item', 'material']),
  quantidade: z.number().positive(),
  descricao: z.string().optional(),
  atributo: z.string().optional(),
  itemId: z.string().optional(),
});

export const createPowerBodySchema = z.object({
  nome: z.string().min(2).max(100),
  descricao: z.string().min(10).max(1000),
  dominio: dominioSchema,
  parametros: z.object({
    acao: z.number().int().min(0).max(5),
    alcance: z.number().int().min(0).max(6),
    duracao: z.number().int().min(0).max(4),
  }),
  effects: z.array(appliedEffectSchema).min(1).max(20),
  globalModifications: z.array(appliedModificationSchema).default([]),
  custoAlternativo: custoAlternativoSchema.optional(),
  isPublic: z.boolean().default(false),
  notas: z.string().max(2000).optional(),
  icone: z.url('Ícone deve ser um link válido').optional(),
});

export type CreatePowerBodySchema = z.infer<typeof createPowerBodySchema>;

export const updatePowerBodySchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  descricao: z.string().min(10).max(1000).optional(),
  dominio: dominioSchema.optional(),
  parametros: z
    .object({
      acao: z.number().int().min(0).max(5),
      alcance: z.number().int().min(0).max(6),
      duracao: z.number().int().min(0).max(4),
    })
    .optional(),
  effects: z.array(appliedEffectSchema).min(1).max(20).optional(),
  globalModifications: z.array(appliedModificationSchema).optional(),
  custoAlternativo: custoAlternativoSchema.optional(),
  isPublic: z.boolean().optional(),
  notas: z.string().max(2000).optional(),
  icone: z.union([z.url('Ícone deve ser um link válido'), z.null()]).optional(),
});

export type UpdatePowerBodySchema = z.infer<typeof updatePowerBodySchema>;

export const createPowerArrayBodySchema = z.object({
  nome: z.string().min(2).max(100),
  descricao: z.string().min(10).max(1000),
  dominio: dominioSchema,
  parametrosBase: z
    .object({
      acao: z.number().int().min(0).max(5),
      alcance: z.number().int().min(0).max(6),
      duracao: z.number().int().min(0).max(4),
    })
    .optional(),
  powerIds: z.array(z.string()).min(1),
  isPublic: z.boolean().default(false),
  notas: z.string().max(2000).optional(),
  icone: z.url('Ícone deve ser um link válido').optional(),
});

export type CreatePowerArrayBodySchema = z.infer<typeof createPowerArrayBodySchema>;

export const updatePowerArrayBodySchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  descricao: z.string().min(10).max(1000).optional(),
  dominio: dominioSchema.optional(),
  parametrosBase: z
    .object({
      acao: z.number().int().min(0).max(5),
      alcance: z.number().int().min(0).max(6),
      duracao: z.number().int().min(0).max(4),
    })
    .optional(),
  powerIds: z.array(z.string()).min(1).optional(),
  isPublic: z.boolean().optional(),
  notas: z.string().max(2000).optional(),
  icone: z.union([z.url('Ícone deve ser um link válido'), z.null()]).optional(),
});

export type UpdatePowerArrayBodySchema = z.infer<typeof updatePowerArrayBodySchema>;

export const createPeculiarityBodySchema = z.object({
  nome: z.string().min(2).max(100),
  descricao: z.string().min(10).max(10000),
  espiritual: z.boolean(),
  isPublic: z.boolean().optional(),
  icone: z.url('Ícone deve ser um link válido').optional(),
});

export type CreatePeculiarityBodySchema = z.infer<typeof createPeculiarityBodySchema>;

export const updatePeculiarityBodySchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  descricao: z.string().min(10).max(10000).optional(),
  espiritual: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  icone: z.union([z.url('Ícone deve ser um link válido'), z.null()]).optional(),
});

export type UpdatePeculiarityBodySchema = z.infer<typeof updatePeculiarityBodySchema>;

function formatAppliedModification(mod: any) {
  return {
    modificationBaseId: mod.modificationBaseId,
    scope: mod.scope.toLowerCase(),
    grau: mod.grau,
    parametros: mod.parametros ?? null,
    nota: mod.nota ?? null,
  };
}

function formatAppliedEffect(effect: any) {
  return {
    id: effect.id,
    effectBaseId: effect.effectBaseId,
    grau: effect.grau,
    configuracaoId: effect.configuracaoId ?? null,
    inputValue: effect.inputValue ?? null,
    custo: {
      pda: effect.custoPda,
      pe: effect.custoPe,
      espacos: effect.custoEspacos,
    },
    modifications: effect.appliedModifications ? effect.appliedModifications.filter((am: any) => am.scope !== 'GLOBAL').map(formatAppliedModification) : [],
    nota: effect.nota ?? null,
  };
}

export function formatPowerToHTTP(raw: any) {
  const alt = raw.custoAlternativoTipo
    ? {
        tipo: raw.custoAlternativoTipo.toLowerCase(),
        quantidade: raw.custoAlternativoQuantidade,
        descricao: raw.custoAlternativoDescricao ?? null,
        atributo: raw.custoAlternativoAtributo ?? null,
        itemId: raw.custoAlternativoItemId ?? null,
      }
    : null;

  const appliedEffects = raw.appliedEffects ? raw.appliedEffects : [];
  const globalModifications: any[] = [];
  if (raw.appliedEffects) {
    for (const ae of raw.appliedEffects) {
      if (ae.appliedModifications) {
        for (const am of ae.appliedModifications) {
          if (am.scope === 'GLOBAL') {
            globalModifications.push(am);
          }
        }
      }
    }
  }

  return {
    id: raw.id,
    userId: raw.userId ?? null,
    characterId: raw.characterId ?? null,
    nome: raw.nome,
    descricao: raw.descricao,
    isPublic: raw.isPublic,
    icone: raw.icone ?? null,
    notas: raw.notas ?? null,
    dominio: {
      name: raw.domainName.toLowerCase().replace(/_/g, '-'),
      areaConhecimento: raw.domainAreaConhecimento ?? null,
      peculiarId: raw.domainPeculiarId ?? null,
    },
    parametros: {
      acao: raw.parametrosAcao,
      alcance: raw.parametrosAlcance,
      duracao: raw.parametrosDuracao,
    },
    custoTotal: {
      pda: raw.custoTotalPda,
      pe: raw.custoTotalPe,
      espacos: raw.custoTotalEspacos,
    },
    custoAlternativo: alt,
    effects: appliedEffects.map(formatAppliedEffect),
    globalModifications: globalModifications.map(formatAppliedModification),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? null,
    userName: raw.user?.name ?? null,
  };
}

export function formatPowerArrayToHTTP(raw: any) {
  const pb = raw.parametrosBaseAcao !== null && raw.parametrosBaseAlcance !== null && raw.parametrosBaseDuracao !== null
    ? {
        acao: raw.parametrosBaseAcao,
        alcance: raw.parametrosBaseAlcance,
        duracao: raw.parametrosBaseDuracao,
      }
    : null;

  const powers = raw.powerArrayPowers ? raw.powerArrayPowers.map((pap: any) => pap.power) : [];

  return {
    id: raw.id,
    userId: raw.userId ?? null,
    characterId: raw.characterId ?? null,
    nome: raw.nome,
    descricao: raw.descricao,
    isPublic: raw.isPublic,
    icone: raw.icone ?? null,
    notas: raw.notas ?? null,
    dominio: {
      name: raw.domainName.toLowerCase().replace(/_/g, '-'),
      areaConhecimento: raw.domainAreaConhecimento ?? null,
      peculiarId: raw.domainPeculiarId ?? null,
    },
    parametrosBase: pb,
    custoTotal: {
      pda: raw.custoTotalPda,
      pe: raw.custoTotalPe,
      espacos: raw.custoTotalEspacos,
    },
    powers: powers.map(formatPowerToHTTP),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? null,
    userName: raw.user?.name ?? null,
  };
}

export function formatPeculiarityToHTTP(raw: any) {
  return {
    id: raw.id,
    userId: raw.userId,
    nome: raw.nome,
    descricao: raw.descricao,
    espiritual: raw.espiritual,
    isPublic: raw.isPublic,
    icone: raw.icone ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? null,
    userName: raw.user?.name ?? null,
  };
}

export function formatEffectBaseToHTTP(raw: any) {
  return {
    id: raw.id,
    nome: raw.nome,
    custoBase: raw.custoBase,
    descricao: raw.descricao,
    categorias: raw.categorias,
    exemplos: raw.exemplos ?? null,
    parametrosPadrao: {
      acao: raw.parametrosPadraoAcao,
      alcance: raw.parametrosPadraoAlcance,
      duracao: raw.parametrosPadraoDuracao,
    },
    requerInput: raw.requerInput,
    tipoInput: raw.tipoInput ?? null,
    labelInput: raw.labelInput ?? null,
    opcoesInput: raw.opcoesInput ?? [],
    placeholderInput: raw.placeholderInput ?? null,
    configuracoes: raw.configuracoes ?? null,
  };
}

export function formatModificationBaseToHTTP(raw: any) {
  return {
    id: raw.id,
    nome: raw.nome,
    tipo: raw.tipo.toLowerCase(),
    custoFixo: raw.custoFixo,
    custoPorGrau: raw.custoPorGrau,
    descricao: raw.descricao,
    categoria: raw.categoria,
    observacoes: raw.observacoes ?? null,
    detalhesGrau: raw.detalhesGrau ?? null,
    requerParametros: raw.requerParametros,
    tipoParametro: raw.tipoParametro ?? null,
    opcoes: raw.opcoes ?? [],
    grauMinimo: raw.grauMinimo ?? null,
    grauMaximo: raw.grauMaximo ?? null,
    placeholder: raw.placeholder ?? null,
    configuracoes: raw.configuracoes ?? null,
  };
}

