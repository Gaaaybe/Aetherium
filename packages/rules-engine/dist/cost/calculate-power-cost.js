import universalTable from './tables/universal-table.json' with { type: 'json' };
export const UNIVERSAL_TABLE = universalTable;
export function calculatePowerCost({ effects, parametros, globalModifications = [], effectBases, modificationBases, }) {
    const custoPorEfeito = {};
    let totalPdA = 0;
    const espacosPorEfeito = [];
    const pePorEfeito = [];
    const defaultParamsPerEffect = [];
    for (const appliedEffect of effects) {
        const effectBase = effectBases[appliedEffect.effectBaseId];
        if (!effectBase) {
            return {
                success: false,
                error: `Efeito base não encontrado: ${appliedEffect.effectBaseId}`,
            };
        }
        defaultParamsPerEffect.push({
            acao: effectBase.parametrosPadraoAcao,
            alcance: effectBase.parametrosPadraoAlcance,
            duracao: effectBase.parametrosPadraoDuracao,
        });
    }
    const paramsModifierByGrade = calculateGlobalParamsModifier(defaultParamsPerEffect, parametros);
    for (const appliedEffect of effects) {
        const effectBase = effectBases[appliedEffect.effectBaseId];
        if (!effectBase) {
            return {
                success: false,
                error: `Efeito base não encontrado: ${appliedEffect.effectBaseId}`,
            };
        }
        const gradeData = getUniversalGradeData(appliedEffect.grau);
        let custoPorGrauEfeito = effectBase.custoBase + paramsModifierByGrade;
        let custoFixoEfeito = 0;
        const peEfeito = gradeData.pe;
        const espacosEfeito = Math.max(0, gradeData.espacos);
        if (appliedEffect.configuracaoId && effectBase.configuracoes?.opcoes) {
            const config = effectBase.configuracoes.opcoes.find((opt) => opt.id === appliedEffect.configuracaoId);
            if (config?.modificadorCusto) {
                custoPorGrauEfeito += config.modificadorCusto;
            }
        }
        // Modificações GLOBAIS
        for (const globalMod of globalModifications) {
            const modBase = modificationBases[globalMod.modificationBaseId];
            if (!modBase) {
                return {
                    success: false,
                    error: `Modificação base não encontrada: ${globalMod.modificationBaseId}`,
                };
            }
            const grauMod = globalMod.grau ?? 1;
            const selectedConfigurationId = globalMod.parametros?.configuracaoSelecionada;
            const { custoFixo: cfGlobal, custoPorGrau: cpgGlobal } = calcularCustoComConfiguracao(modBase, selectedConfigurationId);
            custoPorGrauEfeito += cpgGlobal * grauMod;
            custoFixoEfeito += cfGlobal;
        }
        // Modificações LOCAIS
        for (const modification of appliedEffect.modifications) {
            const modBase = modificationBases[modification.modificationBaseId];
            if (!modBase) {
                return {
                    success: false,
                    error: `Modificação base não encontrada: ${modification.modificationBaseId}`,
                };
            }
            const grauMod = modification.grau ?? 1;
            const selectedConfigurationId = modification.parametros?.configuracaoSelecionada;
            const { custoFixo: cfLocal, custoPorGrau: cpgLocal } = calcularCustoComConfiguracao(modBase, selectedConfigurationId);
            custoPorGrauEfeito += cpgLocal * grauMod;
            custoFixoEfeito += cfLocal;
        }
        // custoPorGrau final não pode ser menor que 1
        custoPorGrauEfeito = Math.max(1, custoPorGrauEfeito);
        const grauParaCalculo = appliedEffect.grau < 1 ? 1 : appliedEffect.grau;
        let pdaEfeito = custoPorGrauEfeito * grauParaCalculo + custoFixoEfeito;
        pdaEfeito = Math.max(1, pdaEfeito);
        custoPorEfeito[appliedEffect.id] = {
            pda: pdaEfeito,
            pe: peEfeito,
            espacos: espacosEfeito,
        };
        totalPdA += pdaEfeito;
        espacosPorEfeito.push(espacosEfeito);
        pePorEfeito.push(peEfeito);
    }
    // Espaços e PE: maior efeito + 1 por efeito adicional
    const maiorEspacos = espacosPorEfeito.length > 0 ? Math.max(...espacosPorEfeito) : 0;
    const maiorPE = pePorEfeito.length > 0 ? Math.max(...pePorEfeito) : 0;
    const qtdEfeitosAdicionais = Math.max(0, effects.length - 1);
    let totalEspacos = maiorEspacos + qtdEfeitosAdicionais;
    let totalPE = maiorPE + qtdEfeitosAdicionais;
    const specialPEMods = [
        'custo-pe-dobrado',
        'custo-pe-total',
        'custo-pe-reduzido',
        'custo-pe-minimo',
    ];
    // Adiciona PE de extras globais
    for (const globalMod of globalModifications) {
        const modBase = modificationBases[globalMod.modificationBaseId];
        if (modBase && modBase.tipo === 'extra' && !specialPEMods.includes(globalMod.modificationBaseId)) {
            const selectedConfigurationId = globalMod.parametros?.configuracaoSelecionada;
            const { custoFixo, custoPorGrau } = calcularCustoComConfiguracao(modBase, selectedConfigurationId);
            totalPE += Math.abs(custoFixo + custoPorGrau);
        }
    }
    // Adiciona PE de extras locais
    for (const appliedEffect of effects) {
        for (const mod of appliedEffect.modifications) {
            const modBase = modificationBases[mod.modificationBaseId];
            if (modBase && modBase.tipo === 'extra' && !specialPEMods.includes(mod.modificationBaseId)) {
                const selectedConfigurationId = mod.parametros?.configuracaoSelecionada;
                const { custoFixo, custoPorGrau } = calcularCustoComConfiguracao(modBase, selectedConfigurationId);
                totalPE += Math.abs(custoFixo + custoPorGrau);
            }
        }
    }
    // Modificações globais especiais de PE e Espaços
    const getOpcao = (mod) => typeof mod.parametros?.opcao === 'string' ? mod.parametros.opcao : undefined;
    const modPEDobrado = globalModifications.find((m) => m.modificationBaseId === 'custo-pe-dobrado' && getOpcao(m) === 'PE Dobrado');
    const modPETotal = globalModifications.find((m) => m.modificationBaseId === 'custo-pe-total' && getOpcao(m) === 'Todos PE');
    const modPEReduzido = globalModifications.find((m) => m.modificationBaseId === 'custo-pe-reduzido' && getOpcao(m) === 'PE pela Metade');
    const modPEMinimo = globalModifications.find((m) => m.modificationBaseId === 'custo-pe-minimo' &&
        getOpcao(m) === 'PE Mínimo (metade - 3/efeito)');
    const modEspacosDobrado = globalModifications.find((m) => m.modificationBaseId === 'custo-pe-dobrado' && getOpcao(m) === 'Espaços Dobrados');
    const modEspacosTotal = globalModifications.find((m) => m.modificationBaseId === 'custo-pe-total' && getOpcao(m) === 'Todos Espaços');
    const modEspacosReduzido = globalModifications.find((m) => m.modificationBaseId === 'custo-pe-reduzido' && getOpcao(m) === 'Espaços pela Metade');
    const modEspacosMinimo = globalModifications.find((m) => m.modificationBaseId === 'custo-pe-minimo' && getOpcao(m) === 'Espaços Fixos (3)');
    // Aplica modificadores de PE
    if (modPEDobrado) {
        totalPE *= 2;
    }
    else if (modPETotal) {
        totalPE = pePorEfeito.reduce((acc, pe) => acc + pe, 0);
    }
    else if (modPEReduzido) {
        totalPE = Math.max(1, Math.ceil(totalPE / 2));
    }
    else if (modPEMinimo) {
        totalPE = Math.max(1, Math.floor(totalPE / 2) - 3 * effects.length);
    }
    // Aplica modificadores de Espaços
    if (modEspacosDobrado) {
        totalEspacos *= 2;
    }
    else if (modEspacosTotal) {
        totalEspacos = espacosPorEfeito.reduce((acc, e) => acc + e, 0);
    }
    else if (modEspacosReduzido) {
        totalEspacos = Math.max(1, Math.ceil(totalEspacos / 2));
    }
    else if (modEspacosMinimo) {
        totalEspacos = 3;
    }
    totalPdA = Math.max(0, totalPdA);
    totalEspacos = Math.max(0, totalEspacos);
    totalPE = Math.max(0, totalPE);
    return {
        success: true,
        result: {
            custoTotal: {
                pda: totalPdA,
                pe: totalPE,
                espacos: totalEspacos,
            },
            custoPorEfeito,
        },
    };
}
function getUniversalGradeData(grau) {
    return UNIVERSAL_TABLE.find((row) => row.grau === grau) ?? { pe: 0, espacos: 0 };
}
function calculateGlobalParamsModifier(defaultParamsPerEffect, selectedParams) {
    if (defaultParamsPerEffect.length === 0) {
        return 0;
    }
    const defaultAction = Math.min(...defaultParamsPerEffect.map((param) => param.acao));
    const defaultRange = Math.min(...defaultParamsPerEffect.map((param) => param.alcance));
    const defaultDuration = Math.min(...defaultParamsPerEffect.map((param) => param.duracao));
    return (calculateParameterModifier(defaultAction, selectedParams.acao, 'acao') +
        calculateParameterModifier(defaultRange, selectedParams.alcance, 'alcance') +
        calculateParameterModifier(defaultDuration, selectedParams.duracao, 'duracao'));
}
function calculateParameterModifier(defaultValue, selectedValue, type) {
    if (type !== 'duracao') {
        return selectedValue - defaultValue;
    }
    const normalizedDefaultDuration = defaultValue === 4 ? 3 : defaultValue;
    const normalizedSelectedDuration = selectedValue === 4 ? 3 : selectedValue;
    if (normalizedSelectedDuration === normalizedDefaultDuration) {
        return 0;
    }
    const transitionCost = {
        0: 1,
        1: 2,
        2: 3,
    };
    let modifier = 0;
    if (normalizedSelectedDuration > normalizedDefaultDuration) {
        for (let current = normalizedDefaultDuration; current < normalizedSelectedDuration; current++) {
            modifier += transitionCost[current] ?? 1;
        }
        return modifier;
    }
    for (let current = normalizedDefaultDuration; current > normalizedSelectedDuration; current--) {
        modifier -= transitionCost[current - 1] ?? 1;
    }
    return modifier;
}
function calcularCustoComConfiguracao(modBase, configuracaoId) {
    let custoFixo = modBase.custoFixo;
    let custoPorGrau = modBase.custoPorGrau;
    if (configuracaoId && modBase.configuracoes?.opcoes) {
        const config = modBase.configuracoes.opcoes.find((opt) => opt.id === configuracaoId);
        if (config) {
            if (config.modificadorCustoFixo !== undefined) {
                custoFixo += config.modificadorCustoFixo;
            }
            if (config.modificadorCusto !== undefined) {
                custoPorGrau += config.modificadorCusto;
            }
        }
    }
    return { custoFixo, custoPorGrau };
}
