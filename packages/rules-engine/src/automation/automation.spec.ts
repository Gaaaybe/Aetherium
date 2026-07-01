import { describe, expect, it } from 'vitest';
import { resolvePowerUse } from './resolve-power-use.js';
import { resolvePassiveModifiers } from './resolve-passive.js';
import { parseBehavior } from './schemas.js';
import type {
  ResolvedPower,
  PowerUseContext,
  PassiveContext,
  ResolvedEffect,
  ResolvedModification,
} from './types.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_CONTEXT: PowerUseContext = {
  casterId: 'caster-1',
  sceneId: 'scene-1',
  candidateTargetIds: ['target-1', 'target-2'],
  casterState: { id: 'caster-1', keyPhysicalModifier: 2, keyMentalModifier: 1, level: 5 },
  activeMarkers: [],
};

function makeEffect(overrides: Partial<ResolvedEffect>): ResolvedEffect {
  return {
    id: 'effect-1',
    effectBaseId: 'dano',
    grau: 5,
    behavior: null,
    modifications: [],
    ...overrides,
  };
}

function makeMod(overrides: Partial<ResolvedModification>): ResolvedModification {
  return {
    modificationBaseId: 'mod-1',
    grau: 1,
    targetingEffect: 'NENHUM',
    casterEffect: 'NENHUM',
    ...overrides,
  };
}

function makePower(overrides: Partial<ResolvedPower>): ResolvedPower {
  return {
    id: 'power-1',
    parametros: { acao: 1, alcance: 2, duracao: 0 },
    effects: [],
    globalModifications: [],
    ...overrides,
  };
}

// ─── parseBehavior ────────────────────────────────────────────────────────────

describe('parseBehavior', () => {
  it('retorna null para null/undefined', () => {
    expect(parseBehavior(null)).toBeNull();
    expect(parseBehavior(undefined)).toBeNull();
  });

  it('retorna null para payload inválido', () => {
    expect(parseBehavior({ kind: 'INEXISTENTE' })).toBeNull();
    expect(parseBehavior({ kind: 'DANO' })).toBeNull(); // falta tipoDano
  });

  it('parseia DANO corretamente', () => {
    const result = parseBehavior({ kind: 'DANO', tipoDano: 'balístico' });
    expect(result).toEqual({ kind: 'DANO', tipoDano: 'balístico' });
  });

  it('parseia DANO com formula opcional', () => {
    const result = parseBehavior({ kind: 'DANO', formula: '3d6', tipoDano: 'fogo' });
    expect(result).toEqual({ kind: 'DANO', formula: '3d6', tipoDano: 'fogo' });
  });

  it('parseia MARCADOR corretamente', () => {
    const result = parseBehavior({
      kind: 'MARCADOR',
      markerId: 'laco-de-odio',
      label: 'Laço de Ódio',
      duracao: 'CENA',
      visivel: true,
    });
    expect(result).toEqual({
      kind: 'MARCADOR',
      markerId: 'laco-de-odio',
      label: 'Laço de Ódio',
      duracao: 'CENA',
      visivel: true,
    });
  });

  it('parseia NARRATIVO sem descricao', () => {
    expect(parseBehavior({ kind: 'NARRATIVO' })).toEqual({ kind: 'NARRATIVO' });
  });
});

// ─── resolvePowerUse — behaviors ativos ──────────────────────────────────────

