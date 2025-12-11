/**
 * Index - Gerenciador de Criaturas
 * Exporta todos os componentes, hooks e tipos
 */

// Types
export * from './types';

// Hooks
export { useMasterTable } from './hooks/useMasterTable';
export { 
  useCreatureCalculator, 
  useCreatureBossMechanics,
  useCreatureValidation 
} from './hooks/useCreatureCalculator';
export { useBibliotecaCriaturas } from './hooks/useBibliotecaCriaturas';

// Data
export { 
  ROLE_TEMPLATES, 
  ROLE_CATEGORIES,
  getRoleTemplate, 
  getAllRoles,
  getRoleColor,
} from './data/roleTemplates';
