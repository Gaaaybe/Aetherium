import { useState, useMemo, useEffect, useRef } from 'react';
import { EFEITOS, MODIFICACOES } from '../../../data';
import { useCustomItems } from '../../../shared/hooks';
import { 
  Poder, 
  EfeitoAplicado, 
  ModificacaoAplicada,
  calcularDetalhesPoder 
} from '../regras/calculadoraCusto';

// Chave do localStorage para auto-save
const AUTOSAVE_KEY = 'criador-de-poder-autosave';
const LOAD_PODER_KEY = 'criador-de-poder-carregar';

export function usePoderCalculator() {
  const { customEfeitos, customModificacoes } = useCustomItems();

  // Combina efeitos e modificações base com customizados
  const todosEfeitos = useMemo(
    () => [...EFEITOS, ...customEfeitos],
    [customEfeitos]
  );
  const todasModificacoes = useMemo(
    () => [...MODIFICACOES, ...customModificacoes],
    [customModificacoes]
  );

  // Flag para evitar auto-update de parâmetros ao carregar poder existente
  const isCarregandoPoder = useRef(false);
  const foiCarregadoDeStorage = useRef(false);
  const primeiroCarregamentoProcessado = useRef(false);

  // Tenta carregar o poder salvo do localStorage
  const carregarPoderSalvo = (): Poder => {
    try {
      // Primeiro, verifica se há um poder pendente para carregar da biblioteca
      const poderPendente = localStorage.getItem(LOAD_PODER_KEY);
      if (poderPendente) {
        localStorage.removeItem(LOAD_PODER_KEY); // Remove após carregar
        const poder = JSON.parse(poderPendente) as Poder;
        if (poder.id && Array.isArray(poder.efeitos)) {
          foiCarregadoDeStorage.current = true; // Marca que foi carregado
          return poder;
        }
      }

      // Se não há poder pendente, tenta carregar o auto-save
      const salvo = localStorage.getItem(AUTOSAVE_KEY);
      if (salvo) {
        const poderSalvo = JSON.parse(salvo) as Poder;
        // Valida que tem a estrutura correta
        if (poderSalvo.id && Array.isArray(poderSalvo.efeitos)) {
          foiCarregadoDeStorage.current = true; // Marca que foi carregado
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

  // Cria uma string de IDs dos efeitos para detectar mudanças reais
  const efeitosIds = poder.efeitos.map(e => e.efeitoBaseId).sort().join(',');

  // Calcula os piores parâmetros (mais restritivos) entre todos os efeitos
  // REGRA: "Pior" = MENOR valor (mais restritivo)
  const calcularParametrosPadrao = (efeitos: EfeitoAplicado[]): {
    acao: number;
    alcance: number;
    duracao: number;
  } => {
    if (efeitos.length === 0) {
      return { acao: 0, alcance: 0, duracao: 0 };
    }

    const acoes = efeitos.map(ef => {
      const efBase = todosEfeitos.find(e => e.id === ef.efeitoBaseId);
      return efBase?.parametrosPadrao.acao ?? 0;
    });
    
    const alcances = efeitos.map(ef => {
      const efBase = todosEfeitos.find(e => e.id === ef.efeitoBaseId);
      return efBase?.parametrosPadrao.alcance ?? 0;
    });
    
    const duracoes = efeitos.map(ef => {
      const efBase = todosEfeitos.find(e => e.id === ef.efeitoBaseId);
      return efBase?.parametrosPadrao.duracao ?? 0;
    });

    const acaoMin = Math.min(...acoes);
    const alcanceMin = Math.min(...alcances);
    const duracaoMin = Math.min(...duracoes);

    return {
      acao: acaoMin,
      alcance: alcanceMin,
      duracao: duracaoMin,
    };
  };

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
    return calcularDetalhesPoder(poder, todosEfeitos, todasModificacoes);
  }, [poder, todosEfeitos, todasModificacoes]);

  // Auto-atualiza os parâmetros do poder quando os efeitos mudam
  // REGRA: Parâmetros do poder = pior (menor) parâmetro entre TODOS os efeitos
  // Esses valores podem ser modificados manualmente pelo usuário depois
  useEffect(() => {
    // Não atualiza parâmetros se estamos carregando um poder existente
    if (isCarregandoPoder.current) {
      isCarregandoPoder.current = false;
      return;
    }

    // Se foi carregado do storage, NUNCA atualiza automaticamente os parâmetros
    // O usuário salvou esses valores específicos, devemos respeitá-los
    if (foiCarregadoDeStorage.current) {
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
  }, [efeitosIds]);

  // Adiciona um novo efeito ao poder
  const adicionarEfeito = (efeitoBaseId: string, grau: number = 1) => {
    const efeitoBase = todosEfeitos.find(e => e.id === efeitoBaseId);
    if (!efeitoBase) return;

    const novoEfeito: EfeitoAplicado = {
      id: `efeito-${Date.now()}`,
      efeitoBaseId,
      grau,
      modificacoesLocais: [],
    };

    // Ao adicionar efeito manualmente, permite auto-atualização de parâmetros
    foiCarregadoDeStorage.current = false;

    setPoder(prev => ({
      ...prev,
      efeitos: [...prev.efeitos, novoEfeito],
    }));
  };

  // Remove um efeito
  const removerEfeito = (efeitoId: string) => {
    // Ao remover efeito manualmente, permite auto-atualização de parâmetros
    foiCarregadoDeStorage.current = false;
    
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
    // Reseta as flags de carregamento
    primeiroCarregamentoProcessado.current = false;
    foiCarregadoDeStorage.current = false;
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