describe('resolvePowerUse — DANO', () => {
  it('gera DEAL_DAMAGE para cada alvo candidato', () => {
    const power = makePower({
      effects: [makeEffect({ behavior: { kind: 'DANO', tipoDano: 'impacto' } })],
    });
    const mutations = resolvePowerUse({ power, context: BASE_CONTEXT });

    expect(mutations).toHaveLength(2);
    expect(mutations[0]).toMatchObject({ type: 'DEAL_DAMAGE', targetId: 'target-1', damageType: 'impacto' });
    expect(mutations[1]).toMatchObject({ type: 'DEAL_DAMAGE', targetId: 'target-2', damageType: 'impacto' });
  });

  it('usa a formula do behavior quando presente', () => {
    const power = makePower({
      effects: [makeEffect({ behavior: { kind: 'DANO', formula: '4d10', tipoDano: 'fogo' } })],
    });
    const [mut] = resolvePowerUse({ power, context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] } });
    expect(mut).toMatchObject({ formula: '4d10' });
  });

  it('usa tabela universal quando formula é undefined (grau 5 → tabela)', () => {
    const power = makePower({
      effects: [makeEffect({ grau: 5, behavior: { kind: 'DANO', tipoDano: 'corte' } })],
    });
    const [mut] = resolvePowerUse({ power, context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] } });
    // Valor real da tabela universal para grau 5
    expect(mut).toMatchObject({ formula: '1d128' });
  });

  it('prioriza dadoModularizado sobre a formula do behavior e tabela universal', () => {
    const power = makePower({
      effects: [makeEffect({ grau: 5, dadoModularizado: '8d16', behavior: { kind: 'DANO', tipoDano: 'fogo' } })],
    });
    const [mut] = resolvePowerUse({ power, context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] } });
    expect(mut).toMatchObject({ formula: '8d16' });
  });
});

describe('resolvePowerUse — RECUPERACAO', () => {
  it('gera HEAL para cada alvo quando recurso = PV', () => {
    const power = makePower({
      effects: [makeEffect({ behavior: { kind: 'RECUPERACAO', recurso: 'PV', formula: '2d6+4' } })],
    });
    const mutations = resolvePowerUse({ power, context: BASE_CONTEXT });

    expect(mutations).toHaveLength(2);
    mutations.forEach((m) => expect(m).toMatchObject({ type: 'HEAL', formula: '2d6+4' }));
  });

  it('gera RESTORE_PE quando recurso = PE', () => {
    const power = makePower({
      effects: [makeEffect({ behavior: { kind: 'RECUPERACAO', recurso: 'PE', formula: '1d4' } })],
    });
    const [mut] = resolvePowerUse({ power, context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] } });
    expect(mut.type).toBe('RESTORE_PE');
  });
});

describe('resolvePowerUse — MARCADOR', () => {
  it('gera APPLY_MARKER para cada alvo', () => {
    const power = makePower({
      id: 'laco-power',
      effects: [
        makeEffect({
          behavior: {
            kind: 'MARCADOR',
            markerId: 'laco-de-odio',
            label: 'Laço de Ódio',
            duracao: 'CENA',
            visivel: true,
          },
        }),
      ],
    });
    const mutations = resolvePowerUse({ power, context: BASE_CONTEXT });

    expect(mutations).toHaveLength(2);
    mutations.forEach((m) =>
      expect(m).toMatchObject({
        type: 'APPLY_MARKER',
        markerId: 'laco-de-odio',
        sourcePowerId: 'laco-power',
        duracao: 'CENA',
      }),
    );
  });
});

// ─── resolvePowerUse — skips ──────────────────────────────────────────────────

