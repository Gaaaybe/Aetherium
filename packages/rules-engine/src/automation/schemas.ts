import { z } from 'zod';
import type { EfeitoBehavior } from './types.js';

// ─── EfeitoBehavior — schema Zod ─────────────────────────────────────────────
// Valida o campo `behavior: Json` lido do banco.
// Novos kinds: adicionar variante aqui + executor em behaviors/.

export const efeitoBehaviorSchema: z.ZodType<EfeitoBehavior> = z.discriminatedUnion('kind', [
  // Ativos (ON_USE)
  z.object({
    kind: z.literal('DANO'),
    formula: z.string().optional(),
    tipoDano: z.string(),
  }),
  z.object({
    kind: z.literal('RECUPERACAO'),
    recurso: z.enum(['PV', 'PE']),
    formula: z.string(),
  }),
  z.object({
    kind: z.literal('MARCADOR'),
    markerId: z.string(),
    label: z.string(),
    duracao: z.enum(['CENA', 'PERMANENTE']),
    visivel: z.boolean(),
  }),
  z.object({
    kind: z.literal('GATILHO'),
    evento: z.string(),
    condicao: z.string(),
    efeitosFilhos: z.array(z.string()),
  }),
  z.object({
    kind: z.literal('FORTALECER'),
    alvo: z.enum(['PV_TEMP', 'PE_TEMP', 'DANO_BONUS', 'RD_BONUS', 'ACOES']),
    formula: z.string().optional(),
  }),
  z.object({
    kind: z.literal('APLICAR_CONDICAO'),
    condicaoId: z.string(),
    patamar: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  }),
  // Passivos mecânicos (PASSIVE)
  z.object({
    kind: z.literal('BONUS_ROLAGEM'),
    rollType: z.string(),
    value: z.number(),
    isAdvantage: z.boolean(),
  }),
  z.object({
    kind: z.literal('MODIFICADOR_RECURSO'),
    recurso: z.enum(['PV', 'PE']),
    formula: z.string(),
  }),
  z.object({
    kind: z.literal('BLOQUEIO_RECUPERACAO'),
    recurso: z.enum(['PE', 'PV']),
  }),
  z.object({
    kind: z.literal('MODIFICADOR_MOVIMENTO'),
    multiplier: z.number().optional(),
    bonus: z.number().optional(),
  }),
  z.object({
    kind: z.literal('VULNERABILIDADE_DESCRITOR'),
    descritor: z.string(),
  }),
  // Narrativo
  z.object({
    kind: z.literal('NARRATIVO'),
    descricao: z.string().optional(),
  }),
]);

// ─── ModificationBase automation fields ───────────────────────────────────────
// Validação dos campos de automação que serão adicionados ao ModificationBase
// (targetingEffect, casterEffect, markerCondition) na migration da Fase 1.

export const modificationBaseAutomationSchema = z.object({
  targetingEffect: z.enum(['AREA', 'SELETIVO', 'LIMITADO', 'NENHUM']),
  casterEffect: z.enum(['EFEITO_COLATERAL_SEMPRE', 'EFEITO_COLATERAL_AO_FALHAR', 'NENHUM']),
  markerCondition: z.string().optional(),
});

export type ModificationBaseAutomation = z.infer<typeof modificationBaseAutomationSchema>;

// ─── Helpers de parse seguro ──────────────────────────────────────────────────

/**
 * Parse seguro do campo `behavior` lido do banco.
 * Retorna null para payloads inválidos ou ausentes — tratado como NARRATIVO.
 */
export function parseBehavior(raw: unknown): EfeitoBehavior | null {
  if (raw === null || raw === undefined) return null;
  const result = efeitoBehaviorSchema.safeParse(raw);
  return result.success ? result.data : null;
}

/**
 * Parse seguro dos campos de automação de uma ModificationBase.
 * Retorna null se ausente ou inválido.
 */
export function parseModificationAutomation(raw: unknown): ModificationBaseAutomation | null {
  if (raw === null || raw === undefined) return null;
  const result = modificationBaseAutomationSchema.safeParse(raw);
  return result.success ? result.data : null;
}
