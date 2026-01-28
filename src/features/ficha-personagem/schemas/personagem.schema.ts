/**
 * Schemas de Validação - Ficha de Personagem
 * Spirit & Caos RPG System
 * 
 * Validação usando Zod para garantir integridade dos dados
 */

import { z } from 'zod';

// ========================================
// SCHEMAS BASE
// ========================================

/**
 * Schema para atributos
 */
export const attributesSchema = z.object({
  Força: z.number().int().min(1).max(30),
  Destreza: z.number().int().min(1).max(30),
  Constituição: z.number().int().min(1).max(30),
  Inteligência: z.number().int().min(1).max(30),
  Sabedoria: z.number().int().min(1).max(30),
  Carisma: z.number().int().min(1).max(30),
});

/**
 * Schema para bônus temporários de atributos
 */
export const attributeTempBonusesSchema = z.object({
  Força: z.number().int().default(0),
  Destreza: z.number().int().default(0),
  Constituição: z.number().int().default(0),
  Inteligência: z.number().int().default(0),
  Sabedoria: z.number().int().default(0),
  Carisma: z.number().int().default(0),
});

/**
 * Schema para cabeçalho do personagem
 */
export const characterHeaderSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  identity: z.string().max(200).default(''),
  origin: z.string().max(500).default(''),
  level: z.number().int().min(1).max(250),
  // calamityRank removido - agora é calculado automaticamente
  
  // Atributos chave
  keyAttributeMental: z.enum(['Inteligência', 'Sabedoria', 'Carisma']),
  keyAttributePhysical: z.enum(['Força', 'Destreza', 'Constituição']),
  
  // Recursos narrativos
  inspiration: z.number().int().min(0).max(3).default(0),
  runics: z.number().int().min(0).default(0),
  
  // Narrativa
  complications: z.array(z.string()).default([]),
  motivations: z.array(z.string()).default([]),
  resistancesImmunities: z.string().default(''),
});

/**
 * Schema para vitais
 */
export const vitalsSchema = z.object({
  pv: z.object({
    current: z.number().int().min(0),
    max: z.number().int().min(1),
    temp: z.number().int().min(0).default(0),
  }),
  pe: z.object({
    current: z.number().int().min(0),
    max: z.number().int().min(1),
    temp: z.number().int().min(0).default(0),
  }),
  deathCounters: z.number().int().min(0).max(3).default(0),
});

/**
 * Schema para histórico de vitais
 */
export const vitalChangeLogSchema = z.object({
  timestamp: z.number(),
  tipo: z.enum(['dano', 'cura', 'temp', 'pe-gasto', 'pe-recuperado']),
  recurso: z.enum(['pv', 'pe']),
  valor: z.number().int(),
  fonte: z.string().optional(),
});

/**
 * Schema para entrada de perícia
 */
export const skillEntrySchema = z.object({
  id: z.string(),
  isEfficient: z.boolean().default(false),
  isInefficient: z.boolean().default(false),
  trainingLevel: z.number().int().min(0).default(0),
  miscBonus: z.number().int().default(0),
});

/**
 * Schema para estado de perícias
 */
export const skillsStateSchema = z.record(z.string(), skillEntrySchema);

/**
 * Schema para item
 */
export const itemSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  tipo: z.enum(['arma', 'traje', 'acessorio', 'consumivel', 'outro']),
  
  // Bônus
  bonusDano: z.number().int().optional(),
  bonusRD: z.number().int().optional(),
  bonusAtributo: attributesSchema.partial().optional(),
});

/**
 * Schema para poder do personagem
 */
export const personagemPoderSchema = z.object({
  id: z.string(),
  poderId: z.string(),
  poder: z.any(), // Usar schema do Poder quando importado
  
  ativo: z.boolean().default(true),
  
  pdaCost: z.number().int().min(0),
  espacosOccupied: z.number().int().min(0),
  
  usosRestantes: z.number().int().min(0).optional(),
  
  dataCriacao: z.string(),
  dataModificacao: z.string(),
});

/**
 * Schema para inventário
 */
export const inventorySchema = z.object({
  equipped: z.object({
    mainHand: itemSchema.nullable(),
    offHand: itemSchema.nullable(),
    extraHands: z.array(itemSchema).default([]),
    suit: itemSchema.nullable(),
    accessory: itemSchema.nullable(),
  }),
  quickSlots: z.array(
    z.object({
      item: itemSchema,
      quantity: z.number().int().min(1),
    }).nullable()
  ).length(6).default(Array(6).fill(null)),
  backpack: z.array(itemSchema).default([]),
});

// ========================================
// SCHEMA PRINCIPAL
// ========================================

/**
 * Schema completo do personagem
 */
export const personagemSchema = z.object({
  id: z.string(),
  
  // Seções
  header: characterHeaderSchema,
  attributes: attributesSchema,
  attributeTempBonuses: attributeTempBonusesSchema,
  vitals: vitalsSchema,
  skills: skillsStateSchema,
  poderes: z.array(personagemPoderSchema),
  inventory: inventorySchema,
  
  // Economia de poder
  pdaTotal: z.number().int().min(0),
  pdaExtras: z.number().int().min(0).default(0),
  espacosDisponiveis: z.number().int().min(0),
  
  // Movimento
  deslocamento: z.number().int().min(0).default(9),
  
  // Metadata
  dataCriacao: z.string(),
  dataModificacao: z.string(),
  schemaVersion: z.string().optional(),
})
.refine(
  (data) => {
    // Validação: PdA usados não pode exceder PdA total
    const pdaUsados = data.poderes.reduce((sum, p) => sum + p.pdaCost, 0);
    return pdaUsados <= data.pdaTotal;
  },
  {
    message: 'PdA usados excede o total disponível',
    path: ['poderes'],
  }
)
.refine(
  (data) => {
    // Validação: Espaços usados não pode exceder espaços disponíveis
    const espacosUsados = data.poderes.reduce((sum, p) => sum + p.espacosOccupied, 0);
    return espacosUsados <= data.espacosDisponiveis;
  },
  {
    message: 'Espaços usados excede o total disponível',
    path: ['poderes'],
  }
)
.refine(
  (data) => {
    // Validação: PV atual não pode exceder PV máximo + temp
    return data.vitals.pv.current <= (data.vitals.pv.max + data.vitals.pv.temp);
  },
  {
    message: 'PV atual não pode exceder PV máximo + temporário',
    path: ['vitals', 'pv'],
  }
)
.refine(
  (data) => {
    // Validação: PE atual não pode exceder PE máximo + temp
    return data.vitals.pe.current <= (data.vitals.pe.max + data.vitals.pe.temp);
  },
  {
    message: 'PE atual não pode exceder PE máximo + temporário',
    path: ['vitals', 'pe'],
  }
);

/**
 * Schema para personagem salvo (com versão obrigatória)
 */
export const personagemSalvoSchema = personagemSchema.and(
  z.object({
    schemaVersion: z.string().min(1),
  })
);

// ========================================
// TIPOS INFERIDOS
// ========================================

export type PersonagemSchemaType = z.infer<typeof personagemSchema>;
export type PersonagemSalvoSchemaType = z.infer<typeof personagemSalvoSchema>;
export type CharacterHeaderSchemaType = z.infer<typeof characterHeaderSchema>;
export type AttributesSchemaType = z.infer<typeof attributesSchema>;
export type VitalsSchemaType = z.infer<typeof vitalsSchema>;
export type PersonagemPoderSchemaType = z.infer<typeof personagemPoderSchema>;