describe('resolvePowerUse — behaviors ignorados', () => {
  it('ignora efeito com behavior null', () => {
    const power = makePower({ effects: [makeEffect({ behavior: null })] });
    expect(resolvePowerUse({ power, context: BASE_CONTEXT })).toHaveLength(0);
  });

  it('ignora NARRATIVO', () => {
    const power = makePower({ effects: [makeEffect({ behavior: { kind: 'NARRATIVO' } })] });
    expect(resolvePowerUse({ power, context: BASE_CONTEXT })).toHaveLength(0);
  });

  it('processa GATILHO e gera REGISTER_TRIGGER', () => {
    const power = makePower({
      id: 'agonia-power',
      effects: [
        makeEffect({
          behavior: {
            kind: 'GATILHO',
            evento: 'DANO_CORPO_A_CORPO_CAUSADO',
            condicao: 'alvo.tem_marcador:laco-de-odio',
            efeitosFilhos: ['recuperacao-pv-1d4', 'recuperacao-pe-4'],
          },
        }),
      ],
    });
    const mutations = resolvePowerUse({ power, context: BASE_CONTEXT });
    expect(mutations).toHaveLength(2);
    expect(mutations[0]).toEqual({
      type: 'REGISTER_TRIGGER',
      targetId: 'target-1',
      trigger: {
        evento: 'DANO_CORPO_A_CORPO_CAUSADO',
        condicao: 'alvo.tem_marcador:laco-de-odio',
        efeitosFilhos: ['recuperacao-pv-1d4', 'recuperacao-pe-4'],
      },
      sourcePowerId: 'agonia-power',
    });
    expect(mutations[1]).toEqual({
      type: 'REGISTER_TRIGGER',
      targetId: 'target-2',
      trigger: {
        evento: 'DANO_CORPO_A_CORPO_CAUSADO',
        condicao: 'alvo.tem_marcador:laco-de-odio',
        efeitosFilhos: ['recuperacao-pv-1d4', 'recuperacao-pe-4'],
      },
      sourcePowerId: 'agonia-power',
    });
  });

  it('ignora behaviors passivos no pipeline ON_USE', () => {
    const power = makePower({
      effects: [
        makeEffect({ behavior: { kind: 'BONUS_ROLAGEM', rollType: 'ATAQUE', value: 3, isAdvantage: false } }),
        makeEffect({ behavior: { kind: 'MODIFICADOR_RECURSO', recurso: 'PE', formula: '10' } }),
      ],
    });
    expect(resolvePowerUse({ power, context: BASE_CONTEXT })).toHaveLength(0);
  });
});

// ─── resolvePowerUse — targeting ─────────────────────────────────────────────

describe('resolvePowerUse — targeting LIMITADO', () => {
  it('filtra apenas alvos que possuem o marcador do caster', () => {
    const ctxComMarcador: PowerUseContext = {
      ...BASE_CONTEXT,
      activeMarkers: [
        { markerId: 'laco-de-odio', sourceId: 'caster-1', targetId: 'target-1' },
        // target-2 não tem o marcador
      ],
    };

    const power = makePower({
      effects: [
        makeEffect({
          behavior: { kind: 'DANO', tipoDano: 'sombrio' },
          modifications: [
            makeMod({ targetingEffect: 'LIMITADO', markerCondition: 'laco-de-odio' }),
          ],
        }),
      ],
    });

    const mutations = resolvePowerUse({ power, context: ctxComMarcador });
    expect(mutations).toHaveLength(1);
    expect(mutations[0]).toMatchObject({ targetId: 'target-1' });
  });

  it('retorna vazio se nenhum alvo tem o marcador', () => {
    const power = makePower({
      effects: [
        makeEffect({
          behavior: { kind: 'DANO', tipoDano: 'sombrio' },
          modifications: [makeMod({ targetingEffect: 'LIMITADO', markerCondition: 'laco-de-odio' })],
        }),
      ],
    });
    // BASE_CONTEXT não tem activeMarkers
    expect(resolvePowerUse({ power, context: BASE_CONTEXT })).toHaveLength(0);
  });

  it('não usa marcadores de outro caster', () => {
    const ctxOutroCaster: PowerUseContext = {
      ...BASE_CONTEXT,
      activeMarkers: [
        { markerId: 'laco-de-odio', sourceId: 'outro-caster', targetId: 'target-1' },
      ],
    };
    const power = makePower({
      effects: [
        makeEffect({
          behavior: { kind: 'DANO', tipoDano: 'sombrio' },
          modifications: [makeMod({ targetingEffect: 'LIMITADO', markerCondition: 'laco-de-odio' })],
        }),
      ],
    });
    expect(resolvePowerUse({ power, context: ctxOutroCaster })).toHaveLength(0);
  });
});

