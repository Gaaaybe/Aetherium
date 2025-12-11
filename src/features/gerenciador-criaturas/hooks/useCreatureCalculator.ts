import { useMemo } from 'react';
import type { 
  CreatureRole, 
  CreatureFormInput, 
  CalculatedStats,
  BossMechanics,
  MasterRow,
  RoleTemplate,
} from '../types';
import { getRoleTemplate } from '../data/roleTemplates';
import { useMasterTable } from './useMasterTable';

/**
 * Hook: useCreatureCalculator
 * 
 * Calcula todos os stats de uma criatura baseado em:
 * - Nível (1-250)
 * - Função/Role
 * - Overrides manuais
 * 
 * Aplica os multiplicadores do template sobre os valores da Tabela Mestra.
 * 
 * @param input - Dados do formulário de criatura
 * @returns Stats calculados completos
 */
export function useCreatureCalculator(input: CreatureFormInput): CalculatedStats | null {
  const { getRowByLevel } = useMasterTable();
  
  return useMemo(() => {
    // Validar nível
    const masterRow = getRowByLevel(input.level);
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
    const damage = damageCalculated; // Dano sempre calculado
    const speed = input.speedOverride ?? 9; // 9m padrão
    
    // Montar stats finais
    const stats: CalculatedStats = {
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
      damage,
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
      
      // Metadados de cálculo
      baseValues: {
        hpBase: hpBase,
        peBase: peBase,
        damageBase: damageBase,
      },
      appliedMultipliers: {
        pvMultiplier,
        peMultiplier: template.peMultiplier,
        damageMultiplier: template.damageMultiplier,
      },
    };
    
    return stats;
  }, [input, getRowByLevel]);
}

/**
 * Hook: useCreatureBossMechanics
 * 
 * Retorna se a criatura é um chefe (Elite ou ChefeSolo)
 * Soberania deve ser gerenciada manualmente como input
 * 
 * @param role - Função da criatura
 * @returns Se é chefe ou não
 */
export function useCreatureBossMechanics(
  role: CreatureRole
): BossMechanics | undefined {
  return useMemo(() => {
    const template = getRoleTemplate(role);
    
    if (!template.isBoss) {
      return undefined;
    }
    
    // Retornar apenas se é chefe - valores de soberania devem ser inputs manuais
    return {
      sovereignty: 0, // Placeholder - deve ser input manual
      sovereigntyMax: 0, // Placeholder - deve ser input manual
    };
  }, [role]);
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

/**
 * Hook: useCreatureValidation
 * 
 * Valida os dados de input da criatura
 * 
 * @param input - Dados do formulário
 * @returns Erros de validação ou null
 */
export function useCreatureValidation(input: Partial<CreatureFormInput>): string[] {
  return useMemo(() => {
    const errors: string[] = [];
    
    // Nome
    if (!input.name || input.name.trim().length === 0) {
      errors.push('Nome é obrigatório');
    }
    
    if (input.name && input.name.length > 50) {
      errors.push('Nome deve ter no máximo 50 caracteres');
    }
    
    // Nível
    if (!input.level) {
      errors.push('Nível é obrigatório');
    } else if (input.level < 1 || input.level > 250) {
      errors.push('Nível deve estar entre 1 e 250');
    }
    
    // Role
    if (!input.role) {
      errors.push('Função é obrigatória');
    }
    
    // Chefe Solo: Multiplicador de Soberania
    if (input.role === 'ChefeSolo') {
      if (!input.sovereigntyMultiplier) {
        errors.push('Chefe Solo requer multiplicador de PV (10-15)');
      } else if (input.sovereigntyMultiplier < 10 || input.sovereigntyMultiplier > 15) {
        errors.push('Multiplicador de PV deve estar entre 10 e 15');
      }
    }
    
    return errors;
  }, [input]);
}
