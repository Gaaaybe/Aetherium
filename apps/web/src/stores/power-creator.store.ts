import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  type Poder, 
  type EfeitoAplicado, 
  type ModificacaoAplicada, 
  calcularParametrosPadrao 
} from '@/features/criador-de-poder/regras/calculadoraCusto';

export const PODER_PADRAO: Omit<Poder, 'id'> = {
  nome: 'Novo Poder',
  descricao: '',
  dominioId: 'natural',
  efeitos: [],
  modificacoesGlobais: [],
  acao: 0,
  alcance: 0,
  duracao: 0,
};

interface PowerCreatorStore {
  poder: Poder;
  foiCarregadoDeStorage: boolean;
  adicionarEfeito: (efeitoBaseId: string, todosEfeitos: any[], grau?: number) => void;
  removerEfeito: (efeitoId: string, todosEfeitos: any[]) => void;
  atualizarGrauEfeito: (efeitoId: string, grau: number) => void;
  atualizarParametroPoder: (parametro: 'acao' | 'alcance' | 'duracao', valor: number) => void;
  atualizarInputCustomizado: (efeitoId: string, valor: string) => void;
  atualizarConfiguracaoEfeito: (efeitoId: string, configuracaoId: string) => void;
  atualizarDadoModularizado: (efeitoId: string, dado: string) => void;
  adicionarModificacaoLocal: (efeitoId: string, modificacaoBaseId: string, parametros?: Record<string, any>) => void;
  atualizarModificacaoLocal: (efeitoId: string, modificacaoId: string, parametros?: Record<string, any>) => void;
  removerModificacaoLocal: (efeitoId: string, modificacaoId: string) => void;
  adicionarModificacaoGlobal: (modificacaoBaseId: string, parametros?: Record<string, any>) => void;
  atualizarModificacaoGlobal: (modificacaoId: string, parametros?: Record<string, any>) => void;
  removerModificacaoGlobal: (modificacaoId: string) => void;
  atualizarInfoPoder: (info: Partial<Omit<Poder, 'id' | 'efeitos' | 'modificacoesGlobais'>>) => void;
  atualizarCustoAlternativo: (custo?: Poder['custoAlternativo']) => void;
  resetarPoder: () => void;
  carregarPoder: (poder: Poder) => void;
  atualizarIdPoder: (id: string) => void;
  habilitarAutoAtualizacaoParametros: () => void;
}