describe('resolvePowerUse — targeting SELETIVO', () => {
  it('filtra apenas os alvos selecionados pelo jogador', () => {
    const power = makePower({
      effects: [
        makeEffect({
          behavior: { kind: 'DANO', tipoDano: 'impacto' },
          modifications: [makeMod({ targetingEffect: 'SELETIVO' })],
        }),
      ],
    });
    const mutations = resolvePowerUse({
      power,
      context: BASE_CONTEXT,
      selectedTargetIds: ['target-1'],
    });
    expect(mutations).toHaveLength(1);
    expect(mutations[0]).toMatchObject({ targetId: 'target-1' });
  });
});

// ─── resolvePowerUse — efeito colateral ──────────────────────────────────────

describe('resolvePowerUse — efeito colateral', () => {
  it('EFEITO_COLATERAL_SEMPRE aplica independente de attackSucceeded', () => {
    const power = makePower({
      effects: [makeEffect({ behavior: { kind: 'DANO', tipoDano: 'fogo' } })],
      globalModifications: [makeMod({ casterEffect: 'EFEITO_COLATERAL_SEMPRE' })],
      colateralFormula: '1d6',
    });

    const mutations = resolvePowerUse({ power, context: { ...BASE_CONTEXT, attackSucceeded: true } });
    const colateral = mutations.find((m) => m.type === 'DEAL_DAMAGE' && 'isSelfInflicted' in m);
    expect(colateral).toMatchObject({ targetId: 'caster-1', isSelfInflicted: true, formula: '1d6' });
  });

  it('EFEITO_COLATERAL_AO_FALHAR dispara apenas quando attackSucceeded = false', () => {
    const power = makePower({
      effects: [makeEffect({ behavior: { kind: 'DANO', tipoDano: 'fogo' } })],
      globalModifications: [makeMod({ casterEffect: 'EFEITO_COLATERAL_AO_FALHAR' })],
    });

    // Acertou — sem colateral
    const mutsAcertou = resolvePowerUse({ power, context: { ...BASE_CONTEXT, attackSucceeded: true } });
    expect(mutsAcertou.some((m) => 'isSelfInflicted' in m)).toBe(false);

    // Falhou — com colateral
    const mutsFalhou = resolvePowerUse({ power, context: { ...BASE_CONTEXT, attackSucceeded: false } });
    expect(mutsFalhou.some((m) => 'isSelfInflicted' in m)).toBe(true);
  });

  it('EFEITO_COLATERAL_AO_FALHAR com attackSucceeded undefined não dispara (seguro para Fase 1)', () => {
    const power = makePower({
      effects: [makeEffect({ behavior: { kind: 'DANO', tipoDano: 'fogo' } })],
      globalModifications: [makeMod({ casterEffect: 'EFEITO_COLATERAL_AO_FALHAR' })],
    });
    // context sem attackSucceeded
    const mutations = resolvePowerUse({ power, context: BASE_CONTEXT });
    expect(mutations.some((m) => 'isSelfInflicted' in m)).toBe(false);
  });

  it('usa formula default 2d8 quando colateralFormula não especificada', () => {
    const power = makePower({
      effects: [],
      globalModifications: [makeMod({ casterEffect: 'EFEITO_COLATERAL_SEMPRE' })],
    });
    const [colateral] = resolvePowerUse({ power, context: BASE_CONTEXT });
    expect(colateral).toMatchObject({ formula: '2d8' });
  });
});

// ─── resolvePassiveModifiers ──────────────────────────────────────────────────

