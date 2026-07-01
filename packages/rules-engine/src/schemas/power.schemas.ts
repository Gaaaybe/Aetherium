import { z } from 'zod';
import { DomainSchema } from './domain.schemas.js';

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
  dadoModularizado: z.string().optional(),
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
  dominio: DomainSchema,
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
  icone: z.string().url('Ícone deve ser um link válido').optional(),
});

export const updatePowerBodySchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  descricao: z.string().min(10).max(1000).optional(),
  dominio: DomainSchema.optional(),
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
  icone: z.union([z.string().url('Ícone deve ser um link válido'), z.null()]).optional(),
});

export const createPowerArrayBodySchema = z.object({
  nome: z.string().min(2).max(100),
  descricao: z.string().min(10).max(1000),
  dominio: DomainSchema,
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
  icone: z.string().url('Ícone deve ser um link válido').optional(),
});

export const updatePowerArrayBodySchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  descricao: z.string().min(10).max(1000).optional(),
  dominio: DomainSchema.optional(),
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
  icone: z.union([z.string().url('Ícone deve ser um link válido'), z.null()]).optional(),
});

export const createPeculiarityBodySchema = z.object({
  nome: z.string().min(2).max(100),
  descricao: z.string().min(10).max(10000),
  espiritual: z.boolean(),
  isPublic: z.boolean().optional(),
  icone: z.string().url('Ícone deve ser um link válido').optional(),
});

export const updatePeculiarityBodySchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  descricao: z.string().min(10).max(10000).optional(),
  espiritual: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  icone: z.union([z.string().url('Ícone deve ser um link válido'), z.null()]).optional(),
});
