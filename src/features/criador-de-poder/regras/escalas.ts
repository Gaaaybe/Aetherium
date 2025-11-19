/**
 * Escalas de Parâmetros (RN-06)
 * Usadas para calcular o custo de mudança de parâmetros
 */

import { ESCALAS } from '../../../data';

export const ESCALA_ACAO = {
  COMPLETA: 0,
  PADRAO: 1,
  MOVIMENTO: 2,
  LIVRE: 3,
  REACAO: 4,
  NENHUMA: 5,
};

export const ESCALA_ALCANCE = {
  PESSOAL: 0,
  CORPO_A_CORPO: 1,
  DISTANCIA: 2,
  PERCEPCAO: 3,
};

export const ESCALA_DURACAO = {
  INSTANTANEO: 0,
  MANTIDA_CONCENTRACAO: 1,
  MANTIDA_SUSTENTADA: 2,
  ATIVADO: 3,
  PERMANENTE: 4,
};

/**
 * Obtém o valor de custo efetivo de um parâmetro, considerando custoEquivalente
 * Se o parâmetro tem custoEquivalente definido, usa esse valor para o cálculo
 */
function obterValorCusto(tipo: 'acao' | 'alcance' | 'duracao', valor: number): number {
  const escala = ESCALAS[tipo]?.escala.find(e => e.valor === valor);
  // Se tem custoEquivalente, usa ele; senão usa o valor normal
  return escala && 'custoEquivalente' in escala ? (escala.custoEquivalente as number) : valor;
}

/**
 * Calcula o modificador de custo ao mudar um parâmetro
 * RN-06: (Valor_Usado - Valor_Padrão) = Modificador_PorGrau
 * 
 * LÓGICA: Nas escalas, valores MAIORES são MELHORES (mais flexíveis/poderosos)
 * O "PIOR" parâmetro é o MAIS PRÓXIMO DE 0 (mais restritivo)
 * 
 * - Ação: 0 (Completa) é PIOR que 5 (Nenhuma)
 * - Alcance: 0 (Pessoal) é PIOR que 3 (Percepção)
 * - Duração: 0 (Instantâneo) é PIOR que 4 (Permanente)
 * 
 * Se você MELHORA um parâmetro (valor maior), o custo AUMENTA (modificador positivo)
 * Se você PIORA um parâmetro (valor menor), o custo DIMINUI (modificador negativo)
 * 
 * NOTA: Alguns parâmetros podem ter custoEquivalente definido (ex: Permanente = Ativado)
 * Neste caso, usa o custoEquivalente para o cálculo ao invés do valor real
 * 
 * Exemplo:
 * - Efeito padrão: ação=1 (Padrão)
 * - Poder força: ação=5 (Nenhuma) → MELHOR!
 * - Modificador: 5 - 1 = +4 (aumenta 4 PdA/grau) ✅
 * 
 * @param {number} valorPadrao - Valor padrão do efeito
 * @param {number} valorUsado - Valor que o poder está forçando
 * @param {string} tipo - Tipo do parâmetro ('acao', 'alcance' ou 'duracao')
 * @returns {number} Modificador de custo por grau (positivo = mais caro, negativo = mais barato)
 */
export function calcularModificadorParametro(
  valorPadrao: number, 
  valorUsado: number, 
  tipo: 'acao' | 'alcance' | 'duracao' = 'duracao'
): number {
  const custoPadrao = obterValorCusto(tipo, valorPadrao);
  const custoUsado = obterValorCusto(tipo, valorUsado);
  return custoUsado - custoPadrao;
}

/**
 * Obtém o parâmetro mais restritivo entre vários valores (RN-07)
 * Usado para determinar os parâmetros finais de um Poder com múltiplos Efeitos
 */
export function obterParametroMaisRestritivo(valores: number[]): number | null {
  if (valores.length === 0) return null;
  
  // Para Ação, Alcance e Duração, o menor valor é o mais restritivo
  // (Ação Completa é mais lenta que Livre, Pessoal é mais curto que Distância, etc)
  return Math.min(...valores);
}
