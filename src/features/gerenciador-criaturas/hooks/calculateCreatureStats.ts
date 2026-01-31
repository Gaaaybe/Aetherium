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
  role: CreatureRole,
  sovereigntyInput?: number
): BossMechanics | undefined {
  const template = getRoleTemplate(role);
  
  if (!template.isBoss) {
    return undefined;
  }
  
  // Soberania vem do input manual (máximo é sempre 5)
  // O valor atual inicia igual ao máximo definido pelo usuário
  const sovereigntyMax = sovereigntyInput ?? 5;
  return {
    sovereignty: sovereigntyMax, // Inicia no máximo
    sovereigntyMax: sovereigntyMax,
  };
}

/**
 * Helper: Calcular bônus de ataque baseado no template
 */
function calculateAttackBonus(masterRow: MasterRow, template: RoleTemplate): number {
  // Usar direto o atkBonus da tabela mestra
  // A tabela já tem o valor correto calculado
  let attackBonus = masterRow.atkBonus;
  
  // Aplicar multiplicador (Chefe Solo)
  if (template.attackMultiplier) {
    attackBonus = Math.round(attackBonus * template.attackMultiplier);
  }
  
  // Adicionar bônus extra do template
  if (template.attackBonus) {
    attackBonus += template.attackBonus;
  }
  
  return attackBonus;
}
