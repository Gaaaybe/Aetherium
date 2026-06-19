"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const calculate_power_cost_js_1 = require("./calculate-power-cost.js");
(0, vitest_1.describe)('calculatePowerCost pure function', () => {
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
    (0, vitest_1.it)('should calculate cost for a simple effect without modifications', () => {
        const result = (0, calculate_power_cost_js_1.calculatePowerCost)({
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
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.result?.custoTotal.pda).toBe(10);
        (0, vitest_1.expect)(result.result?.custoTotal.espacos).toBe(6);
    });
    (0, vitest_1.it)('should calculate cost with extra modification', () => {
        const result = (0, calculate_power_cost_js_1.calculatePowerCost)({
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
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.result?.custoTotal.pda).toBe(60);
    });
    (0, vitest_1.it)('should calculate cost with falha modification (reducing cost)', () => {
        const result = (0, calculate_power_cost_js_1.calculatePowerCost)({
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
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.result?.custoTotal.pda).toBe(10); // Minimum cost per grade is 1
    });
    (0, vitest_1.it)('should calculate cost for multiple effects', () => {
        const result = (0, calculate_power_cost_js_1.calculatePowerCost)({
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
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.result?.custoTotal.pda).toBe(13);
        (0, vitest_1.expect)(result.result?.custoTotal.espacos).toBe(6); // max(5, 3) + 1 = 6
    });
    (0, vitest_1.it)('should calculate cost with global modifications', () => {
        const result = (0, calculate_power_cost_js_1.calculatePowerCost)({
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
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.result?.custoTotal.pda).toBe(20);
    });
    (0, vitest_1.it)('should return error if effect base not found', () => {
        const result = (0, calculate_power_cost_js_1.calculatePowerCost)({
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
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.error).toContain('Efeito base não encontrado');
    });
    (0, vitest_1.it)('should return error if modification base not found', () => {
        const result = (0, calculate_power_cost_js_1.calculatePowerCost)({
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
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(result.error).toContain('Modificação base não encontrada');
    });
});
