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
  sovereignty: number;          // Pontos de Soberania Atual
  sovereigntyMax: number;       // Máximo de soberania
}

/**
 * Recursos rastreáveis da criatura (valores atuais)
 */
export interface CreatureResources {
  hp: number;                   // PV Atual
  pe: number;                   // PE Atual
  sovereignty?: number;         // Soberania atual (se for chefe)
}

/**
 * Estatísticas calculadas da criatura
 */
export interface CreatureStats {
  // Vitalidade e Recursos
  hp: number;                   // PV Atual (inicializado com maxHp)
  maxHp: number;                // PV Máximo
  pe: number;                   // PE Atual (inicializado com maxPe)
  maxPe: number;                // PE Máximo
  effortUnit: number;           // Custo de Habilidades
  
  // Defesas
  rd: number;                   // Redução de Dano (editável)
  speed: number;                // Deslocamento (padrão 9m)
  
  // Combate
  attackBonus: number;          // Bônus de Ataque Final
  damage: number;               // Dano Máximo (editável)
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
  
  // Ataques e Habilidades
  attacks: CreatureAttack[];
  creatureAbilities: CreatureAbility[];
  
  // Ligação com outras features (legacy)
  abilities: string[];          // IDs dos poderes (do criador-de-poder) - deprecated, usar creatureAbilities
  items: string[];              // IDs dos itens (feature futura)
  
  // Board específico
  position: { x: number; y: number };
  color?: string;               // Cor do card no board
  notes?: string;               // Notas do mestre
  status: CreatureStatus;
  imageUrl?: string;            // URL da imagem ou base64
  imagePosition?: { x: number; y: number }; // Posição da imagem (object-position %)
  
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
  imageUrl?: string;            // URL da imagem ou base64
  imagePosition?: { x: number; y: number }; // Posição da imagem (object-position %)
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

// ========================================
// ATAQUES E HABILIDADES
// ========================================

/**
 * Tipos de dano disponíveis
 */
export type DamageType = 
  | 'cortante'
  | 'perfurante'
  | 'contundente'
  | 'fogo'
  | 'gelo'
  | 'eletrico'
  | 'acido'
  | 'veneno'
  | 'necrotico'
  | 'radiante'
  | 'psiquico'
  | 'trovao'
  | 'energia';

/**
 * Tipos de alcance de ataque
 */
export type AttackRangeType = 
  | 'adjacente'
  | 'natural'
  | 'curto'
  | 'medio'
  | 'longo'
  | 'variavel';

/**
 * Alcance de ataque
 */
export interface AttackRange {
  type: AttackRangeType;
  additionalMeters?: number; // Metros adicionais (ex: natural + 3m)
}

/**
 * Ataque de criatura
 */
export interface CreatureAttack {
  id: string;
  name: string;
  damage: string;              // Formato: "2d6" ou "3d8+4"
  damageType: DamageType;
  criticalRange: number;       // Taxa de crítico (ex: 19-20 = 19, apenas 20 = 20)
  criticalMultiplier: number;  // Multiplicador de crítico (ex: 2x, 3x)
  range: AttackRange;          // Alcance do ataque
  effect?: string;             // Descrição do efeito (futuramente ligado a poderes)
}

/**
 * Habilidade de criatura (baseada em poderes)
 */
export interface CreatureAbility {
  id: string;
  name: string;                // Nome do poder
  poder: unknown;              // Poder completo do criador (tipo Poder from criador-de-poder/types)
  effortCost: 0 | 1 | 2 | 3;   // Unidades de esforço (0-3)
  // realPeCost calculado dinamicamente: effortCost × creature.stats.effortUnit
}
