import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rollD20, rollDice, rollDamage, formatRollResult } from '../../shared/utils/diceRoller';

describe('diceRoller.ts', () => {
  let mathRandomSpy: any;

  beforeEach(() => {
    // Vamos criar o spy do Math.random para termos rolagens previsíveis nos testes
    mathRandomSpy = vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    mathRandomSpy.mockRestore();
  });

  describe('rollD20', () => {
    it('deve rolar d20 normal e adicionar modificador', () => {
      // Mock para retornar 10 no d20 (Math.random() * 20 = 9 -> d20 = 10)
      mathRandomSpy.mockReturnValue(0.45); // 0.45 * 20 + 1 = 9 + 1 = 10
      
      const result = rollD20(3, 0, 'normal');
      
      expect(result.d20).toBe(10);
      expect(result.modifier).toBe(3);
      expect(result.total).toBe(13);
      expect(result.isCritical).toBe(false);
      expect(result.isFumble).toBe(false);
    });

    it('deve selecionar o maior resultado se for rolagem com Vantagem', () => {
      // Rola 2 dados extras (3 dados no total)
      // Retorna 5 (0.24 * 20 + 1 = 5), 18 (0.89 * 20 + 1 = 18), 12 (0.59 * 20 + 1 = 12)
      mathRandomSpy
        .mockReturnValueOnce(0.24)
        .mockReturnValueOnce(0.89)
        .mockReturnValueOnce(0.59);
      
      const result = rollD20(2, 2, 'advantage');
      
      expect(result.allRolls).toEqual([5, 18, 12]);
      expect(result.d20).toBe(18); // Máximo entre 5, 18 e 12
      expect(result.total).toBe(20); // 18 + 2
      expect(result.advantage).toBe(2);
    });

    it('deve selecionar o menor resultado se for rolagem com Desvantagem', () => {
      // Rola 1 dado extra (2 dados no total)
      // Retorna 15 (0.74 * 20 + 1 = 15), 4 (0.19 * 20 + 1 = 4)
      mathRandomSpy
        .mockReturnValueOnce(0.74)
        .mockReturnValueOnce(0.19);
      
      const result = rollD20(-1, 1, 'disadvantage');
      
      expect(result.allRolls).toEqual([15, 4]);
      expect(result.d20).toBe(4); // Mínimo entre 15 e 4
      expect(result.total).toBe(3); // 4 - 1
      expect(result.advantage).toBe(-1);
    });

    it('deve identificar acerto crítico baseado em margem customizada', () => {
      // Retorna 18 (0.89 * 20 + 1 = 18)
      mathRandomSpy.mockReturnValue(0.89);
      
      // Margem padrão (20) -> Não deve ser crítico
      const resNormal = rollD20(0, 0, 'normal', 20);
      expect(resNormal.isCritical).toBe(false);
      
      // Margem customizada (18) -> Deve ser crítico
      const resCrit = rollD20(0, 0, 'normal', 18);
      expect(resCrit.isCritical).toBe(true);
    });

    it('deve identificar falha crítica (fumble) quando tirar 1 no dado', () => {
      // Retorna 1 (0.01 * 20 + 1 = 1)
      mathRandomSpy.mockReturnValue(0.01);
      
      const result = rollD20(5, 0, 'normal');
      expect(result.d20).toBe(1);
      expect(result.isFumble).toBe(true);
    });
  });

  describe('rollDice', () => {
    it('deve rolar múltiplos dados NdX e somar seus resultados', () => {
      // 3d6. Math.random mockado para retornar rolagens de 3, 5, 2
      // 3: 0.4 * 6 + 1 = 3.4 -> floor(3.4) = 3
      // 5: 0.75 * 6 + 1 = 5.5 -> floor(5.5) = 5
      // 2: 0.3 * 6 + 1 = 2.8 -> floor(2.8) = 2
      mathRandomSpy
        .mockReturnValueOnce(0.4)
        .mockReturnValueOnce(0.75)
        .mockReturnValueOnce(0.3);
      
      const total = rollDice(3, 6);
      expect(total).toBe(10); // 3 + 5 + 2 = 10
    });
  });

  describe('rollDamage', () => {
    it('deve parsear e calcular fórmula simples', () => {
      // 1d6 + 2. d6 rola 4 (0.6 * 6 + 1 = 4.6 -> 4)
      mathRandomSpy.mockReturnValue(0.6);
      
      const result = rollDamage('1d6 + 2');
      
      expect(result.total).toBe(6); // 4 + 2
      expect(result.baseTotal).toBe(6);
      expect(result.rolls).toEqual([4]);
      expect(result.modifier).toBe(2);
      expect(result.components).toHaveLength(2);
      expect(result.components[0].value).toBe(4);
      expect(result.components[0].label).toBe('1d6 (4)');
      expect(result.components[1].value).toBe(2);
      expect(result.components[1].label).toBe('2');
    });

    it('deve parsear fórmula composta com múltiplos dados, modificadores e anotações', () => {
      // 2d4 + 1d6 - 3 [FOGO].
      // 2d4 rola: 3 (0.6 * 4 + 1 = 3.4 -> 3) e 2 (0.3 * 4 + 1 = 2.2 -> 2)
      // 1d6 rola: 5 (0.75 * 6 + 1 = 5.5 -> 5)
      mathRandomSpy
        .mockReturnValueOnce(0.6)
        .mockReturnValueOnce(0.3)
        .mockReturnValueOnce(0.75);
      
      const result = rollDamage('2d4 + 1d6 - 3 [FOGO]');
      
      expect(result.rolls).toEqual([3, 2, 5]);
      // 2d4 (3+2=5) + 1d6 (5) - 3 = 7
      expect(result.total).toBe(7);
      expect(result.modifier).toBe(-3);
      expect(result.components).toHaveLength(3);
      expect(result.components[0].label).toBe('2d4 (3+2)');
      expect(result.components[1].label).toBe('1d6 (5)');
      expect(result.components[2].label).toBe('3 [FOGO]');
    });

    it('deve multiplicar danos normais sob acerto crítico mas manter componente Acoplado no valor original', () => {
      // Formula: 2d6 + 1d4 [Acoplado] + 3. Multiplicador crítico: 2.
      // 2d6 rola: 4 e 5 (total 9)
      // 1d4 [Acoplado] rola: 3
      mathRandomSpy
        .mockReturnValueOnce(0.6) // 2d6 -> 4 (0.6*6+1=4)
        .mockReturnValueOnce(0.75) // 2d6 -> 5 (0.75*6+1=5)
        .mockReturnValueOnce(0.6); // 1d4 -> 3 (0.6*4+1=3)
      
      const result = rollDamage('2d6 + 1d4 [Acoplado] + 3', 2);
      
      // Custo total deve ser: (9 * 2) + (3 * 1) + (3 * 2) = 18 + 3 + 6 = 27
      expect(result.total).toBe(27);
      expect(result.baseTotal).toBe(15); // 9 + 3 + 3 = 15
      expect(result.components).toHaveLength(3);
      
      // Componente 2d6 deve ter x2
      expect(result.components[0].value).toBe(18);
      expect(result.components[0].label).toContain('x2');
      
      // Componente Acoplado deve manter o valor 3 original e NÃO possuir x2
      expect(result.components[1].value).toBe(3);
      expect(result.components[1].label).toContain('[Acoplado]');
      expect(result.components[1].label).not.toContain('x2');

      // Modificador 3 deve ter x2
      expect(result.components[2].value).toBe(6);
      expect(result.components[2].label).toBe('3 x2');
    });
  });

  describe('formatRollResult', () => {
    it('deve formatar resultado normal corretamente', () => {
      const roll: any = {
        d20: 14,
        modifier: 3,
        total: 17,
        advantage: 0,
        isCritical: false,
        isFumble: false
      };
      expect(formatRollResult(roll)).toBe('🎲 14 +3 = 17');
    });

    it('deve formatar resultado com vantagem e indicação de crítico', () => {
      const roll: any = {
        d20: 20,
        modifier: 2,
        total: 22,
        advantage: 1,
        allRolls: [8, 20],
        isCritical: true,
        isFumble: false
      };
      expect(formatRollResult(roll)).toBe('🎲 20 +2 = 22 ⭐ CRÍTICO! (Vantagem: [8, 20])');
    });

    it('deve formatar resultado com desvantagem e indicação de falha', () => {
      const roll: any = {
        d20: 1,
        modifier: -1,
        total: 0,
        advantage: -1,
        allRolls: [15, 1],
        isCritical: false,
        isFumble: true
      };
      expect(formatRollResult(roll)).toBe('🎲 1 -1 = 0 💀 FALHA! (Desvantagem: [15, 1])');
    });
  });
});
