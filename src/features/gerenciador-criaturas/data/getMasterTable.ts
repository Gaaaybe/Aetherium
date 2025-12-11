import tabelaMestra from './tabelaMestra.json';
import type { MasterRow } from '../types';

/**
 * Obter tabela mestra completa
 * Função pura que pode ser chamada em qualquer lugar
 */
export function getMasterTable(): MasterRow[] {
  return tabelaMestra as MasterRow[];
}
