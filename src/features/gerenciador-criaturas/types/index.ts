/**
 * Tipos para o Sistema de Gerenciamento de Criaturas - V2
 * Spirit & Caos RPG System
 */

import type { Attribute, Save, Skill } from '../data/constants';

// ========================================
// TABELA MESTRA (Dados Base por Nível)
// ========================================

/**
 * Representa uma linha da Tabela Mestra do Excel
 * Contém todos os valores base para um nível específico (1-250)
 */
export interface MasterRow {
  level: number;              // NA (Nível)
  tier?: string;              // Grau Máximo (ex: "Grau 1", "Grau 12")
  scaleName?: string;         // Nome da escala (Raposa, Lobo, Tigre, etc.)
  
  // PV String - Formato: "min / base / max"
  pvString: string;           // PV (ex: "4 / 7 / 8")
  pvMin: number;              // Valor mínimo parseado
  pvBase: number;             // Valor base parseado (meio)
  pvMax: number;              // Valor máximo parseado
  
  // Modificadores de Atributos/Perícias
  modMajor: number;           // Modificador Maior
  modMedium: number;          // Modificador Médio
  modMinor: number;           // Modificador Menor
  
  // Recursos
  effortUnit: number;         // Unidade de Esforço (custo PE)
  peBase: number;             // PE Base (bateria de energia)
  efficiency: number;         // Bônus de Eficiência
  
  // Combate
  cdEffect: number;           // CD para Efeitos
  atkBonus: number;           // Bônus de Ataque Simples
  keySkill: number;           // Perícias Chave
  dmgBase: number;            // Dano Ataque Simples
  
  // Resistências String - Formato: "menor / média / maior"
  resString: string;          // Resistências (ex: "-2 / 1 / 2")
  resMinor: number;           // Resistência Menor parseada
  resMedium: number;          // Resistência Média parseada
  resMajor: number;           // Resistência Maior parseada
}

// ========================================
// TEMPLATES DE FUNÇÃO (ROLES)
// ========================================

/**
 * Funções disponíveis para criaturas
 * Cada função tem multiplicadores diferentes
 */
export type CreatureRole = 
  | 'Lacaio' 
  | 'Padrao' 
  | 'Bruto' 
  | 'Elite' 
  | 'ChefeSolo';

/**
 * Template de multiplicadores por função
 */
export interface RoleTemplate {
  id: CreatureRole;
  name: string;
  description: string;
  
  // Multiplicadores
  pvMultiplier: number;           // Multiplicador de PV
  peMultiplier: number;           // Multiplicador de PE
  damageMultiplier: number;       // Multiplicador de Dano
  
  // Qual modificador usar para ataque
  attackModifier: 'major' | 'medium' | 'minor';
  attackBonus?: number;           // Bônus adicional de ataque
  attackMultiplier?: number;      // Multiplicador de bônus de ataque (para Chefe)
  
  // Mecânicas especiais
  isBoss: boolean;                // Se é chefe (tem soberania)
  
  // Range para Chefe Solo
  pvMultiplierRange?: [number, number]; // ex: [10, 15]
}

// ========================================
// CRIATURA (Estado Final Calculado)
// ========================================

/**
 * Status da criatura no combate
 */
export type CreatureStatus = 'ativo' | 'derrotado' | 'oculto' | 'aliado';

/**
 * Mecânicas especiais de chefes/elites
 */
export interface BossMechanics {
  sovereignty: number;          // Pontos de Soberania (ações extras)
  sovereigntyMax: number;       // Máximo de soberania
}

/**
 * Estatísticas calculadas da criatura
 */
export interface CreatureStats {
  // Vitalidade e Recursos
  hp: number;                   // PV Atual
  maxHp: number;                // PV Máximo
  pe: number;                   // PE Atual
  maxPe: number;                // PE Máximo
  effortUnit: number;           // Custo de Habilidades
  
  // Defesas
  rd: number;                   // Redução de Dano (editável)
  speed: number;                // Deslocamento (padrão 9m)
  
  // Combate
  attackBonus: number;          // Bônus de Ataque Final
  damage: number;               // Dano Base (editável)
  cdEffect: number;             // CD para Efeitos
  
