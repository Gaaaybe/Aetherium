import { useLocalStorage } from './useLocalStorage';
import type { Efeito, Modificacao } from '../../features/criador-de-poder/types';

interface CustomItemsState {
  efeitos: Efeito[];
  modificacoes: Modificacao[];
}

const INITIAL_STATE: CustomItemsState = {
  efeitos: [],
  modificacoes: [],
};

export function useCustomItems() {
  const [customItems, setCustomItems] = useLocalStorage<CustomItemsState>(
    'customItems',
    INITIAL_STATE
  );

  // Efeitos customizados
  const addCustomEfeito = (efeito: Omit<Efeito, 'custom'>) => {
    const novoEfeito: Efeito = { ...efeito, custom: true };
    setCustomItems({
      ...customItems,
      efeitos: [...customItems.efeitos, novoEfeito],
    });
  };

  const updateCustomEfeito = (id: string, efeito: Omit<Efeito, 'custom'>) => {
    setCustomItems({
      ...customItems,
      efeitos: customItems.efeitos.map((e) =>
        e.id === id ? { ...efeito, custom: true } : e
      ),
    });
  };

  const deleteCustomEfeito = (id: string) => {
    setCustomItems({
      ...customItems,
      efeitos: customItems.efeitos.filter((e) => e.id !== id),
    });
  };

  // Modificações customizadas
  const addCustomModificacao = (modificacao: Omit<Modificacao, 'custom'>) => {
    const novaModificacao: Modificacao = { ...modificacao, custom: true };
    setCustomItems({
      ...customItems,
      modificacoes: [...customItems.modificacoes, novaModificacao],
    });
  };

  const updateCustomModificacao = (id: string, modificacao: Omit<Modificacao, 'custom'>) => {
    setCustomItems({
      ...customItems,
      modificacoes: customItems.modificacoes.map((m) =>
        m.id === id ? { ...modificacao, custom: true } : m
      ),
    });
  };

  const deleteCustomModificacao = (id: string) => {
    setCustomItems({
      ...customItems,
      modificacoes: customItems.modificacoes.filter((m) => m.id !== id),
    });
  };

  return {
    customEfeitos: customItems.efeitos,
    customModificacoes: customItems.modificacoes,
    addCustomEfeito,
    updateCustomEfeito,
    deleteCustomEfeito,
    addCustomModificacao,
    updateCustomModificacao,
    deleteCustomModificacao,
  };
}
