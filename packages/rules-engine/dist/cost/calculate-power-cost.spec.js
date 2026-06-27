import { describe, expect, it } from 'vitest';
import { calculatePowerCost } from './calculate-power-cost.js';
describe('calculatePowerCost pure function', () => {
    const effectBases = {
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
    const modificationBases = {
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
});