describe('resolvePassiveModifiers', () => {
  it('retorna vazio quando não há fontes passivas', () => {
    const ctx: PassiveContext = {
      characterId: 'char-1',
      equippedPassivePowers: [],
      activeConditions: [],
      activeBenefits: [],
    };
    expect(resolvePassiveModifiers(ctx)).toHaveLength(0);
  });

  it('converte BONUS_ROLAGEM de poder passivo', () => {
    const ctx: PassiveContext = {
      characterId: 'char-1',
      equippedPassivePowers: [
        {
          powerId: 'power-passivo',
          effectId: 'eff-1',
          behavior: { kind: 'BONUS_ROLAGEM', rollType: 'ATAQUE_DISTANCIA', value: 3, isAdvantage: false },
        },
      ],
      activeConditions: [],
      activeBenefits: [],
    };
    const [mod] = resolvePassiveModifiers(ctx);
    expect(mod).toEqual({
      kind: 'ROLL_BONUS',
      rollType: 'ATAQUE_DISTANCIA',
      value: 3,
      isAdvantage: false,
      sourceId: 'power-passivo',
    });
  });

  it('converte MODIFICADOR_RECURSO de benefício', () => {
    const ctx: PassiveContext = {
      characterId: 'char-1',
      equippedPassivePowers: [],
      activeConditions: [],
      activeBenefits: [
        {
          benefitId: 'beneficio-vigor',
          behavior: { kind: 'MODIFICADOR_RECURSO', recurso: 'PV', formula: '10' },
        },
      ],
    };
    const [mod] = resolvePassiveModifiers(ctx);
    expect(mod).toEqual({ kind: 'RESOURCE_MAX_MODIFIER', recurso: 'PV', formula: '10', sourceId: 'beneficio-vigor' });
  });

  it('converte MODIFICADOR_MOVIMENTO', () => {
    const ctx: PassiveContext = {
      characterId: 'char-1',
      equippedPassivePowers: [
        {
          powerId: 'power-lento',
          effectId: 'eff-lento',
          behavior: { kind: 'MODIFICADOR_MOVIMENTO', multiplier: 0.5 },
        },
      ],
      activeConditions: [],
      activeBenefits: [],
    };
    const [mod] = resolvePassiveModifiers(ctx);
    expect(mod).toEqual({ kind: 'MOVEMENT_MODIFIER', multiplier: 0.5, sourceId: 'power-lento' });
  });

  it('combina fontes de poderes e benefícios', () => {
    const ctx: PassiveContext = {
      characterId: 'char-1',
      equippedPassivePowers: [
        {
          powerId: 'power-a',
          effectId: 'eff-a',
          behavior: { kind: 'BLOQUEIO_RECUPERACAO', recurso: 'PE' },
        },
      ],
      activeConditions: ['Abalado'], // string pura — não afeta saída
      activeBenefits: [
        {
          benefitId: 'ben-b',
          behavior: { kind: 'BONUS_ROLAGEM', rollType: 'PERICIA_REFLEXOS', value: 2, isAdvantage: true },
        },
      ],
    };
    const mods = resolvePassiveModifiers(ctx);
    expect(mods).toHaveLength(2);
    expect(mods[0]).toMatchObject({ kind: 'BLOCK_RESOURCE_RECOVERY', recurso: 'PE' });
    expect(mods[1]).toMatchObject({ kind: 'ROLL_BONUS', sourceId: 'ben-b' });
  });
});

// ─── Novos behaviors: FORTALECER e APLICAR_CONDICAO ──────────────────────────

