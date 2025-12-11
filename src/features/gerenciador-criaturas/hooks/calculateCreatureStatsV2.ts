import type { 
  CreatureFormInput, 
  CreatureStatsV2,
  MasterRow,
} from '../types';
import type { Attribute, Save, Skill } from '../data/constants';
import { ATTRIBUTES, SAVES } from '../data/constants';
import { getRoleTemplate } from '../data/roleTemplates';
import { getMasterTable } from '../data/getMasterTable.js';

/**
 * V2: Função pura para calcular stats com distribuições dinâmicas
 */
export function calculateCreatureStatsV2(input: CreatureFormInput): CreatureStatsV2 | null {
  const masterTable = getMasterTable();
  const masterRow = masterTable.find((row: MasterRow) => row.level === input.level);
  
  if (!masterRow) {
    console.error(`Nível ${input.level} não encontrado na tabela mestra`);
    return null;
  }
  
  const template = getRoleTemplate(input.role);
  
  // ==== CALCULAR ATRIBUTOS ====
  const attributes: Record<Attribute, number> = {} as Record<Attribute, number>;
  
  if (input.attributeDistribution) {
    const { major, medium, minor } = input.attributeDistribution;
    
    // Aplicar Mod Maior aos atributos selecionados
    major.forEach(attr => {
      attributes[attr] = masterRow.modMajor;
    });
    
    // Aplicar Mod Médio
    medium.forEach(attr => {
      attributes[attr] = masterRow.modMedium;
    });
    
    // Aplicar Mod Menor ao resto
    minor.forEach(attr => {
      attributes[attr] = masterRow.modMinor;
    });
  } else {
    // Fallback: todos recebem médio
    ATTRIBUTES.forEach(attr => {
      attributes[attr] = masterRow.modMedium;
    });
  }
  
  // ==== CALCULAR RESISTÊNCIAS ====
  const saves: Record<Save, number> = {} as Record<Save, number>;
  
  if (input.saveDistribution) {
    const { strong, medium, weak } = input.saveDistribution;
    
    // Aplicar valor Maior
    strong.forEach(save => {
      saves[save] = masterRow.resMajor;
    });
    
    // Aplicar valor Médio
    medium.forEach(save => {
      saves[save] = masterRow.resMedium;
    });
    
    // Aplicar valor Menor
    weak.forEach(save => {
      saves[save] = masterRow.resMinor;
    });
  } else {
    // Fallback: distribuição padrão
    saves.Fortitude = masterRow.resMajor;
    saves.Reflexos = masterRow.resMedium;
    saves.Vontade = masterRow.resMinor;
  }
  
  // ==== CALCULAR PERÍCIAS ====
  const skills: Record<string, number> = {};
  
  if (input.selectedSkills && input.selectedSkills.length > 0) {
    input.selectedSkills.forEach((skill: Skill) => {
      skills[skill] = masterRow.keySkill;
    });
  }
  
  // ==== CALCULAR COMBATE ====
  
  // HP
  let pvMultiplier = template.pvMultiplier;
  if (input.role === 'ChefeSolo' && input.sovereigntyMultiplier) {
    pvMultiplier = input.sovereigntyMultiplier;
  }
  const hpCalculated = Math.round(masterRow.pvBase * pvMultiplier);
  
  // PE
  const peCalculated = Math.round(masterRow.peBase * template.peMultiplier);
  
  // Dano - usar dmgBase e aplicar multiplicador
  const damageCalculated = Math.round(masterRow.dmgBase * template.damageMultiplier);
  
  // Bônus de Ataque - pegar o maior atributo escolhido e somar com bônus de eficiência
  let attackAttrMod = 0;
  if (input.attributeDistribution) {
    if (input.attributeDistribution.major.length > 0) {
      // Usar o modificador do primeiro atributo maior
      attackAttrMod = attributes[input.attributeDistribution.major[0]];
    } else if (input.attributeDistribution.medium.length > 0) {
      // Lacaio usa médio
      attackAttrMod = attributes[input.attributeDistribution.medium[0]];
    }
  }
  // Ataque = maior atributo + bônus de eficiência
  const attackBonus = attackAttrMod + masterRow.efficiency;
  
  // Defesa - geralmente baseada em Destreza/Reflexos
  let defense = masterRow.modMedium; // Fallback
  if (attributes.Destreza !== undefined) {
    defense = attributes.Destreza;
  }
  
  // Overrides
  const rd = input.rdOverride ?? 0;
  const speed = input.speedOverride ?? 9;
  
  return {
    attributes,
    saves,
    skills,
    combat: {
      hp: hpCalculated,
      maxHp: hpCalculated,
      pe: peCalculated,
      maxPe: peCalculated,
      effortUnit: masterRow.effortUnit,
      attackBonus,
      defense,
      damage: damageCalculated,
      dcPrimary: masterRow.cdEffect,
      rd,
      speed,
    },
    efficiency: masterRow.efficiency,
  };
}

/**
 * Helper: Calcular atributos menores automaticamente
 */
export function calculateMinorAttributes(
  major: Attribute[],
  medium: Attribute[]
): Attribute[] {
  const selected = new Set([...major, ...medium]);
  return ATTRIBUTES.filter(attr => !selected.has(attr));
}

/**
 * Helper: Calcular resistências fracas automaticamente
 */
export function calculateWeakSaves(
  strong: Save[],
  medium: Save[]
): Save[] {
  const selected = new Set([...strong, ...medium]);
  return SAVES.filter(save => !selected.has(save));
}
