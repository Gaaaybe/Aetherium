import { describe, it, expect } from 'vitest';
import {
  obterBonusFortalecerPorGrau,
  parseAlocacoes,
  parseFortalecerDanoRecuperacao,
  parseFortalecerCaracteristicaItem,
  formatarInputCustomizado
} from '../../features/criador-de-poder/components/CardEfeito';

describe('CardEfeito Helpers - CardEfeito.tsx', () => {

  describe('obterBonusFortalecerPorGrau', () => {
    it('deve retornar 0 para graus menores ou iguais a zero', () => {
      expect(obterBonusFortalecerPorGrau(0)).toBe(0);
      expect(obterBonusFortalecerPorGrau(-1)).toBe(0);
    });

    it('deve retornar bônus tabelados para graus de 1 a 3', () => {
      expect(obterBonusFortalecerPorGrau(1)).toBe(3);
      expect(obterBonusFortalecerPorGrau(2)).toBe(5);
      expect(obterBonusFortalecerPorGrau(3)).toBe(10);
    });

    it('deve calcular o bônus para graus maiores que 3', () => {
      // grau 4: 10 + (4-3)*15 = 25
      expect(obterBonusFortalecerPorGrau(4)).toBe(25);
      // grau 5: 10 + (5-3)*15 = 40
      expect(obterBonusFortalecerPorGrau(5)).toBe(40);
    });
  });

  describe('parseAlocacoes', () => {
    it('deve retornar array vazio se o input for indefinido ou vazio', () => {
      expect(parseAlocacoes(undefined, 'atributo', 3)).toEqual([]);
      expect(parseAlocacoes('', 'atributo', 3)).toEqual([]);
    });

    it('deve parsear JSON se o input começar com colchetes [', () => {
      const input = JSON.stringify([
        { tipo: 'atributo', alvo: 'strength', bonus: 3 },
        { tipo: 'pericia', alvo: 'Atletismo', bonus: 5 }
      ]);
      const alocacoes = parseAlocacoes(input, 'atributo', 3);
      expect(alocacoes.length).toBe(2);
      expect(alocacoes[0].alvo).toBe('strength');
    });

    it('deve retornar alocação fallback se o input for texto simples', () => {
      const alocacoes = parseAlocacoes('strength', 'atributo', 3);
      expect(alocacoes).toEqual([{ tipo: 'atributo', alvo: 'strength', bonus: 3 }]);
    });

    it('deve retornar fallback se o JSON for inválido', () => {
      const alocacoes = parseAlocacoes('invalid-json[', 'atributo', 3);
      expect(alocacoes).toEqual([{ tipo: 'atributo', alvo: 'invalid-json[', bonus: 3 }]);
    });
  });

  describe('parseFortalecerDanoRecuperacao', () => {
    it('deve retornar valores padrão se input for vazio', () => {
      expect(parseFortalecerDanoRecuperacao(undefined)).toEqual({
        alvo: { tipo: 'DOMINIO', dominio: 'natural' },
        bonusDescritor: ''
      });
    });

    it('deve parsear JSON de dano e recuperação corretamente', () => {
      const input = JSON.stringify({
        alvo: { tipo: 'ITEM', dominio: 'sagrado' },
        bonusDescritor: '+1d6 de Fogo'
      });
      const parsed = parseFortalecerDanoRecuperacao(input);
      expect(parsed.alvo.tipo).toBe('ITEM');
      expect(parsed.bonusDescritor).toBe('+1d6 de Fogo');
    });

    it('deve retornar default em caso de erro no parse do JSON', () => {
      const parsed = parseFortalecerDanoRecuperacao('{invalid');
      expect(parsed.alvo.tipo).toBe('DOMINIO');
    });
  });

  describe('parseFortalecerCaracteristicaItem', () => {
    it('deve retornar valores padrão se input for vazio', () => {
      expect(parseFortalecerCaracteristicaItem(undefined)).toEqual({
        alvo: { tipo: 'ITEM' }
      });
    });

    it('deve parsear JSON de característica de item corretamente', () => {
      const input = JSON.stringify({
        alvo: { tipo: 'DESARMADO' }
      });
      const parsed = parseFortalecerCaracteristicaItem(input);
      expect(parsed.alvo.tipo).toBe('DESARMADO');
    });
  });

  describe('formatarInputCustomizado', () => {
    it('deve retornar o próprio input se não for efeito fortalecer', () => {
      expect(formatarInputCustomizado('teste', 'dano')).toBe('teste');
    });

    it('deve formatar config de ações de fortalecer', () => {
      expect(formatarInputCustomizado(undefined, 'fortalecer', 'acoes', 1)).toBe('+0 Ações');
      expect(formatarInputCustomizado(undefined, 'fortalecer', 'acoes', 2)).toBe('+1 Ação');
      expect(formatarInputCustomizado(undefined, 'fortalecer', 'acoes', 6)).toBe('+2 Ações');
      expect(formatarInputCustomizado(undefined, 'fortalecer', 'acoes', 10)).toBe('+3 Ações');
    });

    it('deve formatar config de RD de fortalecer', () => {
      // grau 1: 2 * 2^0 = 2 RD
      expect(formatarInputCustomizado(undefined, 'fortalecer', 'rd', 1)).toBe('+2 RD');
      // grau 3: 2 * 2^2 = 8 RD
      expect(formatarInputCustomizado(undefined, 'fortalecer', 'rd', 3)).toBe('+8 RD');
    });

    it('deve formatar config de PE de fortalecer', () => {
      expect(formatarInputCustomizado(undefined, 'fortalecer', 'pe', 2)).toBe('+8 PE Temp');
    });

    it('deve formatar config de PV de fortalecer', () => {
      // grau 1 deve retornar "1d6 PV Temp" ou o que buscarGrauNaTabela retornar
      expect(formatarInputCustomizado(undefined, 'fortalecer', 'pv', 1)).toContain('PV Temp');
    });

    it('deve retornar Próprio Item para críticos e alcances com input vazio', () => {
      expect(formatarInputCustomizado('', 'fortalecer', 'critico-multiplicador')).toBe('Próprio Item');
      expect(formatarInputCustomizado('[]', 'fortalecer', 'critico-margem')).toBe('Próprio Item');
    });

    it('deve formatar input customizado rúnico/alocados por JSON', () => {
      const input = JSON.stringify([
        { tipo: 'atributo', alvo: 'strength', bonus: 3 }
      ]);
      expect(formatarInputCustomizado(input, 'fortalecer')).toBe('+3 FOR');
    });
  });

});
