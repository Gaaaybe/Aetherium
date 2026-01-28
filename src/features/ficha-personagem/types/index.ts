/**
 * Tipos para o Sistema de Ficha de Personagem
 * Spirit & Caos RPG System
 */

import type { Poder } from '../../criador-de-poder/types';

// ========================================
// CABEÇALHO DO PERSONAGEM
// ========================================

/**
 * Informações básicas e narrativas do personagem
 */
export interface CharacterHeader {
  name: string;
  identity: string;              // Ex: "Cavaleiro sem Rainha"
  origin: string;
  level: number;                 // 1 a 250
  // calamityRank removido - agora é calculado automaticamente via calcularRankCalamidade(level)
  
  // Atributos Chave para CD
  keyAttributeMental: 'Inteligência' | 'Sabedoria' | 'Carisma';
  keyAttributePhysical: 'Força' | 'Destreza' | 'Constituição';
  
  // Recursos Narrativos
  inspiration: number;           // 0 a 3
  runics: number;                // Dinheiro do sistema
  
  // Complicações e Motivações (Texto livre ou Array)
  complications: string[];
  motivations: string[];
  
  // Resistências e Imunidades
  resistancesImmunities: string; // Texto livre
}

// ========================================
// ATRIBUTOS
// ========================================

/**
 * Atributos do personagem (valores base)
 */
export interface Attributes {
  Força: number;
  Destreza: number;
  Constituição: number;
  Inteligência: number;
  Sabedoria: number;
  Carisma: number;
}

/**
 * Bônus temporários nos atributos (itens, buffs, poderes)
 */
export interface AttributeTempBonuses {
  Força: number;
  Destreza: number;
  Constituição: number;
  Inteligência: number;
  Sabedoria: number;
  Carisma: number;
}

/**
 * Tipo para nome de atributo
 */
export type AttributeName = keyof Attributes;

// ========================================
// VITAIS (PV, PE, DEFESAS)
// ========================================

/**
 * Recursos vitais do personagem
 */
export interface Vitals {
  pv: {
    current: number;
    max: number;                 // Calculado: 20 + (Nível * (4 + Mod.Con))
    temp: number;                // PV Temporário (Buffs)
  };
  pe: {
    current: number;
    max: number;                 // Calculado: sqrt(nivel) * 10
    temp: number;                // PE Temporário
  };
  deathCounters: number;         // 0 a 3 (Contador da Morte)
}

/**
 * Histórico de mudanças nos vitais (para sync futuro)
 */
export interface VitalChangeLog {
  timestamp: number;
  tipo: 'dano' | 'cura' | 'temp' | 'pe-gasto' | 'pe-recuperado';
  recurso: 'pv' | 'pe';
  valor: number;
  fonte?: string;                // Ex: "Ataque de Goblin", "Poção de Cura"
}

// ========================================
// PERÍCIAS
// ========================================

/**
 * Configuração de uma perícia individual
 */
export interface SkillEntry {
  id: string;                    // 'acrobacia', 'atletismo', etc.
  isEfficient: boolean;          // +Bônus de Eficiência (da Tabela Mestra)
  isInefficient: boolean;        // -Metade do Bônus
  trainingLevel: number;         // Bônus fixos de treino ou itens
  miscBonus: number;             // Bônus variados
}

/**
 * Estado de todas as perícias do personagem
 */
export type SkillsState = Record<string, SkillEntry>;

/**
 * Tipo para nome de perícia (mesmas do gerenciador de criaturas)
 */
export type SkillName = 
  | 'Acrobacia'
  | 'Adestrar Animais'
  | 'Atletismo'
  | 'Atuação'
  | 'Cavalgar'
  | 'Conhecimento'
  | 'Cura'
  | 'Diplomacia'
  | 'Enganação'
  | 'Furtividade'
  | 'Espiritismo'
  | 'Religião'
  | 'Exploração'
  | 'Intuição'
  | 'Ladinagem'
  | 'Ofício'
  | 'Percepção'
  | 'Sobrevivência'
  | 'Investigação'
  | 'Intimidação'
  | 'Iniciativa'
  | 'Fortitude'
  | 'Reflexos'
  | 'Vontade';

// ========================================
// DOMÍNIOS E PODERES
// ========================================

/**
 * Poder vinculado ao personagem
 * Representa o RELACIONAMENTO entre personagem e um poder da biblioteca
 */
export interface PersonagemPoder {
  id: string;                    // ID único da instância (vínculo)
  poderId: string;               // ID do PoderSalvo na biblioteca
  poder: Poder;                  // Dados completos do poder
  
  // Estado
  ativo: boolean;                // Está ativo/equipado?
  
