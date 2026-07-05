import { describe, expect, it } from 'vitest';
import { calculatePowerCost } from './calculate-power-cost.js';
import type { EffectBaseCatalogItem, ModificationBaseCatalogItem } from './calculate-power-cost.js';

describe('calculatePowerCost pure function', () => {
  const effectBases: Record<string, EffectBaseCatalogItem> = {
    dano: {
      id: 'dano',
      nome: 'Dano',
      custoBase: 1,
      parametrosPadraoAcao: 2,
      parametrosPadraoAlcance: 1,
      parametrosPadraoDuracao: 0,
    },
    protecao: {
      id: 'protecao',
      nome: 'Proteção',
      custoBase: 1,
      parametrosPadraoAcao: 2,
      parametrosPadraoAlcance: 1,
      parametrosPadraoDuracao: 0,
    },
  };

  const modificationBases: Record<string, ModificationBaseCatalogItem> = {
    area: {
      id: 'area',
      nome: 'Área',
      tipo: 'extra',
      custoFixo: 0,
      custoPorGrau: 1,
    },
    'alcance-limitado': {
      id: 'alcance-limitado',
      nome: 'Alcance Limitado',
      tipo: 'falha',
      custoFixo: 0,
      custoPorGrau: -1,
    },
    sutil: {
      id: 'sutil',
      nome: 'Sutil',
      tipo: 'extra',
      custoFixo: 0,
      custoPorGrau: 1,
    },
  };

  it('should calculate cost for a simple effect without modifications', () => {
    const result = calculatePowerCost({
      effects: [
        {
          id: 'applied-dano',
          effectBaseId: 'dano',
          grau: 10,
          modifications: [],
        },
      ],
      parametros: { acao: 2, alcance: 1, duracao: 0 },
      effectBases,
      modificationBases,
    });

    expect(result.success).toBe(true);
    expect(result.result?.custoTotal.pda).toBe(10);
    expect(result.result?.custoTotal.espacos).toBe(6);
  });

  it('should calculate cost with extra modification', () => {
    const result = calculatePowerCost({
      effects: [
        {
          id: 'applied-dano',
          effectBaseId: 'dano',
          grau: 10,
          modifications: [
            {
              modificationBaseId: 'area',
              grau: 5,
            },
          ],
        },
      ],
      parametros: { acao: 2, alcance: 1, duracao: 0 },
      effectBases,
      modificationBases,
    });

    expect(result.success).toBe(true);
    expect(result.result?.custoTotal.pda).toBe(60);
  });

  it('should calculate cost with falha modification (reducing cost)', () => {
    const result = calculatePowerCost({
      effects: [
        {
          id: 'applied-dano',
          effectBaseId: 'dano',
          grau: 10,
          modifications: [
            {
              modificationBaseId: 'alcance-limitado',
              grau: 1,
            },
          ],
        },
      ],
      parametros: { acao: 2, alcance: 1, duracao: 0 },
      effectBases,
      modificationBases,
    });

    expect(result.success).toBe(true);
    expect(result.result?.custoTotal.pda).toBe(10); // Minimum cost per grade is 1
  });

  it('should calculate cost for multiple effects', () => {
    const result = calculatePowerCost({
      effects: [
        {
          id: 'dano-effect',
          effectBaseId: 'dano',
          grau: 8,
          modifications: [],
        },
        {
          id: 'protecao-effect',
          effectBaseId: 'protecao',
          grau: 5,
          modifications: [],
        },
      ],
      parametros: { acao: 2, alcance: 1, duracao: 0 },
      effectBases,
      modificationBases,
    });

    expect(result.success).toBe(true);
    expect(result.result?.custoTotal.pda).toBe(13);
    expect(result.result?.custoTotal.espacos).toBe(6); // max(5, 3) + 1 = 6
  });

  it('should calculate cost with global modifications', () => {
    const result = calculatePowerCost({
      effects: [
        {
          id: 'applied-dano',
          effectBaseId: 'dano',
          grau: 10,
          modifications: [],
        },
      ],
      parametros: { acao: 2, alcance: 1, duracao: 0 },
      globalModifications: [
        {
          modificationBaseId: 'sutil',
          grau: 1,
        },
      ],
      effectBases,
      modificationBases,
    });

    expect(result.success).toBe(true);
    expect(result.result?.custoTotal.pda).toBe(20);
  });

  it('should return error if effect base not found', () => {
    const result = calculatePowerCost({
      effects: [
        {
          id: 'applied-dano',
          effectBaseId: 'inexistente',
          grau: 10,
          modifications: [],
        },
      ],
      parametros: { acao: 2, alcance: 1, duracao: 0 },
      effectBases,
      modificationBases,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Efeito base não encontrado');
  });

  it('should return error if modification base not found', () => {
    const result = calculatePowerCost({
      effects: [
        {
          id: 'applied-dano',
          effectBaseId: 'dano',
          grau: 10,
          modifications: [
            {
              modificationBaseId: 'inexistente',
              grau: 1,
            },
          ],
        },
      ],
      parametros: { acao: 2, alcance: 1, duracao: 0 },
      effectBases,
      modificationBases,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Modificação base não encontrada');
  });

  describe('special PE and Espaços modifications', () => {
    const specialModificationBases = {
      ...modificationBases,
      'custo-pe-dobrado': {
        id: 'custo-pe-dobrado',
        nome: 'PE/Espaços Dobrado',
        tipo: 'extra' as const,
        custoFixo: 0,
        custoPorGrau: 0,
      },
      'custo-pe-total': {
        id: 'custo-pe-total',
        nome: 'Todos PE/Espaços',
        tipo: 'extra' as const,
        custoFixo: 0,
        custoPorGrau: 0,
      },
      'custo-pe-reduzido': {
        id: 'custo-pe-reduzido',
        nome: 'PE/Espaços pela Metade',
        tipo: 'extra' as const,
        custoFixo: 0,
        custoPorGrau: 0,
      },
      'custo-pe-minimo': {
        id: 'custo-pe-minimo',
        nome: 'PE/Espaços Mínimo',
        tipo: 'extra' as const,
        custoFixo: 0,
        custoPorGrau: 0,
      },
    };

    it('should double PE and Espaços when costing PE/Espaços Dobrado', () => {
      // 2 effects: grade 2 (PE: 2, Espacos: 2) & grade 3 (PE: 3, Espacos: 2)
      // Normal PE = max(2, 3) + 1 = 4. Normal Espacos = max(2, 2) + 1 = 3.
      const resultPE = calculatePowerCost({
        effects: [
          { id: 'e1', effectBaseId: 'dano', grau: 2, modifications: [] },
          { id: 'e2', effectBaseId: 'dano', grau: 3, modifications: [] },
        ],
        parametros: { acao: 2, alcance: 1, duracao: 0 },
        globalModifications: [
          {
            modificationBaseId: 'custo-pe-dobrado',
            grau: 1,
            parametros: { opcao: 'PE Dobrado' },
          },
        ],
        effectBases,
        modificationBases: specialModificationBases,
      });

      expect(resultPE.result?.custoTotal.pe).toBe(8); // 4 * 2

      const resultEspacos = calculatePowerCost({
        effects: [
          { id: 'e1', effectBaseId: 'dano', grau: 2, modifications: [] },
          { id: 'e2', effectBaseId: 'dano', grau: 3, modifications: [] },
        ],
        parametros: { acao: 2, alcance: 1, duracao: 0 },
        globalModifications: [
          {
            modificationBaseId: 'custo-pe-dobrado',
            grau: 1,
            parametros: { opcao: 'Espaços Dobrados' },
          },
        ],
        effectBases,
        modificationBases: specialModificationBases,
      });

      expect(resultEspacos.result?.custoTotal.espacos).toBe(6); // 3 * 2
    });

    it('should calculate sum of PE / Espaços when costing Todos PE/Espaços', () => {
      const resultPE = calculatePowerCost({
        effects: [
          { id: 'e1', effectBaseId: 'dano', grau: 2, modifications: [] },
          { id: 'e2', effectBaseId: 'dano', grau: 3, modifications: [] },
        ],
        parametros: { acao: 2, alcance: 1, duracao: 0 },
        globalModifications: [
          {
            modificationBaseId: 'custo-pe-total',
            grau: 1,
            parametros: { opcao: 'Todos PE' },
          },
        ],
        effectBases,
        modificationBases: specialModificationBases,
      });

      expect(resultPE.result?.custoTotal.pe).toBe(5); // 2 + 3

      const resultEspacos = calculatePowerCost({
        effects: [
          { id: 'e1', effectBaseId: 'dano', grau: 2, modifications: [] },
          { id: 'e2', effectBaseId: 'dano', grau: 3, modifications: [] },
        ],
        parametros: { acao: 2, alcance: 1, duracao: 0 },
        globalModifications: [
          {
            modificationBaseId: 'custo-pe-total',
            grau: 1,
            parametros: { opcao: 'Todos Espaços' },
          },
        ],
        effectBases,
        modificationBases: specialModificationBases,
      });

      expect(resultEspacos.result?.custoTotal.espacos).toBe(4); // 2 + 2
    });

    it('should halve PE / Espaços when costing PE/Espaços pela Metade', () => {
      const resultPE = calculatePowerCost({
        effects: [
          { id: 'e1', effectBaseId: 'dano', grau: 2, modifications: [] },
          { id: 'e2', effectBaseId: 'dano', grau: 3, modifications: [] },
        ],
        parametros: { acao: 2, alcance: 1, duracao: 0 },
        globalModifications: [
          {
            modificationBaseId: 'custo-pe-reduzido',
            grau: 1,
            parametros: { opcao: 'PE pela Metade' },
          },
        ],
        effectBases,
        modificationBases: specialModificationBases,
      });

      expect(resultPE.result?.custoTotal.pe).toBe(2); // ceil(4 / 2)

      const resultEspacos = calculatePowerCost({
        effects: [
          { id: 'e1', effectBaseId: 'dano', grau: 2, modifications: [] },
          { id: 'e2', effectBaseId: 'dano', grau: 3, modifications: [] },
        ],
        parametros: { acao: 2, alcance: 1, duracao: 0 },
        globalModifications: [
          {
            modificationBaseId: 'custo-pe-reduzido',
            grau: 1,
            parametros: { opcao: 'Espaços pela Metade' },
          },
        ],
        effectBases,
        modificationBases: specialModificationBases,
      });

      expect(resultEspacos.result?.custoTotal.espacos).toBe(2); // ceil(3 / 2)
    });

    it('should reduce to PE Mínimo or Espaços Fixos (3) when costing PE/Espaços Mínimo', () => {
      const resultPE = calculatePowerCost({
        effects: [
          { id: 'e1', effectBaseId: 'dano', grau: 2, modifications: [] },
          { id: 'e2', effectBaseId: 'dano', grau: 3, modifications: [] },
        ],
        parametros: { acao: 2, alcance: 1, duracao: 0 },
        globalModifications: [
          {
            modificationBaseId: 'custo-pe-minimo',
            grau: 1,
            parametros: { opcao: 'PE Mínimo (metade - 3/efeito)' },
          },
        ],
        effectBases,
        modificationBases: specialModificationBases,
      });

      // floor(4 / 2) - 3 * 2 = 2 - 6 = -4. Enforced minimum is 1.
      expect(resultPE.result?.custoTotal.pe).toBe(1);

      const resultEspacos = calculatePowerCost({
        effects: [
          { id: 'e1', effectBaseId: 'dano', grau: 2, modifications: [] },
          { id: 'e2', effectBaseId: 'dano', grau: 3, modifications: [] },
        ],
        parametros: { acao: 2, alcance: 1, duracao: 0 },
        globalModifications: [
          {
            modificationBaseId: 'custo-pe-minimo',
            grau: 1,
            parametros: { opcao: 'Espaços Fixos (3)' },
          },
        ],
        effectBases,
        modificationBases: specialModificationBases,
      });

      expect(resultEspacos.result?.custoTotal.espacos).toBe(3);
    });
  });

  describe('edge case: grade < 1', () => {
    it('should use grade 1 for calculation when grade is less than 1', () => {
      const resultZero = calculatePowerCost({
        effects: [
          {
            id: 'applied-dano',
            effectBaseId: 'dano',
            grau: 0,
            modifications: [],
          },
        ],
        parametros: { acao: 2, alcance: 1, duracao: 0 },
        effectBases,
        modificationBases,
      });

      expect(resultZero.success).toBe(true);
      // custoBase (1) * max(1, grau) (1) + custoFixo (0) = 1
      expect(resultZero.result?.custoTotal.pda).toBe(1);

      const resultNegative = calculatePowerCost({
        effects: [
          {
            id: 'applied-dano',
            effectBaseId: 'dano',
            grau: -3,
            modifications: [],
          },
        ],
        parametros: { acao: 2, alcance: 1, duracao: 0 },
        effectBases,
        modificationBases,
      });

      expect(resultNegative.success).toBe(true);
      expect(resultNegative.result?.custoTotal.pda).toBe(1);
    });
  });
});
