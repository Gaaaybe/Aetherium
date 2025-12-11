import type { 
  CreatureFormInput, 
  CreatureStats,
  BossMechanics,
  MasterRow,
  RoleTemplate,
  CreatureRole,
} from '../types';
import { getRoleTemplate } from '../data/roleTemplates';
import { getMasterTable } from '../data/getMasterTable.js';

/**
 * Função pura: Calcular stats de criatura
 * 
 * Não é um hook, pode ser chamada em qualquer lugar
 */
export function calculateCreatureStats(input: CreatureFormInput): CreatureStats | null {
  // Obter tabela mestra
  const masterTable = getMasterTable();
  const masterRow = masterTable.find((row: MasterRow) => row.level === input.level);
  
  if (!masterRow) {
    console.error(`Nível ${input.level} não encontrado na tabela mestra`);
    return null;
  }
  
  // Obter template da função
  const template = getRoleTemplate(input.role);
  
  // Calcular PV Multiplicador (Chefe Solo pode variar)
  let pvMultiplier = template.pvMultiplier;
  if (input.role === 'ChefeSolo' && input.sovereigntyMultiplier) {
    pvMultiplier = input.sovereigntyMultiplier;
  }
  
  // Calcular HP
  const hpBase = masterRow.pvBase;
  const hpCalculated = Math.round(hpBase * pvMultiplier);
  
  // Calcular PE
  const peBase = masterRow.peBase;
  const peCalculated = Math.round(peBase * template.peMultiplier);
  
  // Calcular Dano
  const damageBase = masterRow.dmgBase;
  const damageCalculated = Math.round(damageBase * template.damageMultiplier);
  
  // Calcular Bônus de Ataque
  const attackBonus = calculateAttackBonus(masterRow, template);
  
  // Aplicar overrides manuais
  const rd = input.rdOverride ?? 0;
  const speed = input.speedOverride ?? 9; // 9m padrão
  
  // Montar stats finais
  const stats: CreatureStats = {
    // Vitalidade e Recursos
    hp: hpCalculated,
    maxHp: hpCalculated,
    pe: peCalculated,
    maxPe: peCalculated,
    effortUnit: masterRow.effortUnit,
    
    // Defesas
    rd,
    speed,
    
    // Combate
    attackBonus,
    damage: damageCalculated,
    cdEffect: masterRow.cdEffect,
    
    // Perícias e Resistências
    keySkill: masterRow.keySkill,
    resistances: {
      minor: masterRow.resMinor,
      medium: masterRow.resMedium,
      major: masterRow.resMajor,
    },
    
    // Extras
    efficiency: masterRow.efficiency,
  };
  
  return stats;
}

/**
 * Função pura: Calcular mecânicas de chefe
 */
export function calculateBossMechanics(
  role: CreatureRole
): BossMechanics | undefined {
  const template = getRoleTemplate(role);
  
  if (!template.isBoss) {
    return undefined;
  }
  
  // Soberania deve vir do input manual (não calculada)
  // Retornar apenas indicador de que é chefe
  return {
    sovereignty: 1, // Padrão
    sovereigntyMax: 1, // Padrão
  };
}

/**
 * Helper: Calcular bônus de ataque baseado no template
 */
function calculateAttackBonus(masterRow: MasterRow, template: RoleTemplate): number {
  // Pegar o modificador correto
  let baseBonus = 0;
  switch (template.attackModifier) {
    case 'major':
      baseBonus = masterRow.modMajor;
      break;
    case 'medium':
      baseBonus = masterRow.modMedium;
      break;
    case 'minor':
      baseBonus = masterRow.modMinor;
      break;
  }
  
  // Aplicar multiplicador (Chefe Solo)
  if (template.attackMultiplier) {
    baseBonus = Math.round(baseBonus * template.attackMultiplier);
  }
  
  // Adicionar bônus extra
  if (template.attackBonus) {
    baseBonus += template.attackBonus;
  }
  
  // Somar com o bônus de ataque da tabela
  return baseBonus + masterRow.atkBonus;
}