  // Perícias e Resistências
  keySkill: number;             // Valor Perícia Chave
  resistances: {
    minor: number;              // Resistência Menor
    medium: number;             // Resistência Média
    major: number;              // Resistência Maior
  };
  
  // Extras
  efficiency: number;           // Bônus de Eficiência
}

/**
 * V2: Distribuição de Atributos do Usuário
 */
export interface AttributeDistribution {
  major: Attribute[];           // Atributos que recebem Mod Maior
  medium: Attribute[];          // Atributos que recebem Mod Médio
  minor: Attribute[];           // (Calculado auto: o que sobrou)
}

/**
 * V2: Distribuição de Resistências do Usuário
 */
export interface SaveDistribution {
  strong: Save[];               // Resistências que recebem valor Maior
  medium: Save[];               // Resistências que recebem valor Médio
  weak: Save[];                 // (Calculado auto: o que sobrou)
}

/**
 * V2: Estatísticas Calculadas com Distribuições Dinâmicas
 */
export interface CreatureStatsV2 {
  // Atributos Finais (6 atributos com seus modificadores)
  attributes: Record<Attribute, number>;
  
  // Resistências Finais (3 resistências com seus valores)
  saves: Record<Save, number>;
  
  // Perícias Selecionadas (apenas as escolhidas)
  skills: Record<string, number>;
  
  // Combate
  combat: {
    hp: number;
    maxHp: number;
    pe: number;
    maxPe: number;
    effortUnit: number;
    attackBonus: number;      // Baseado no atributo principal
    defense: number;          // Baseado no atributo de defesa (geralmente Des)
    damage: number;
    dcPrimary: number;        // CD Principal
    rd: number;
    speed: number;
  };
  
  // Extras
  efficiency: number;
}

/**
 * Criatura Completa
 */
export interface Creature {
  id: string;
  name: string;
  level: number;                // 1 a 250
  role: CreatureRole;
  
  // V2: Configurações do Usuário
  attributeDistribution?: AttributeDistribution;
  saveDistribution?: SaveDistribution;
  selectedSkills?: Skill[];
  
  // Stats calculados
  stats: CreatureStats;
  statsV2?: CreatureStatsV2;    // Nova estrutura de stats
  
  // Ligação com outras features
  abilities: string[];          // IDs dos poderes (do criador-de-poder)
  items: string[];              // IDs dos itens (feature futura)
  
  // Board específico
  position: { x: number; y: number };
  color?: string;               // Cor do card no board
  notes?: string;               // Notas do mestre
  status: CreatureStatus;
  
  // Mecânicas de Chefe
  bossMechanics?: BossMechanics;
  
  // Metadados
  createdAt: number;            // Timestamp
  updatedAt: number;            // Timestamp
}

// ========================================
// BOARD (Estado do Canvas)
// ========================================

/**
 * Estado do Board de Criaturas
 */
export interface CreatureBoard {
  creatures: Creature[];
  selectedId?: string;
  zoom: number;
  panOffset: { x: number; y: number };
}

// ========================================
// FORMS E INPUT
// ========================================

/**
 * Input para criar/editar criatura - V2
 */
export interface CreatureFormInput {
  name: string;
  level: number;
  role: CreatureRole;
  sovereigntyMultiplier?: number;  // Multiplicador de PV para Chefe Solo (10-15)
  sovereignty?: number;            // Pontos de Soberania (ações extras) - Elite/ChefeSolo
  
  // V2: Distribuições
  attributeDistribution?: AttributeDistribution;
  saveDistribution?: SaveDistribution;
  selectedSkills?: Skill[];
  
  // Overrides manuais
  rdOverride?: number;
  speedOverride?: number;
  
  // Board
  color?: string;
  notes?: string;
}

/**
 * Resultado do cálculo de stats
 */
export interface CalculatedStats extends CreatureStats {
  baseValues: {
    hpBase: number;
    peBase: number;
    damageBase: number;
  };
  appliedMultipliers: {
    pvMultiplier: number;
    peMultiplier: number;
    damageMultiplier: number;
  };
}
