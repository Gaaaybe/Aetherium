import { useMemo, useEffect } from 'react';
import { useCatalog } from '@/context/useCatalog';
import { usePowerCreatorStore } from '@/stores/power-creator.store';
import { 
  Poder, 
  calcularDetalhesPoder,
} from '../regras/calculadoraCusto';

export function usePoderCalculator() {
  const { efeitos: todosEfeitos, modificacoes: todasModificacoes } = useCatalog();
  
  const {
    poder,
    adicionarEfeito,
    removerEfeito,
    atualizarGrauEfeito,
    atualizarParametroPoder,
    atualizarInputCustomizado,
    atualizarConfiguracaoEfeito,
    adicionarModificacaoLocal,
    removerModificacaoLocal,
    adicionarModificacaoGlobal,
    removerModificacaoGlobal,
    atualizarInfoPoder,
    atualizarCustoAlternativo,
    resetarPoder,
    carregarPoder,
    atualizarIdPoder,
    habilitarAutoAtualizacaoParametros,
  } = usePowerCreatorStore();

  // Carrega poder pendente vindo da biblioteca
  useEffect(() => {
    const pendente = localStorage.getItem('criador-de-poder-carregar');
    if (pendente) {
      try {
        const parsed = JSON.parse(pendente) as Poder;
        if (parsed.id && Array.isArray(parsed.efeitos)) {
          carregarPoder(parsed);
        }
      } catch (error) {
        console.error('Erro ao carregar poder pendente:', error);
      } finally {
        localStorage.removeItem('criador-de-poder-carregar');
      }
    }
  }, [carregarPoder]);

  // Calcula detalhes do poder (memoizado para performance)
  const detalhes = useMemo(() => {
    return calcularDetalhesPoder(poder, todosEfeitos, todasModificacoes);
  }, [poder, todosEfeitos, todasModificacoes]);

  return {
    poder,
    detalhes,
    // Ações mapeadas para passar todosEfeitos onde necessário
    adicionarEfeito: (efeitoBaseId: string, grau?: number) => 
      adicionarEfeito(efeitoBaseId, todosEfeitos, grau),
    removerEfeito: (efeitoId: string) => 
      removerEfeito(efeitoId, todosEfeitos),
    atualizarGrauEfeito,
    atualizarParametroPoder,
    atualizarInputCustomizado,
    atualizarConfiguracaoEfeito,
    adicionarModificacaoLocal,
    removerModificacaoLocal,
    adicionarModificacaoGlobal,
    removerModificacaoGlobal,
    // Adaptação para atualizarInfoPoder que aceita múltiplos parâmetros ou objeto
    atualizarInfoPoder: (
      nome?: string, 
      descricao?: string, 
      dominioId?: string, 
      dominioAreaConhecimento?: string,
      dominioIdPeculiar?: string,
      icone?: string
    ) => atualizarInfoPoder({
      nome,
      descricao,
      dominioId,
      dominioAreaConhecimento,
      dominioIdPeculiar,
      icone,
    }),
    atualizarCustoAlternativo,
    resetarPoder,
    carregarPoder,
    atualizarIdPoder,
    habilitarAutoAtualizacaoParametros,
  };
}
