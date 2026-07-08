// Importa todos os dados JSON
import efeitos from './efeitos.json';
import modificacoes from './modificacoes.json';
import { UNIVERSAL_TABLE as rulesEngineUniversalTable } from '@aetherium/rules-engine';
import escalas from './escalas.json';
import dominios from './dominios.json';
import acoesCombate from './acoesCombate.json';
import beneficios from './beneficios.json';
import condicoes from './condicoes.json';

// Tipos TypeScript (opcional, para melhor autocompletar)
export interface ConfiguracaoEfeito {
  id: string;
  nome: string;
  modificadorCusto: number; // +0, +2, +5, etc. (somado ao custoBase)
  modificadorCustoFixo?: number; // Modificador de custo fixo (usado por algumas modificações)
  descricao: string;
  grauMinimo?: number; // ex: grau 2+ para patamar 1
  custoProgressivo?: 'dobrado'; // Indica se o custo dobra a cada incremento (para crítico)
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
  custom?: boolean; // Marca se é um efeito customizado pelo usuário
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
  custom?: boolean; // Marca se é uma modificação customizada pelo usuário
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

export interface Dominio {
  id: string;
  nome: string;
  descricao: string;
  espiritual: boolean | null; // null para Peculiar (customizável)
  categoria: 'espiritual' | 'especial' | 'arma' | 'físico';
  requerAreaConhecimento?: boolean; // Para Científico
  areasConhecimento?: string[]; // Áreas do Científico
  customizavel?: boolean; // Para Peculiar
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

export interface AcaoCombate {
  id: string;
  nome: string;
  tipo: 'PADRAO' | 'MOVIMENTO' | 'COMPLETA' | 'REACAO' | 'LIVRE' | 'REGRA';
  descricao: string;
}

export interface BenefitCatalogEntry {
  nome: string;
  tipo: string;
  graus: number | string | 'Vários';
  descricao: string;
  custo_base?: number;
  regra_custo?: 'linear' | 'dobro_por_grau';
  requisitos?: string[];
}

export interface Condicao {
  id: string;
  nome: string;
  patamar: 'Fraca' | 'Média' | 'Forte' | 'Extrema';
  descricao: string;
  evolucao?: string;
}

// Exporta os dados
export const EFEITOS: Efeito[] = efeitos as Efeito[];
export const MODIFICACOES: Modificacao[] = modificacoes as Modificacao[];
export const TABELA_UNIVERSAL: TabelaUniversalItem[] = rulesEngineUniversalTable as any;
export const ESCALAS: Escalas = escalas as Escalas;
export const DOMINIOS: Dominio[] = dominios as Dominio[];
export const ACOES_COMBATE: AcaoCombate[] = acoesCombate as AcaoCombate[];
export const BENEFICIOS: BenefitCatalogEntry[] = beneficios as BenefitCatalogEntry[];
export const CONDICOES: Condicao[] = condicoes as Condicao[];

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

export function buscarDominio(id: string): Dominio | undefined {
  return DOMINIOS.find(d => d.id === id);
}
