import { useLocalStorage } from './useLocalStorage';
import type { Efeito, Modificacao } from '../../features/criador-de-poder/types';

export interface Peculiaridade {
  id: string;
  nome: string;
  espiritual: boolean;
  fundamento: {
    oQueE: string;
    comoFunciona: string;
    regrasInternas: string;
    requerimentos: string;
  };
  descricaoCurta?: string;
  dataCriacao: string;
  dataModificacao: string;
}

interface CustomItemsState {
  efeitos: Efeito[];
  modificacoes: Modificacao[];
  peculiaridades: Peculiaridade[];
}

const INITIAL_STATE: CustomItemsState = {
  efeitos: [],
  modificacoes: [],
  peculiaridades: [],
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

  // Peculiaridades
  const addPeculiaridade = (peculiaridade: Omit<Peculiaridade, 'dataCriacao' | 'dataModificacao'>) => {
    const agora = new Date().toISOString();
    const novaPeculiaridade: Peculiaridade = {
      ...peculiaridade,
      dataCriacao: agora,
      dataModificacao: agora,
    };
    setCustomItems({
      ...customItems,
      peculiaridades: [...customItems.peculiaridades, novaPeculiaridade],
    });
  };

  const updatePeculiaridade = (id: string, peculiaridade: Omit<Peculiaridade, 'dataCriacao' | 'dataModificacao'>) => {
    setCustomItems({
      ...customItems,
      peculiaridades: customItems.peculiaridades.map((p) =>
        p.id === id ? { ...peculiaridade, dataCriacao: p.dataCriacao, dataModificacao: new Date().toISOString() } : p
      ),
    });
  };

  const deletePeculiaridade = (id: string) => {
    setCustomItems({
      ...customItems,
      peculiaridades: customItems.peculiaridades.filter((p) => p.id !== id),
    });
  };

  const getPeculiaridade = (id: string): Peculiaridade | undefined => {
    return customItems.peculiaridades.find((p) => p.id === id);
  };

  return {
    customEfeitos: customItems.efeitos,
    customModificacoes: customItems.modificacoes,
    peculiaridades: customItems.peculiaridades,
    addCustomEfeito,
    updateCustomEfeito,
    deleteCustomEfeito,
    addCustomModificacao,
    updateCustomModificacao,
    deleteCustomModificacao,
    addPeculiaridade,
    updatePeculiaridade,
    deletePeculiaridade,
    getPeculiaridade,
  };
}
