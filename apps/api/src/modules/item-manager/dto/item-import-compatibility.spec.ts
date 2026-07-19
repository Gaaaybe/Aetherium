import { describe, expect, test } from 'vitest';
import { importItemBodySchema } from './item.dto';

describe('legacy item import compatibility', () => {
  test('translates an older Portuguese weapon backup', () => {
    const parsed = importItemBodySchema.parse({
      item: {
        type: 'ARMA',
        name: 'Lâmina antiga',
        description: 'Backup criado por uma versão anterior do sistema.',
        domain: 'ARMA_BRANCA',
        baseCost: '12',
        damages: [{ formula: '1D8', atributo: 'FOR', spiritual: 'não' }],
        margemCritico: '19',
        multiplicadorCritico: '3',
        range: 'NATURAL',
        empilhavel: 'não',
        poderes: [{
          name: 'Corte arcano',
          description: 'Um corte preservado em um backup antigo.',
          domain: 'ARMA_BRANCA',
          parametrosAcao: '1',
          parametrosAlcance: '1',
          parametrosDuracao: '0',
          icone: 'Sword',
          efeitos: [{ efeitoBaseId: 'dano', grau: '2', dadoModular: '2d16' }],
        }],
      },
    });

    expect(parsed.tipo).toBe('weapon');
    expect(parsed.custoBase).toBe(12);
    expect(parsed.dominios[0].name).toBe('arma-branca');
    expect(parsed.danos[0]).toMatchObject({ dado: '1d8', base: 'FOR', espiritual: false });
    expect(parsed.powers[0]).toMatchObject({
      icone: 'Sword',
      effects: [{ effectBaseId: 'dano', grau: 2, dadoModularizado: '2d16', modifications: [] }],
    });
  });

  test('keeps the item and reports recoverable unknown values', () => {
    const parsed = importItemBodySchema.parse({
      tipo: 'TIPO_REMOVIDO',
      nome: 'Relíquia',
      descricao: 'Um item vindo de uma versão desconhecida.',
      dominio: 'DOMINIO_REMOVIDO',
      custoBase: 3,
    });

    expect(parsed.tipo).toBe('general');
    expect(parsed.dominios).toEqual([{ name: 'natural' }]);
    expect(parsed.importWarnings).toHaveLength(2);
  });
});
