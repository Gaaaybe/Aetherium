import { useState, useMemo, useEffect, useRef } from 'react';
import { EFEITOS, MODIFICACOES } from '../../../data';
import { useCustomItems } from '../../../shared/hooks';
import { 
  Poder, 
  EfeitoAplicado, 
  ModificacaoAplicada,
  calcularDetalhesPoder,
  calcularParametrosPadrao
} from '../regras/calculadoraCusto';
import { usePoderPersistence, PODER_PADRAO } from './usePoderPersistence';

export function usePoderCalculator() {
  const { customEfeitos, customModificacoes } = useCustomItems();
  const { 
    carregarEstadoInicial, 
    salvarAutomaticamente, 
    limparPersistencia, 
    foiCarregadoDeStorage 
  } = usePoderPersistence();

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
  const primeiroCarregamentoProcessado = useRef(false);

  const [poder, setPoder] = useState<Poder>(carregarEstadoInicial);

  // Cria uma string de IDs dos efeitos para detectar mudanças reais
  const efeitosIds = poder.efeitos.map(e => e.efeitoBaseId).sort().join(',');

  // Auto-save: Salva o poder no localStorage sempre que ele mudar
  useEffect(() => {
    salvarAutomaticamente(poder);
  }, [poder, salvarAutomaticamente]);

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

    const parametrosPadrao = calcularParametrosPadrao(poder.efeitos, todosEfeitos);
    
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
  }, [efeitosIds, todosEfeitos]);

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
        e.id === efeitoId ? { ...e, grau: Math.max(-5, Math.min(20, novoGrau)) } : e
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
  const atualizarInfoPoder = (
    nome?: string, 
    descricao?: string, 
    dominioId?: string, 
    dominioAreaConhecimento?: string,
    dominioIdPeculiar?: string
  ) => {
    setPoder(prev => ({
      ...prev,
      ...(nome !== undefined && { nome }),
      ...(descricao !== undefined && { descricao }),
      ...(dominioId !== undefined && { dominioId }),
      ...(dominioAreaConhecimento !== undefined && { dominioAreaConhecimento }),
      ...(dominioIdPeculiar !== undefined && { dominioIdPeculiar }),
    }));
  };

  // Reseta o poder
  const resetarPoder = () => {
    const novoPoder: Poder = {
      ...PODER_PADRAO,
      id: Date.now().toString(),
    };
    setPoder(novoPoder);
    // Reseta as flags de carregamento
    primeiroCarregamentoProcessado.current = false;
    limparPersistencia();
  };

  // Atualiza o custo alternativo do poder
  const atualizarCustoAlternativo = (custoAlternativo: Poder['custoAlternativo']) => {
    setPoder(prev => ({
      ...prev,
      custoAlternativo,
    }));
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
    atualizarCustoAlternativo,
    resetarPoder,
    carregarPoder,
  };
}
