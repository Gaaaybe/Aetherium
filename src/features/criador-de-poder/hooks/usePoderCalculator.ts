import { useState, useMemo, useEffect, useRef } from 'react';
import { EFEITOS, MODIFICACOES } from '../../../data';
import { 
  Poder, 
  EfeitoAplicado, 
  ModificacaoAplicada,
  calcularDetalhesPoder 
} from '../regras/calculadoraCusto';

// Chave do localStorage para auto-save
const AUTOSAVE_KEY = 'criador-de-poder-autosave';

// Calcula os piores parâmetros (mais restritivos) entre todos os efeitos
// REGRA: "Pior" = MENOR valor (mais restritivo)
//   - Ação: 0 (Reação) é pior que 5 (Nenhuma)
//   - Alcance: 0 (Pessoal) é pior que 2 (Perceptivo)
//   - Duração: 0 (Instantânea) é pior que 4 (Permanente)
function calcularParametrosPadrao(efeitos: EfeitoAplicado[]): {
  acao: number;
  alcance: number;
  duracao: number;
} {
  if (efeitos.length === 0) {
    return { acao: 0, alcance: 0, duracao: 0 };
  }

  // Para cada parâmetro, encontra o MENOR valor (mais restritivo)
  const acoes = efeitos.map(ef => {
    const efBase = EFEITOS.find(e => e.id === ef.efeitoBaseId);
    return efBase?.parametrosPadrao.acao ?? 0;
  });
  
  const alcances = efeitos.map(ef => {
    const efBase = EFEITOS.find(e => e.id === ef.efeitoBaseId);
    return efBase?.parametrosPadrao.alcance ?? 0;
  });
  
  const duracoes = efeitos.map(ef => {
    const efBase = EFEITOS.find(e => e.id === ef.efeitoBaseId);
    return efBase?.parametrosPadrao.duracao ?? 0;
  });

  // Encontra o MENOR valor (mais restritivo/pior)
  const acaoMin = Math.min(...acoes);
  const alcanceMin = Math.min(...alcances);
  const duracaoMin = Math.min(...duracoes);

  return {
    acao: acaoMin,
    alcance: alcanceMin,
    duracao: duracaoMin,
  };
}

