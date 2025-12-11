/**
 * Constantes do Sistema - V2
 * Spirit & Caos RPG System
 */

// Atributos Base do Sistema
export const ATTRIBUTES = [
  'Força',
  'Destreza', 
  'Constituição',
  'Inteligência',
  'Sabedoria',
  'Carisma'
] as const;

export type Attribute = typeof ATTRIBUTES[number];

// Resistências Base do Sistema
export const SAVES = [
  'Fortitude',
  'Reflexos',
  'Vontade'
] as const;

export type Save = typeof SAVES[number];

// Perícias do Sistema
export const SKILLS = [
  'Acrobacia',
  'Adestrar Animais',
  'Atletismo',
  'Atuação',
  'Cavalgar',
  'Conhecimento',
  'Cura',
  'Diplomacia',
  'Enganação',
  'Furtividade',
  'Espiritismo',
  'Religião',
  'Exploração',
  'Intuição',
  'Ladinagem',
  'Percepção',
  'Sobrevivência',
  'Investigação',
  'Intimidação',
  'Iniciativa'
] as const;

export type Skill = typeof SKILLS[number];

// Distribuição de Atributos e Resistências por Função
// [Qtd Maior, Qtd Médio, Qtd Menor] - Soma deve ser 6 para Atributos
// [Qtd Forte, Qtd Média, Qtd Fraca] - Soma deve ser 3 para Resistências
export const ROLE_DISTRIBUTION = {
  Lacaio: {
    attrs: [0, 2, 4],    // Lacaios não têm atributos "Maiores". Usam Médio para atacar.
    saves: [0, 1, 2],    // 1 Média, 2 Fracas.
    description: 'Lacaios não possuem Atributos Maiores'
  },
  Padrao: {
    attrs: [1, 2, 3],    // O clássico equilibrado.
    saves: [1, 1, 1],    // 1 Forte, 1 Média, 1 Fraca.
    description: 'Distribuição balanceada'
  },
  Bruto: {
    attrs: [2, 2, 2],    // Focado em físico (ex: For+Con Maior).
    saves: [2, 0, 1],    // Duas resistências fortes, uma fraca (sem média).
    description: 'Focado em atributos físicos'
  },
  Elite: {
    attrs: [2, 3, 1],    // Superior. Quase tudo é bom.
    saves: [2, 1, 0],    // Difícil de derrubar.
    description: 'Superior em múltiplos aspectos'
  },
  ChefeSolo: {
    attrs: [3, 2, 1],    // Uma força da natureza. 3 Atributos no máximo.
    saves: [3, 0, 0],    // Bosses usam a coluna "Maior" para todas as resistências.
    description: 'Força da natureza - 3 atributos no máximo'
  }
} as const;

export type RoleDistribution = typeof ROLE_DISTRIBUTION[keyof typeof ROLE_DISTRIBUTION];

/**
 * Helper: Obter distribuição de uma função
 */
export function getRoleDistribution(role: string): RoleDistribution {
  return ROLE_DISTRIBUTION[role as keyof typeof ROLE_DISTRIBUTION] || ROLE_DISTRIBUTION.Padrao;
}

/**
 * Helper: Validar se a distribuição de atributos está completa
 */
export function validateAttributeDistribution(
  major: string[],
  medium: string[],
  role: string
): { isValid: boolean; error?: string } {
  const dist = getRoleDistribution(role);
  const [majorCount, mediumCount] = dist.attrs;
  
  // Verificar duplicatas
  const all = [...major, ...medium];
  const unique = new Set(all);
  if (unique.size !== all.length) {
    return { isValid: false, error: 'Atributos duplicados' };
  }
  
  // Verificar quantidade
  if (major.length !== majorCount) {
    return { 
      isValid: false, 
      error: `Selecione ${majorCount} atributo(s) maior(es)` 
    };
  }
  
  if (medium.length !== mediumCount) {
    return { 
      isValid: false, 
      error: `Selecione ${mediumCount} atributo(s) médio(s)` 
    };
  }
  
  return { isValid: true };
}

/**
 * Helper: Validar se a distribuição de resistências está completa
 */
export function validateSaveDistribution(
  strong: string[],
  medium: string[],
  role: string
): { isValid: boolean; error?: string } {
  const dist = getRoleDistribution(role);
  const [strongCount, mediumCount] = dist.saves;
  
  // Verificar duplicatas
  const all = [...strong, ...medium];
  const unique = new Set(all);
  if (unique.size !== all.length) {
    return { isValid: false, error: 'Resistências duplicadas' };
  }
  
  // Verificar quantidade
  if (strong.length !== strongCount) {
    return { 
      isValid: false, 
      error: `Selecione ${strongCount} resistência(s) forte(s)` 
    };
  }
  
  if (medium.length !== mediumCount) {
    return { 
      isValid: false, 
      error: `Selecione ${mediumCount} resistência(s) média(s)` 
    };
  }
  
  return { isValid: true };
}
