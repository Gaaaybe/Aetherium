import { useMemo } from 'react';
import type { MasterRow } from '../types';
import masterTableData from '../data/tabelaMestra.json';

/**
 * Hook: useMasterTable
 * 
 * Carrega e fornece acesso à Tabela Mestra (250 níveis).
 * Converte o JSON em MasterRow tipado.
 * 
 * @returns {Object} Funções e dados da tabela mestra
 */
export function useMasterTable() {
  // Converter JSON para MasterRow tipado
  const masterTable = useMemo<MasterRow[]>(() => {
    return masterTableData.map(row => ({
      level: row.level,
      tier: row.tier,
      scaleName: row.scaleName,
      
      // PV
      pvString: row.pvString,
      pvMin: row.pvMin,
      pvBase: row.pvBase,
      pvMax: row.pvMax,
      
      // Modificadores
      modMajor: row.modMajor,
      modMedium: row.modMedium,
      modMinor: row.modMinor,
      
      // Recursos
      effortUnit: row.effortUnit,
      peBase: row.peBase,
      efficiency: parseEfficiency(row.efficiency),
      
      // Combate
      cdEffect: row.cdEffect,
      atkBonus: row.atkBonus,
      keySkill: row.keySkill,
      dmgBase: row.dmgBase,
      
      // Resistências
      resString: row.resString,
      resMinor: row.resMinor,
      resMedium: row.resMedium,
      resMajor: row.resMajor,
    }));
  }, []);

  /**
   * Buscar dados de um nível específico
   */
  const getRowByLevel = (level: number): MasterRow | undefined => {
    return masterTable.find(row => row.level === level);
  };

  /**
   * Buscar dados de um range de níveis
   */
  const getRowsByLevelRange = (minLevel: number, maxLevel: number): MasterRow[] => {
    return masterTable.filter(row => row.level >= minLevel && row.level <= maxLevel);
  };

  /**
   * Obter todos os nomes de escalas únicos (Raposa, Lobo, Tigre, etc.)
   */
  const getScaleNames = useMemo(() => {
    return Array.from(new Set(
      masterTable
        .filter(row => row.scaleName)
        .map(row => row.scaleName!)
    ));
  }, [masterTable]);

  /**
   * Obter o range de níveis para uma escala específica
   */
  const getLevelRangeForScale = (scaleName: string): [number, number] | null => {
    const rows = masterTable.filter(row => row.scaleName === scaleName);
    if (rows.length === 0) return null;
    
    const levels = rows.map(r => r.level);
    return [Math.min(...levels), Math.max(...levels)];
  };

  /**
   * Validar se um nível existe na tabela
   */
  const isValidLevel = (level: number): boolean => {
    return level >= 1 && level <= 250 && !!getRowByLevel(level);
  };

  /**
   * Obter informações de grau (tier) para um nível
   */
  const getTierInfo = (level: number): string | undefined => {
    const row = getRowByLevel(level);
    return row?.tier;
  };

  return {
    // Dados
    masterTable,
    
    // Queries
    getRowByLevel,
    getRowsByLevelRange,
    getScaleNames,
    getLevelRangeForScale,
    getTierInfo,
    
    // Validação
    isValidLevel,
    
    // Metadados
    minLevel: 1,
    maxLevel: 250,
    totalLevels: masterTable.length,
  };
}

/**
 * Helper: Parsear eficiência (aceita number ou string)
 */
function parseEfficiency(efficiency: string | number): number {
  if (typeof efficiency === 'number') return efficiency;
  if (!efficiency) return 0;
  const cleaned = String(efficiency).replace(/\s/g, '');
  return parseInt(cleaned) || 0;
}
