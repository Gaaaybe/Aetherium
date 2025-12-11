import type { RoleTemplate, CreatureRole } from '../types';

/**
 * Templates de Função (Roles) com Multiplicadores
 * 
 * Cada função tem multiplicadores diferentes aplicados sobre os valores base da Tabela Mestra.
 * 
 * Referência:
 * - Lacaio: Criatura fraca, pouco PV, sem PE
 * - Padrão: Criatura normal balanceada
 * - Bruto: Alta vitalidade, dano normal
 * - Elite: Criatura superior em tudo
 * - Chefe Solo: Boss fight, valores massivos
 */

export const ROLE_TEMPLATES: Record<CreatureRole, RoleTemplate> = {
  Lacaio: {
    id: 'Lacaio',
    name: 'Lacaio',
    description: 'Criatura fraca e descartável. Aparecem em grupos. PV muito baixo, sem PE.',
    
    pvMultiplier: 0.1,          // 10% do PV padrão
    peMultiplier: 0,            // Não usa PE
    damageMultiplier: 0.5,      // Metade do dano
    
    attackModifier: 'medium',   // Usa Mod. Médio
    attackBonus: 0,
    
    isBoss: false,
  },
  
  Padrao: {
    id: 'Padrao',
    name: 'Padrão',
    description: 'Criatura comum e balanceada. Valores base sem alterações.',
    
    pvMultiplier: 1.0,          // 100% do PV padrão
    peMultiplier: 1.0,          // 100% do PE base
    damageMultiplier: 1.0,      // Dano base
    
    attackModifier: 'major',    // Usa Mod. Maior
    attackBonus: 0,
    
    isBoss: false,
  },
  
  Bruto: {
    id: 'Bruto',
    name: 'Bruto',
    description: 'Tanque de linha de frente. Muito PV, dano normal, recursos normais.',
    
    pvMultiplier: 2.0,          // 200% do PV padrão
    peMultiplier: 1.0,          // 100% do PE base
    damageMultiplier: 1.0,      // Dano base
    
    attackModifier: 'major',    // Usa Mod. Maior
    attackBonus: 0,
    
    isBoss: false,
  },
  
  Elite: {
    id: 'Elite',
    name: 'Elite',
    description: 'Criatura excepcional. Superior em tudo. Mecânicas de chefe menores.',
    
    pvMultiplier: 2.5,          // 250% do PV padrão
    peMultiplier: 2.0,          // 200% do PE base
    damageMultiplier: 1.5,      // 150% do dano
    
    attackModifier: 'major',    // Usa Mod. Maior
    attackBonus: 0,
    
    isBoss: true,               // Tem mecânicas de chefe
  },
  
  ChefeSolo: {
    id: 'ChefeSolo',
    name: 'Chefe Solo',
    description: 'Boss fight épico. Valores massivos, mecânicas especiais. Enfrenta o grupo sozinho.',
    
    pvMultiplier: 10,           // 1000% do PV padrão (base, pode ir até 15x)
    pvMultiplierRange: [10, 15], // Range de 10x a 15x (escolha do mestre)
    peMultiplier: 5.0,          // 500% do PE base
    damageMultiplier: 2.0,      // 200% do dano
    
    attackModifier: 'major',    // Usa Mod. Maior
    attackBonus: 0,
    attackMultiplier: 1.2,      // Mod. Maior * 1.2
    
    isBoss: true,               // Tem mecânicas de chefe
  },
};

/**
 * Helper: Obter template por role
 */
export function getRoleTemplate(role: CreatureRole): RoleTemplate {
  return ROLE_TEMPLATES[role];
}

/**
 * Helper: Lista de todas as roles disponíveis
 */
export function getAllRoles(): CreatureRole[] {
  return Object.keys(ROLE_TEMPLATES) as CreatureRole[];
}

/**
 * Helper: Roles agrupadas por categoria
 */
export const ROLE_CATEGORIES = {
  basicas: ['Lacaio', 'Padrao'] as CreatureRole[],
  especializadas: ['Bruto'] as CreatureRole[],
  chefes: ['Elite', 'ChefeSolo'] as CreatureRole[],
};

/**
 * Helper: Obter cor sugerida para uma role (para UI)
 */
export function getRoleColor(role: CreatureRole): string {
  const colors: Record<CreatureRole, string> = {
    Lacaio: '#94a3b8',      // gray-400
    Padrao: '#3b82f6',      // blue-500
    Bruto: '#ef4444',       // red-500
    Elite: '#eab308',       // yellow-500
    ChefeSolo: '#dc2626',   // red-600
  };
  
  return colors[role];
}
