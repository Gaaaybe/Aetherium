/**
 * Tipos TypeScript para o sistema de criação de poderes
 */

// Re-exporta tipos da calculadora para evitar duplicação
export type {
  ModificacaoAplicada,
  EfeitoAplicado,
  Poder
} from '../regras/calculadoraCusto';

import type { EfeitoAplicado } from '../regras/calculadoraCusto';

// ============= TIPOS BASE =============

export interface Modificacao {
  id: string;
  nome: string;
  tipo: 'extra' | 'falha';
  custoFixo: number;
  custoPorGrau: number;
  descricao: string;
  requerParametros: boolean;
  categoria: string;
  observacoes?: string;
  tipoParametro?: 'texto' | 'numero' | 'select';
  placeholder?: string;
  opcoes?: string[];
  configuracoes?: ConfiguracaoModificacao[];
}

export interface ConfiguracaoModificacao {
  tipo: string;
  label: string;
  opcoes: OpcaoConfiguracao[];
}

export interface OpcaoConfiguracao {
  id: string;
  nome: string;
  modificadorCusto: number;
  descricao: string;
  grauMinimo?: number;
}

export interface EfeitoBase {
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
  exemplos?: string;
  requerInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  tipoInput?: 'text' | 'texto' | 'numero' | 'select';
  labelInput?: string;
  placeholderInput?: string;
  opcoesInput?: string[];
  configuracoes?: {
    tipo: string;
    label: string;
    opcoes: OpcaoConfiguracao[];
  };
}

// ============= TIPOS DE DETALHES =============

export interface EfeitoDetalhado {
  efeito: EfeitoAplicado;  // Usa o tipo do calculadora
  efeitoBase: EfeitoBase;
  custoPorGrau: number;
  custoFixo: number;
  custoTotal: number;
}

export interface DetalhesPoder {
  custoPdATotal: number;
  peTotal: number;
  espacosTotal: number;
  efeitosDetalhados: (EfeitoDetalhado | null)[];
}

// ============= TIPOS DE EVENTOS =============

export type EventoChangeInput = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;
export type EventoChangeSelect = React.ChangeEvent<HTMLSelectElement>;
