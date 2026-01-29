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
export const poderSchema = z.object({
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
}).refine((data) => {
  // Se domínio for científico, área de conhecimento é obrigatória
  if (data.dominioId === 'cientifico' && !data.dominioAreaConhecimento) {
    return false;
  }
  return true;
}, {
  message: 'Área de conhecimento é obrigatória para o domínio Científico',
  path: ['dominioAreaConhecimento'],
}).refine((data) => {
  // Se domínio for peculiar, ID da peculiaridade é obrigatório
  if (data.dominioId === 'peculiar' && !data.dominioIdPeculiar) {
    return false;
  }
  return true;
}, {
  message: 'Selecione uma peculiaridade ou crie uma nova',
  path: ['dominioIdPeculiar'],
});

/**
 * Schema parcial para validação durante edição (campos opcionais)
 */
export const poderParcialSchema = poderSchema.partial({
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
export type PoderValidado = z.infer<typeof poderSchema>;
export type PoderParcialValidado = z.infer<typeof poderParcialSchema>;
