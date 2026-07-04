import { z } from 'zod';

/**
 * Schema de validação para ModificacaoAplicada
 */
export const modificacaoAplicadaSchema = z.object({
  id: z.string().min(1, 'ID da modificação é obrigatório'),
  modificacaoBaseId: z.string().min(1, 'ID base da modificação é obrigatório'),
  escopo: z.enum(['global', 'local'], {
    message: 'Escopo deve ser "global" ou "local"',
  }),
  parametros: z.record(z.string(), z.any()).optional(),
  grauModificacao: z.number().int().min(1).max(20).optional(),
  nota: z.string().optional(),
});

function obterBonusFortalecerPorGrau(grau: number): number {
  if (grau <= 0) return 0;
  if (grau === 1) return 3;
  if (grau === 2) return 5;
  if (grau === 3) return 10;
  return 10 + (grau - 3) * 15;
}

interface FortaleceAlvo {
  tipo: 'atributo' | 'pericia';
  alvo: string;
  bonus: number;
}

function parseAlocacoes(input: string | undefined, tipoPadrao: 'atributo' | 'pericia', bonusPadrao: number): FortaleceAlvo[] {
  if (!input) return [];
  try {
    const trimmed = input.trim();
    if (trimmed.startsWith('[')) {
      return JSON.parse(trimmed);
    }
    if (trimmed) {
      return [{ tipo: tipoPadrao, alvo: trimmed, bonus: bonusPadrao }];
    }
    return [];
  } catch (e) {
    if (input) {
      return [{ tipo: tipoPadrao, alvo: input, bonus: bonusPadrao }];
    }
    return [];
  }
}

/**
 * Schema de validação para EfeitoAplicado
 */
export const efeitoAplicadoSchema = z.object({
  id: z.string().min(1, 'ID do efeito é obrigatório'),
  efeitoBaseId: z.string().min(1, 'ID base do efeito é obrigatório'),
  grau: z
    .number()
    .int('Grau deve ser um número inteiro')
    .min(-5, 'Grau mínimo é -5')
    .max(20, 'Grau máximo é 20'),
  modificacoesLocais: z.array(modificacaoAplicadaSchema).default([]),
  inputCustomizado: z.string().optional(),
  configuracaoSelecionada: z.string().optional(),
}).refine((ef) => {
  if (ef.efeitoBaseId === 'dano' && ef.inputCustomizado && ef.inputCustomizado.length > 30) {
    return false;
  }
  return true;
}, {
  message: 'O tipo/descritor de dano deve ter no máximo 30 caracteres',
  path: ['inputCustomizado'],
}).refine((ef) => {
  if (ef.efeitoBaseId === 'fortalecer') {
    const bonusMax = obterBonusFortalecerPorGrau(ef.grau);
    const tipoSelecionado = (ef.configuracaoSelecionada as 'atributo' | 'pericia') || 'atributo';
    const alocacoes = parseAlocacoes(ef.inputCustomizado, tipoSelecionado, bonusMax);
    const somaAlocada = alocacoes.reduce((sum, item) => sum + item.bonus, 0);
    return somaAlocada <= bonusMax;
  }
  return true;
}, {
  message: 'Os bônus alocados do Fortalecer excedem o limite do Grau correspondente',
  path: ['inputCustomizado'],
});

/**
 * Schema de validação para custo alternativo
 */
export const custoAlternativoSchema = z.object({
  tipo: z.enum(['pe', 'pv', 'atributo', 'item', 'material']),
  usaEfeitoColateral: z.boolean().optional(),
  descricao: z.string().optional(),
  valorMaterial: z.number().positive().optional(),
}).optional();

/**
 * Schema de validação para Poder
 */
export const poderBaseSchema = z.object({
  id: z.string().min(1, 'ID do poder é obrigatório'),
  nome: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .refine((val) => val !== 'Novo Poder', {
      message: 'Por favor, dê um nome único ao poder',
    }),
  descricao: z.string().max(1000, 'Descrição deve ter no máximo 1000 caracteres').optional(),
  dominioId: z.string().min(1, 'Domínio é obrigatório'),
  dominioAreaConhecimento: z.string().optional(),
  dominioIdPeculiar: z.string().optional(),
  efeitos: z
    .array(efeitoAplicadoSchema)
    .min(1, 'Adicione pelo menos um efeito ao poder')
    .max(10, 'Máximo de 10 efeitos por poder'),
  modificacoesGlobais: z.array(modificacaoAplicadaSchema).default([]),
  acao: z.number().int().min(0).max(5),
  alcance: z.number().int().min(0).max(6),
  duracao: z.number().int().min(0).max(4),
  custoAlternativo: custoAlternativoSchema,
});

export const poderSchema = poderBaseSchema
  .refine((data) => {
    if (data.dominioId === 'cientifico' && !data.dominioAreaConhecimento) {
      return false;
    }
    return true;
  }, {
    message: 'Área de conhecimento é obrigatória para o domínio Científico',
    path: ['dominioAreaConhecimento'],
  })
  .refine((data) => {
    if (data.dominioId === 'peculiar' && !data.dominioIdPeculiar) {
      return false;
    }
    return true;
  }, {
    message: 'Selecione uma peculiaridade ou crie uma nova',
    path: ['dominioIdPeculiar'],
  });

/**
 * Schema parcial para validação durante edição (campos opcionais).
 * Usa poderBaseSchema porque .partial() não funciona em ZodEffects (.refine).
 */
export const poderParcialSchema = poderBaseSchema.partial({
  efeitos: true,
  nome: true,
});

/**
 * Schema para validar dados antes de salvar na biblioteca
 * (Reutiliza o schema principal que já contém todas as validações necessárias)
 */
export const poderParaSalvarSchema = poderSchema;

/**
 * Type inference a partir dos schemas
 */
export type ModificacaoAplicadaValidada = z.infer<typeof modificacaoAplicadaSchema>;
export type EfeitoAplicadoValidado = z.infer<typeof efeitoAplicadoSchema>;
export type PoderBaseValidado = z.infer<typeof poderBaseSchema>;
export type PoderValidado = z.infer<typeof poderSchema>;
export type PoderParcialValidado = z.infer<typeof poderParcialSchema>;
