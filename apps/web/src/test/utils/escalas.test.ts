import { describe, it, expect } from 'vitest';
import {
  obterParametroMaisRestritivo,
  calcularModificadorParametro,
  ESCALA_ACAO,
  ESCALA_ALCANCE,
  ESCALA_DURACAO
} from '../../features/criador-de-poder/regras/escalas';

describe('Escalas de Parâmetros - escalas.ts', () => {

  describe('obterParametroMaisRestritivo', () => {
    it('deve retornar null se o array for vazio', () => {
      expect(obterParametroMaisRestritivo([])).toBeNull();
    });

    it('deve retornar o menor valor (mais restritivo) entre vários parâmetros', () => {
      expect(obterParametroMaisRestritivo([3, 1, 4, 2])).toBe(1);
      expect(obterParametroMaisRestritivo([ESCALA_ACAO.LIVRE, ESCALA_ACAO.PADRAO, ESCALA_ACAO.REACAO])).toBe(ESCALA_ACAO.PADRAO);
      expect(obterParametroMaisRestritivo([ESCALA_ALCANCE.PERCEPCAO, ESCALA_ALCANCE.PESSOAL, ESCALA_ALCANCE.DISTANCIA])).toBe(ESCALA_ALCANCE.PESSOAL);
    });
  });

  describe('calcularModificadorParametro', () => {
    it('deve calcular o custo de transição para Ação (linear)', () => {
      // Padrão (1) para Livre (3) -> custo deve ser 3 - 1 = 2
      expect(calcularModificadorParametro(ESCALA_ACAO.PADRAO, ESCALA_ACAO.LIVRE, 'acao')).toBe(2);
      
      // Livre (3) para Padrão (1) -> custo deve ser 1 - 3 = -2
      expect(calcularModificadorParametro(ESCALA_ACAO.LIVRE, ESCALA_ACAO.PADRAO, 'acao')).toBe(-2);
    });

    it('deve calcular o custo de transição para Alcance (linear)', () => {
      // Corpo a Corpo (1) para Distância (2) -> custo deve ser 2 - 1 = 1
      expect(calcularModificadorParametro(ESCALA_ALCANCE.CORPO_A_CORPO, ESCALA_ALCANCE.DISTANCIA, 'alcance')).toBe(1);

      // Distância (2) para Pessoal (0) -> custo deve ser 0 - 2 = -2
      expect(calcularModificadorParametro(ESCALA_ALCANCE.DISTANCIA, ESCALA_ALCANCE.PESSOAL, 'alcance')).toBe(-2);
    });

    it('deve calcular o custo de transição para Duração usando as transições não-lineares especiais', () => {
      // Instantâneo (0) -> Concentração (1): custo = +1
      expect(calcularModificadorParametro(0, 1, 'duracao')).toBe(1);

      // Concentração (1) -> Sustentada (2): custo = +2
      expect(calcularModificadorParametro(1, 2, 'duracao')).toBe(2);

      // Sustentada (2) -> Ativado (3): custo = +3
      expect(calcularModificadorParametro(2, 3, 'duracao')).toBe(3);

      // Instantâneo (0) -> Sustentada (2): custo = 1 (transição 0->1) + 2 (transição 1->2) = +3
      expect(calcularModificadorParametro(0, 2, 'duracao')).toBe(3);

      // Instantâneo (0) -> Ativado (3): custo = 1 (0->1) + 2 (1->2) + 3 (2->3) = +6
      expect(calcularModificadorParametro(0, 3, 'duracao')).toBe(6);

      // Sustentada (2) -> Instantâneo (0): custo = -2 (transição 2->1) - 1 (transição 1->0) = -3
      expect(calcularModificadorParametro(2, 0, 'duracao')).toBe(-3);

      // Ativado (3) -> Instantâneo (0): custo = -3 (3->2) - 2 (2->1) - 1 (1->0) = -6
      expect(calcularModificadorParametro(3, 0, 'duracao')).toBe(-6);
    });

    it('deve lidar corretamente com o custoEquivalente de Permanente (4)', () => {
      // Permanente (4) tem custoEquivalente = Ativado (3) na definição das escalas
      // Então transição de Instantâneo (0) para Permanente (4) deve ser calculada como se fosse para Ativado (3)
      // Instantâneo (0) -> Permanente (4) = Instantâneo (0) -> Ativado (3) = +6
      expect(calcularModificadorParametro(0, 4, 'duracao')).toBe(6);
    });
  });

});