export function usePoderCalculator() {
  // Tenta carregar o poder salvo do localStorage
  const carregarPoderSalvo = (): Poder => {
    try {
      const salvo = localStorage.getItem(AUTOSAVE_KEY);
      if (salvo) {
        const poderSalvo = JSON.parse(salvo) as Poder;
        // Valida que tem a estrutura correta
        if (poderSalvo.id && Array.isArray(poderSalvo.efeitos)) {
          return poderSalvo;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar poder salvo:', error);
    }
    
    // Retorna poder padrão se não houver nada salvo
    return {
      id: Date.now().toString(),
      nome: 'Novo Poder',
      descricao: '',
      efeitos: [],
      modificacoesGlobais: [],
      acao: 0,
      alcance: 0,
      duracao: 0,
    };
  };

  const [poder, setPoder] = useState<Poder>(carregarPoderSalvo);
  // Flag para evitar auto-update de parâmetros ao carregar poder existente
  const isCarregandoPoder = useRef(false);

  // Auto-save: Salva o poder no localStorage sempre que ele mudar
  useEffect(() => {
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(poder));
    } catch (error) {
      console.error('Erro ao salvar poder automaticamente:', error);
    }
  }, [poder]);

  // Calcula detalhes do poder (memoizado para performance)
  const detalhes = useMemo(() => {
    return calcularDetalhesPoder(poder, EFEITOS, MODIFICACOES);
  }, [poder]);

  // Auto-atualiza os parâmetros do poder quando os efeitos mudam
  // REGRA: Parâmetros do poder = pior (menor) parâmetro entre TODOS os efeitos
  // Esses valores podem ser modificados manualmente pelo usuário depois
  useEffect(() => {
    // Não atualiza parâmetros se estamos carregando um poder existente
    if (isCarregandoPoder.current) {
      isCarregandoPoder.current = false;
      return;
    }

    if (poder.efeitos.length === 0) {
      // Sem efeitos, reseta para valores padrão
      setPoder(prev => ({
        ...prev,
        acao: 0,
        alcance: 0,
        duracao: 0,
      }));
      return;
    }

    const parametrosPadrao = calcularParametrosPadrao(poder.efeitos);
    
    // Só atualiza se os valores calculados forem diferentes dos atuais
    if (
      poder.acao !== parametrosPadrao.acao ||
      poder.alcance !== parametrosPadrao.alcance ||
      poder.duracao !== parametrosPadrao.duracao
    ) {
      setPoder(prev => ({
        ...prev,
        acao: parametrosPadrao.acao,
        alcance: parametrosPadrao.alcance,
        duracao: parametrosPadrao.duracao,
      }));
    }
  }, [poder.efeitos]);

  // Adiciona um novo efeito ao poder
  const adicionarEfeito = (efeitoBaseId: string, grau: number = 1) => {
    const efeitoBase = EFEITOS.find(e => e.id === efeitoBaseId);
    if (!efeitoBase) return;

    const novoEfeito: EfeitoAplicado = {
      id: `efeito-${Date.now()}`,
      efeitoBaseId,
      grau,
      modificacoesLocais: [],
    };

    setPoder(prev => ({
      ...prev,
      efeitos: [...prev.efeitos, novoEfeito],
    }));
  };

  // Remove um efeito
  const removerEfeito = (efeitoId: string) => {
    setPoder(prev => ({
      ...prev,
      efeitos: prev.efeitos.filter(e => e.id !== efeitoId),
    }));
  };

  // Atualiza o grau de um efeito
  const atualizarGrauEfeito = (efeitoId: string, novoGrau: number) => {
    setPoder(prev => ({
      ...prev,
      efeitos: prev.efeitos.map(e =>
        e.id === efeitoId ? { ...e, grau: Math.max(1, Math.min(20, novoGrau)) } : e
      ),
    }));
  };

  // Atualiza um parâmetro do poder (aplicado a todos os efeitos)
  const atualizarParametroPoder = (
    parametro: 'acao' | 'alcance' | 'duracao',
    valor: number | undefined
  ) => {
    setPoder(prev => ({
      ...prev,
      [parametro]: valor,
    }));
  };

  // Atualiza o input customizado de um efeito
  const atualizarInputCustomizado = (efeitoId: string, valor: string) => {
    setPoder(prev => ({
      ...prev,
      efeitos: prev.efeitos.map(e =>
        e.id === efeitoId ? { ...e, inputCustomizado: valor } : e
      ),
    }));
  };

  // Atualiza a configuração selecionada de um efeito (ex: Imunidade Patamar 2)
  const atualizarConfiguracaoEfeito = (efeitoId: string, configuracaoId: string) => {
    setPoder(prev => ({
      ...prev,
      efeitos: prev.efeitos.map(e =>
        e.id === efeitoId ? { ...e, configuracaoSelecionada: configuracaoId } : e
      ),
    }));
  };

  // Adiciona modificação local a um efeito
  const adicionarModificacaoLocal = (
    efeitoId: string,
    modificacaoBaseId: string,
    parametros?: Record<string, any>
  ) => {
    const novaModificacao: ModificacaoAplicada = {
      id: `mod-${Date.now()}`,
      modificacaoBaseId,
      escopo: 'local',
      parametros,
      grauModificacao: parametros?.grau ? Number(parametros.grau) : undefined,
    };

    setPoder(prev => ({
      ...prev,
      efeitos: prev.efeitos.map(e =>
        e.id === efeitoId
          ? { ...e, modificacoesLocais: [...e.modificacoesLocais, novaModificacao] }
          : e
      ),
    }));
  };

  // Remove modificação local de um efeito
  const removerModificacaoLocal = (efeitoId: string, modificacaoId: string) => {
    setPoder(prev => ({
      ...prev,
      efeitos: prev.efeitos.map(e =>
        e.id === efeitoId
          ? { ...e, modificacoesLocais: e.modificacoesLocais.filter(m => m.id !== modificacaoId) }
          : e
      ),
    }));
  };

  // Adiciona modificação global ao poder
  const adicionarModificacaoGlobal = (
    modificacaoBaseId: string,
    parametros?: Record<string, any>
  ) => {
    const novaModificacao: ModificacaoAplicada = {
      id: `mod-${Date.now()}`,
      modificacaoBaseId,
      escopo: 'global',
      parametros,
      grauModificacao: parametros?.grau ? Number(parametros.grau) : undefined,
    };

    setPoder(prev => ({
      ...prev,
      modificacoesGlobais: [...prev.modificacoesGlobais, novaModificacao],
    }));
  };

  // Remove modificação global
  const removerModificacaoGlobal = (modificacaoId: string) => {
    setPoder(prev => ({
      ...prev,
      modificacoesGlobais: prev.modificacoesGlobais.filter(m => m.id !== modificacaoId),
    }));
  };

  // Atualiza nome e descrição do poder
  const atualizarInfoPoder = (nome?: string, descricao?: string) => {
    setPoder(prev => ({
      ...prev,
      ...(nome !== undefined && { nome }),
      ...(descricao !== undefined && { descricao }),
    }));
  };

  // Reseta o poder
  const resetarPoder = () => {
    const novoPoder: Poder = {
      id: Date.now().toString(),
      nome: 'Novo Poder',
      descricao: '',
      efeitos: [],
      modificacoesGlobais: [],
      acao: 0,
      alcance: 0,
      duracao: 0,
    };
    setPoder(novoPoder);
    // Limpa o auto-save ao resetar
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
    } catch (error) {
      console.error('Erro ao limpar auto-save:', error);
    }
  };

  // Carrega um poder existente
  const carregarPoder = (poderParaCarregar: Poder) => {
    isCarregandoPoder.current = true;
    setPoder(poderParaCarregar);
  };

  return {
    poder,
    detalhes,
    // Ações
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
    resetarPoder,
    carregarPoder,
  };
}