describe('FORTALECER behavior', () => {
  it('PV_TEMP usa fórmula da tabela universal pelo grau', () => {
    const power = makePower({
      effects: [makeEffect({ grau: 5, behavior: { kind: 'FORTALECER', alvo: 'PV_TEMP' } })],
    });
    const mutations = resolvePowerUse({ power, context: BASE_CONTEXT });
    expect(mutations).toHaveLength(2);
    expect(mutations[0]).toMatchObject({ type: 'ADD_TEMP_PV', targetId: 'target-1', formula: '1d128' });
    expect(mutations[1]).toMatchObject({ type: 'ADD_TEMP_PV', targetId: 'target-2', formula: '1d128' });
  });

  it('PV_TEMP usa formula customizada quando fornecida', () => {
    const power = makePower({
      effects: [makeEffect({ grau: 1, behavior: { kind: 'FORTALECER', alvo: 'PV_TEMP', formula: '2d6' } })],
    });
    const mutations = resolvePowerUse({ power, context: BASE_CONTEXT });
    expect(mutations[0]).toMatchObject({ type: 'ADD_TEMP_PV', formula: '2d6' });
  });

  it('PE_TEMP usa fórmula grau × 4', () => {
    const power = makePower({
      effects: [makeEffect({ grau: 3, behavior: { kind: 'FORTALECER', alvo: 'PE_TEMP' } })],
    });
    const mutations = resolvePowerUse({ power, context: BASE_CONTEXT });
    expect(mutations).toHaveLength(2);
    expect(mutations[0]).toMatchObject({ type: 'ADD_TEMP_PE', formula: '12' }); // 3 × 4
  });

  it('DANO_BONUS retorna vazio (Fase 2)', () => {
    const power = makePower({
      effects: [makeEffect({ behavior: { kind: 'FORTALECER', alvo: 'DANO_BONUS' } })],
    });
    expect(resolvePowerUse({ power, context: BASE_CONTEXT })).toHaveLength(0);
  });
});

describe('APLICAR_CONDICAO behavior (afligir)', () => {
  it('gera APPLY_CONDITION para cada alvo', () => {
    const power = makePower({
      effects: [
        makeEffect({
          grau: 3,
          behavior: { kind: 'APLICAR_CONDICAO', condicaoId: 'Lento', patamar: 2 },
        }),
      ],
    });
    const mutations = resolvePowerUse({ power, context: BASE_CONTEXT });
    expect(mutations).toHaveLength(2);
    expect(mutations[0]).toEqual({ type: 'APPLY_CONDITION', targetId: 'target-1', condicaoId: 'Lento' });
    expect(mutations[1]).toEqual({ type: 'APPLY_CONDITION', targetId: 'target-2', condicaoId: 'Lento' });
  });
});

describe('modificação baseado-atributos no executor DANO', () => {
  it('soma keyPhysicalModifier positivo à fórmula', () => {
    // BASE_CONTEXT.casterState.keyPhysicalModifier = 2
    const power = makePower({
      effects: [
        makeEffect({
          grau: 5,
          behavior: { kind: 'DANO', tipoDano: 'impacto' },
          modifications: [makeMod({ modificationBaseId: 'baseado-atributos' })],
        }),
      ],
    });
    const mutations = resolvePowerUse({ power, context: BASE_CONTEXT });
    expect(mutations[0]).toMatchObject({ type: 'DEAL_DAMAGE', formula: '1d128+2' });
  });

  it('não altera fórmula quando keyPhysicalModifier é 0', () => {
    const contextNeutral = {
      ...BASE_CONTEXT,
      casterState: { ...BASE_CONTEXT.casterState, keyPhysicalModifier: 0 },
    };
    const power = makePower({
      effects: [
        makeEffect({
          grau: 5,
          behavior: { kind: 'DANO', tipoDano: 'impacto' },
          modifications: [makeMod({ modificationBaseId: 'baseado-atributos' })],
        }),
      ],
    });
    const mutations = resolvePowerUse({ power, context: contextNeutral });
    expect(mutations[0]).toMatchObject({ formula: '1d128' });
  });

  it('sem modificação baseado-atributos não altera fórmula', () => {
    const power = makePower({
      effects: [makeEffect({ grau: 5, behavior: { kind: 'DANO', tipoDano: 'impacto' } })],
    });
    const mutations = resolvePowerUse({ power, context: BASE_CONTEXT });
    expect(mutations[0]).toMatchObject({ formula: '1d128' }); // sem +2
  });
});

