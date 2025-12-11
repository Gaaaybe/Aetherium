import { createContext, useContext } from 'react';

/**
 * Context para ações da UI (editar, salvar, etc)
 * Usado para comunicar ações do CreatureNode para a página
 */
export const UIActionsContext = createContext<{
  onEditCreature: (id: string) => void;
  onSaveCreature?: (id: string) => void;
} | null>(null);

export const useUIActions = () => {
  const context = useContext(UIActionsContext);
  if (!context) {
    throw new Error('useUIActions must be used within UIActionsContext.Provider');
  }
  return context;
};