export const usePowerCreatorStore = create<PowerCreatorStore>()(
  persist(
    (set) => ({
      poder: { ...PODER_PADRAO, id: Date.now().toString() },
      foiCarregadoDeStorage: false,

      adicionarEfeito: (efeitoBaseId, todosEfeitos, grau) => set((state) => {
        const novoEfeito: EfeitoAplicado = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
          efeitoBaseId,
          grau: grau ?? 1,
          modificacoesLocais: [],
        };
        const novosEfeitos = [...state.poder.efeitos, novoEfeito];
        
        let { acao, alcance, duracao } = state.poder;
        if (!state.foiCarregadoDeStorage) {
          const padrao = calcularParametrosPadrao(novosEfeitos, todosEfeitos);
          acao = padrao.acao;
          alcance = padrao.alcance;
          duracao = padrao.duracao;
        }

        return {
          poder: {
            ...state.poder,
            efeitos: novosEfeitos,
            acao,
            alcance,
            duracao,
          },
        };
      }),

      removerEfeito: (efeitoId, todosEfeitos) => set((state) => {
        const novosEfeitos = state.poder.efeitos.filter((e) => e.id !== efeitoId);
        
        let { acao, alcance, duracao } = state.poder;
        if (!state.foiCarregadoDeStorage) {
          const padrao = calcularParametrosPadrao(novosEfeitos, todosEfeitos);
          acao = padrao.acao;
          alcance = padrao.alcance;
          duracao = padrao.duracao;
        }

        return {
          poder: {
            ...state.poder,
            efeitos: novosEfeitos,
            acao,
            alcance,
            duracao,
          },
        };
      }),

      atualizarGrauEfeito: (efeitoId, grau) => set((state) => ({
        poder: {
          ...state.poder,
          efeitos: state.poder.efeitos.map((e) =>
            e.id === efeitoId ? { ...e, grau } : e
          ),
        },
      })),

      atualizarParametroPoder: (parametro, valor) => set((state) => {
        const nextPoder = {
          ...state.poder,
          [parametro]: valor,
        };
        
        // Se a duração for Permanente (4), a ação DEVE ser Nenhuma (5)
        if (parametro === 'duracao' && valor === 4) {
          nextPoder.acao = 5;
        }
        // Se a ação for alterada e a duração atual for Permanente (4), a ação deve permanecer Nenhuma (5)
        if (parametro === 'acao' && state.poder.duracao === 4) {
          nextPoder.acao = 5;
        }
        
        return { poder: nextPoder };
      }),

      atualizarInputCustomizado: (efeitoId, valor) => set((state) => ({
        poder: {
          ...state.poder,
          efeitos: state.poder.efeitos.map((e) =>
            e.id === efeitoId ? { ...e, inputCustomizado: valor } : e
          ),
        },
      })),

      atualizarConfiguracaoEfeito: (efeitoId, configuracaoId) => set((state) => ({
        poder: {
          ...state.poder,
          efeitos: state.poder.efeitos.map((e) =>
            e.id === efeitoId ? { ...e, configuracaoSelecionada: configuracaoId } : e
          ),
        },
      })),

      atualizarDadoModularizado: (efeitoId, dado) => set((state) => ({
        poder: {
          ...state.poder,
          efeitos: state.poder.efeitos.map((e) =>
            e.id === efeitoId ? { ...e, dadoModularizado: dado || undefined } : e
          ),
        },
      })),

      adicionarModificacaoLocal: (efeitoId, modificacaoBaseId, parametros) => set((state) => {
        const novaMod: ModificacaoAplicada = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
          modificacaoBaseId,
          escopo: 'local',
          parametros: parametros ?? {},
          grauModificacao: parametros?.grau ? Number(parametros.grau) : 1,
        };

        return {
          poder: {
            ...state.poder,
            efeitos: state.poder.efeitos.map((e) =>
              e.id === efeitoId
                ? { ...e, modificacoesLocais: [...e.modificacoesLocais, novaMod] }
                : e
            ),
          },
        };
      }),

      atualizarModificacaoLocal: (efeitoId, modificacaoId, parametros) => set((state) => ({
        poder: {
          ...state.poder,
          efeitos: state.poder.efeitos.map((e) =>
            e.id === efeitoId
              ? {
                  ...e,
                  modificacoesLocais: e.modificacoesLocais.map((m) =>
                    m.id === modificacaoId
                      ? {
                          ...m,
                          parametros: parametros ?? {},
                          grauModificacao: parametros?.grau ? Number(parametros.grau) : 1,
                        }
                      : m
                  ),
                }
              : e
          ),
        },
      })),

      removerModificacaoLocal: (efeitoId, modificacaoId) => set((state) => ({
        poder: {
          ...state.poder,
          efeitos: state.poder.efeitos.map((e) =>
            e.id === efeitoId
              ? { ...e, modificacoesLocais: e.modificacoesLocais.filter((m) => m.id !== modificacaoId) }
              : e
          ),
        },
      })),

      adicionarModificacaoGlobal: (modificacaoBaseId, parametros) => set((state) => {
        const novaMod: ModificacaoAplicada = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
          modificacaoBaseId,
          escopo: 'global',
          parametros: parametros ?? {},
          grauModificacao: parametros?.grau ? Number(parametros.grau) : 1,
        };

        return {
          poder: {
            ...state.poder,
            modificacoesGlobais: [...state.poder.modificacoesGlobais, novaMod],
          },
        };
      }),

      atualizarModificacaoGlobal: (modificacaoId, parametros) => set((state) => ({
        poder: {
          ...state.poder,
          modificacoesGlobais: state.poder.modificacoesGlobais.map((m) =>
            m.id === modificacaoId
              ? {
                  ...m,
                  parametros: parametros ?? {},
                  grauModificacao: parametros?.grau ? Number(parametros.grau) : 1,
                }
              : m
          ),
        },
      })),

      removerModificacaoGlobal: (modificacaoId) => set((state) => ({
        poder: {
          ...state.poder,
          modificacoesGlobais: state.poder.modificacoesGlobais.filter((m) => m.id !== modificacaoId),
        },
      })),

      atualizarInfoPoder: (info) => set((state) => {
        const cleanInfo = Object.fromEntries(
          Object.entries(info).filter(([_, v]) => v !== undefined)
        );
        return {
          poder: {
            ...state.poder,
            ...cleanInfo,
          },
        };
      }),

      atualizarCustoAlternativo: (custo) => set((state) => ({
        poder: {
          ...state.poder,
          custoAlternativo: custo,
        },
      })),

      resetarPoder: () => set(() => ({
        poder: { ...PODER_PADRAO, id: Date.now().toString() },
        foiCarregadoDeStorage: false,
      })),

      carregarPoder: (poder) => set(() => ({
        poder,
        foiCarregadoDeStorage: true,
      })),

      atualizarIdPoder: (id) => set((state) => ({
        poder: {
          ...state.poder,
          id,
        },
      })),

      habilitarAutoAtualizacaoParametros: () => set(() => ({
        foiCarregadoDeStorage: false,
      })),
    }),
    {
      name: 'criador-de-poder-store',
    }
  )
);
