/**
 * Hook para gerenciar Poderes do Personagem
 * Integração entre Ficha de Personagem e Sistema de Poderes
 */

import { useCallback } from 'react';
import type { Poder } from '../../criador-de-poder/types';
import type { PersonagemPoder } from '../types';
import { calcularDetalhesPoder } from '../../criador-de-poder/regras/calculadoraCusto';
import { EFEITOS, MODIFICACOES } from '../../../data';

// ========================================
// TIPOS
// ========================================

interface UsePersonagemPoderesProps {
  poderes: PersonagemPoder[];
  onPoderChange: (poderes: PersonagemPoder[]) => void;
}

interface UsePersonagemPoderesReturn {
  // Adicionar poder ao personagem
  vincularPoder: (poder: Poder) => PersonagemPoder | null;
  
  // Remover poder
  desvincularPoder: (poderId: string) => void;
  
  // Ativar/Desativar poder
  togglePoderAtivo: (poderId: string) => void;
  
  // Atualizar poder (recalcula custos)
  atualizarPoder: (poderId: string, novosPoder: Poder) => void;
  
  // Calcular custos totais
  calcularCustosTotal: () => { pdaTotal: number; espacosTotal: number };
}

// ========================================
// HOOK PRINCIPAL
// ========================================

export function usePersonagemPoderes({
  poderes,
  onPoderChange,
}: UsePersonagemPoderesProps): UsePersonagemPoderesReturn {
  
  /**
   * Calcula custos do poder
   */
  const calcularCustos = useCallback((poder: Poder) => {
    const detalhes = calcularDetalhesPoder(poder, EFEITOS, MODIFICACOES);
    
    return {
      pdaCost: detalhes.custoPdATotal,
      espacosOccupied: detalhes.espacosTotal,
    };
  }, []);
  
  /**
   * Vincula um poder ao personagem
   */
  const vincularPoder = useCallback((poder: Poder): PersonagemPoder | null => {
    // Calcular custos
    const { pdaCost, espacosOccupied } = calcularCustos(poder);
    
    const agora = new Date().toISOString();
    
    const personagemPoder: PersonagemPoder = {
      id: `pp-${Date.now()}`,
      poderId: poder.id,
      poder: poder,
      ativo: true,
      pdaCost,
      espacosOccupied,
      dataCriacao: agora,
      dataModificacao: agora,
    };
    
    onPoderChange([...poderes, personagemPoder]);
    return personagemPoder;
  }, [poderes, calcularCustos, onPoderChange]);
  
  /**
   * Desvincula um poder do personagem
   */
  const desvincularPoder = useCallback((poderId: string) => {
    onPoderChange(poderes.filter(p => p.id !== poderId));
  }, [poderes, onPoderChange]);
  
  /**
   * Ativa/Desativa um poder
   */
  const togglePoderAtivo = useCallback((poderId: string) => {
    onPoderChange(
      poderes.map(p => 
        p.id === poderId 
          ? { ...p, ativo: !p.ativo, dataModificacao: new Date().toISOString() }
          : p
      )
    );
  }, [poderes, onPoderChange]);
  
  /**
   * Atualiza um poder existente (recalcula custos)
   */
  const atualizarPoder = useCallback((poderId: string, novosPoder: Poder) => {
    const { pdaCost, espacosOccupied } = calcularCustos(novosPoder);
    
    onPoderChange(
      poderes.map(p => 
        p.id === poderId
          ? {
              ...p,
              poder: novosPoder,
              pdaCost,
              espacosOccupied,
              dataModificacao: new Date().toISOString(),
            }
          : p
      )
    );
  }, [poderes, calcularCustos, onPoderChange]);
  
  /**
   * Calcula custos totais de PdA e Espaços
   */
  const calcularCustosTotal = useCallback(() => {
    return poderes.reduce(
      (acc, poder) => ({
        pdaTotal: acc.pdaTotal + poder.pdaCost,
        espacosTotal: acc.espacosTotal + poder.espacosOccupied,
      }),
      { pdaTotal: 0, espacosTotal: 0 }
    );
  }, [poderes]);
  
  return {
    vincularPoder,
    desvincularPoder,
    togglePoderAtivo,
    atualizarPoder,
    calcularCustosTotal,
  };
}