  // Custos calculados (com maestria aplicada)
  pdaCost: number;               // Custo total em PdA
  espacosOccupied: number;       // Espaços ocupados
  
  // Configuração (para poderes variáveis)
  usosRestantes?: number;        // Se tiver limite de usos
  
  // Metadata
  dataCriacao: string;
  dataModificacao: string;
}

// ========================================
// INVENTÁRIO
// ========================================

/**
 * Item básico (placeholder - feature futura será mais complexa)
 */
export interface Item {
  id: string;
  name: string;
  description?: string;
  tipo: 'arma' | 'traje' | 'acessorio' | 'consumivel' | 'outro';
  
  // Bônus básicos
  bonusDano?: number;
  bonusRD?: number;
  bonusAtributo?: Partial<Attributes>;
}

/**
 * Inventário do personagem (sem peso - ilimitado)
 */
export interface Inventory {
  // O que está equipado
  equipped: {
    mainHand: Item | null;       // Mão principal
    offHand: Item | null;        // Mão secundária (arma/escudo)
    extraHands: Item[];          // Mãos extras (de poderes como Membros Extras)
    suit: Item | null;           // Traje (armadura/roupa)
    accessory: Item | null;      // Acessório
  };
  
  // Acesso Rápido (slots de consumíveis)
  quickSlots: Array<{
    item: Item;
    quantity: number;
  } | null>;
  
  // Mochila (lista geral)
  backpack: Item[];
}

// ========================================
// PERSONAGEM COMPLETO
// ========================================

/**
 * Estrutura completa do personagem
 */
export interface Personagem {
  id: string;
  
  // Seções
  header: CharacterHeader;
  attributes: Attributes;
  attributeTempBonuses: AttributeTempBonuses;
  vitals: Vitals;
  skills: SkillsState;
  poderes: PersonagemPoder[];
  inventory: Inventory;
  
  // Recursos de Economia de Poder
  pdaTotal: number;              // Total de PdA disponíveis (calculado)
  pdaExtras: number;             // PdA extras concedidos (manual)
  espacosDisponiveis: number;    // Espaços disponíveis (calculado)
  
  // Movimento
  deslocamento: number;          // Metros por turno (padrão: 9m, editável)
  
  // Metadata
  dataCriacao: string;
  dataModificacao: string;
  
  // Versão do schema (para hydration)
  schemaVersion?: string;
}

/**
 * Personagem salvo (com versão)
 */
export interface PersonagemSalvo extends Personagem {
  schemaVersion: string;
}

// ========================================
// CÁLCULOS DERIVADOS
// ========================================

/**
 * Valores calculados do personagem (não salvos, computados on-the-fly)
 * Estes valores são derivados e recalculados automaticamente
 */
export interface PersonagemCalculado {
  // Modificadores de atributos (calculados via ARREDONDAR.PARA.CIMA((atributo - 10) / 2))
  modificadores: Attributes;
  
  // Rank de Calamidade (calculado automaticamente pelo nível)
  calamityRank: string;
  
  // PdA Total (calculado automaticamente)
  pdaTotal: number;              // 15 + ((nivel-1)*7) + floor(nivel/5)*7 + extras
  
  // Pontos de Atributo
  pontosAtributoDisponiveis: number; // (nivel * (nivel+1) / 2) + (67 - somaAtributos)
  
  // Vitais Máximos
  pvMax: number;                 // (nivel * modCON) + 6
  peMax: number;                 // floor(899 * sqrt((modMental + modFisico) / 15000))
  
  // Movimento
  deslocamento: number;          // Metros por turno (padrão: 9m)
  
  // Classe de Dificuldade
  cdMental: number;              // 10 + modChave + nivel/2
  cdPhysical: number;            // 10 + modChave + nivel/2
  
  // Recursos
  pdaUsados: number;             // Soma dos custos dos poderes
  pdaDisponiveis: number;        // pdaTotal - pdaUsados
  espacosDisponiveis: number;    // floor(899 * sqrt(modInt / 15000)), mínimo 4
  espacosUsados: number;         // Soma dos espaços dos poderes
  
  // Redução de Dano (bloqueio)
  rdBloqueio: number;            // Traje + Arma/Escudo + modFortitude
  
  // Bônus de eficiência (round(3000 * (nivel/250)^2) + 1)
  bonusEficiencia: number;
}

// ========================================
// VALIDAÇÃO
// ========================================

/**
 * Resultado de validação
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// ========================================
// HYDRATION
// ========================================

/**
 * Resultado do processo de hydration
 */
export interface HydrationResult {
  personagem: Personagem;
  warnings: string[];            // Avisos não críticos
  changes: string[];             // Mudanças aplicadas
}
