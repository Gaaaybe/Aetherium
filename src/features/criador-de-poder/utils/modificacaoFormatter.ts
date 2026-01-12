/**
 * Utilitários para formatação de custos de modificações
 * 
 * Centraliza a lógica de cálculo e formatação de custos de modificações
 * para evitar duplicação entre componentes.
 */

import type { ModificacaoAplicada } from '../types';
import type { Modificacao } from '../../../data';

/**
 * Formata o custo de uma modificação para exibição
 * 
 * @param mod Modificação aplicada (com parâmetros e grau)
 * @param modBase Dados base da modificação (custos, configurações)
 * @returns String formatada com o custo (ex: "(+2/grau)" ou "(-1 fixo)")
 * 
 * @example
 * // Modificação com custo por grau
 * formatarCustoModificacao(mod, modBase) // "(+2/grau)"
 * 
 * @example
 * // Modificação com configuração que altera custo fixo
 * formatarCustoModificacao(mod, modBase) // "(+1 fixo)"
 * 
 * @example
 * // Modificação com ambos os custos
 * formatarCustoModificacao(mod, modBase) // "(+2/grau, +1 fixo)"
 */
export function formatarCustoModificacao(
  mod: ModificacaoAplicada,
  modBase: Modificacao
): string {
  if (!modBase) return '';
  
  const grauMod = mod.grauModificacao || 1;
  
  // Custo por grau base
  let custoPorGrauMod = modBase.custoPorGrau || 0;
  let custoFixoMod = modBase.custoFixo || 0;
  
  // Aplica modificadores da configuração selecionada
  if (mod.parametros?.configuracaoSelecionada && modBase.configuracoes?.opcoes) {
    const configuracao = modBase.configuracoes.opcoes.find(
      (opt) => opt.id === mod.parametros!.configuracaoSelecionada
    );
    
    if (configuracao) {
      // Modificador por grau (ex: Efeito Colateral Menor = -1/grau)
      if (configuracao.modificadorCusto !== undefined) {
        custoPorGrauMod += configuracao.modificadorCusto;
      }
      // Modificador fixo (ex: Sutil Difícil = +1 fixo, Indetectável = +2 fixo)
      if (configuracao.modificadorCustoFixo !== undefined) {
        custoFixoMod += configuracao.modificadorCustoFixo;
      }
    }
  }
  
  const custoPorGrauTotal = custoPorGrauMod * grauMod;
  
  return formatarCustoPartes(custoPorGrauTotal, custoFixoMod);
}

/**
 * Formata as partes do custo (por grau e fixo) em uma string legível
 * 
 * @param custoPorGrau Custo por grau total
 * @param custoFixo Custo fixo total
 * @returns String formatada ou vazia se ambos forem zero
 * 
 * @internal
 */
function formatarCustoPartes(custoPorGrau: number, custoFixo: number): string {
  const partes: string[] = [];
  
  // Formata custo por grau
  if (custoPorGrau !== 0) {
    const sinal = custoPorGrau > 0 ? '+' : '';
    partes.push(`${sinal}${custoPorGrau}/grau`);
  }
  
  // Formata custo fixo
  if (custoFixo !== 0) {
    const sinal = custoFixo > 0 ? '+' : '';
    partes.push(`${sinal}${custoFixo} fixo`);
  }
  
  return partes.length > 0 ? ` (${partes.join(', ')})` : '';
}

/**
 * Calcula o custo total de uma modificação (sem formatação)
 * 
 * @param mod Modificação aplicada
 * @param modBase Dados base da modificação
 * @returns Objeto com custoPorGrau e custoFixo calculados
 */
export function calcularCustoModificacao(
  mod: ModificacaoAplicada,
  modBase: Modificacao
): { custoPorGrauTotal: number; custoFixo: number } {
  if (!modBase) {
    return { custoPorGrauTotal: 0, custoFixo: 0 };
  }
  
  const grauMod = mod.grauModificacao || 1;
  let custoPorGrauMod = modBase.custoPorGrau || 0;
  let custoFixoMod = modBase.custoFixo || 0;
  
  // Aplica modificadores da configuração
  if (mod.parametros?.configuracaoSelecionada && modBase.configuracoes?.opcoes) {
    const configuracao = modBase.configuracoes.opcoes.find(
      (opt) => opt.id === mod.parametros!.configuracaoSelecionada
    );
    
    if (configuracao) {
      if (configuracao.modificadorCusto !== undefined) {
        custoPorGrauMod += configuracao.modificadorCusto;
      }
      if (configuracao.modificadorCustoFixo !== undefined) {
        custoFixoMod += configuracao.modificadorCustoFixo;
      }
    }
  }
  
  return {
    custoPorGrauTotal: custoPorGrauMod * grauMod,
    custoFixo: custoFixoMod,
  };
}
