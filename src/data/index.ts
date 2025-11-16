// Importa todos os dados JSON
import efeitos from './efeitos.json';
import modificacoes from './modificacoes.json';
import tabelaUniversal from './tabelaUniversal.json';
import escalas from './escalas.json';

// Tipos TypeScript (opcional, para melhor autocompletar)
export interface ConfiguracaoEfeito {
  id: string;
  nome: string;
  modificadorCusto: number; // +0, +2, +5, etc. (somado ao custoBase)
  descricao: string;
  grauMinimo?: number; // ex: grau 2+ para patamar 1
}

export interface Efeito {
  id: string;
  nome: string;
  custoBase: number;
  descricao: string;
  parametrosPadrao: {
    acao: number;
    alcance: number;
    duracao: number;
  };
  categorias: string[];
  exemplos: string;
  custoProgressivo?: boolean;
  observacoes?: string;
  requerInput?: boolean;
  tipoInput?: 'texto' | 'numero' | 'select';
  labelInput?: string;
  opcoesInput?: string[];
  placeholderInput?: string;
  // Sistema de Configurações (para efeitos com patamares que alteram custo)
  configuracoes?: {
    tipo: 'select' | 'radio';
    label: string;
    opcoes: ConfiguracaoEfeito[];
  };
}

export interface Modificacao {
  id: string;
  nome: string;
  tipo: 'extra' | 'falha';
  custoFixo: number;
  custoPorGrau: number;
  descricao: string;
  requerParametros: boolean;
  tipoParametro?: 'texto' | 'numero' | 'select' | 'grau';
  opcoes?: string[];
  placeholder?: string;
  grauMinimo?: number;
  grauMaximo?: number;
  grauFixo?: number;
  detalhesGrau?: string;
  observacoes?: string;
  categoria: string;
  // Sistema de Configurações (para modificações com custos variáveis)
  configuracoes?: {
    tipo: 'select' | 'radio';
    label: string;
    opcoes: ConfiguracaoEfeito[];
  };
}

export interface TabelaUniversalItem {
  grau: number;
  pe: number;
  espacos: number;
  dano: string;
  distancia: string;
  massa: string;
  tempo: string;
  velocidade: string;
  deslocamento: string;
}

export interface EscalaParametro {
  valor: number;
  nome: string;
  descricao: string;
}

export interface Escalas {
  acao: {
    nome: string;
    descricao: string;
    escala: EscalaParametro[];
  };
  alcance: {
    nome: string;
    descricao: string;
    escala: EscalaParametro[];
  };
  duracao: {
    nome: string;
    descricao: string;
    escala: EscalaParametro[];
  };
}

// Exporta os dados
export const EFEITOS: Efeito[] = efeitos as Efeito[];
export const MODIFICACOES: Modificacao[] = modificacoes as Modificacao[];
export const TABELA_UNIVERSAL: TabelaUniversalItem[] = tabelaUniversal;
export const ESCALAS: Escalas = escalas as Escalas;

// Funções auxiliares para busca rápida
export function buscarEfeito(id: string): Efeito | undefined {
  return EFEITOS.find(e => e.id === id);
}

export function buscarModificacao(id: string): Modificacao | undefined {
  return MODIFICACOES.find(m => m.id === id);
}

export function buscarGrauNaTabela(grau: number): TabelaUniversalItem | undefined {
  return TABELA_UNIVERSAL.find(t => t.grau === grau);
}

export function obterNomeParametro(tipo: 'acao' | 'alcance' | 'duracao', valor: number): string {
  const escala = ESCALAS[tipo]?.escala.find(e => e.valor === valor);
  return escala?.nome || 'Desconhecido';
}
