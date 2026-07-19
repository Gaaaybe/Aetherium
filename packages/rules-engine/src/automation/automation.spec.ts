import { describe, expect, it } from 'vitest';
import { resolvePowerUse } from './resolve-power-use.js';
import { resolvePassiveModifiers } from './resolve-passive.js';
import { parseBehavior } from './schemas.js';
import {
  calcularBonusFortalecer,
  fortaleceAlvoMatch,
  executeFortalecerDanoRecuperacao,
  calcularBonusCriticoMultiplicador,
  calcularBonusCriticoMargem,
  calcularBonusAlcanceItem,
  parseFortalecerCaracteristicaItem,
} from './behaviors/fortalecer.behavior.js';
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

  it('usa a escala de dano de arma quando isDanoAcoplado é true', () => {
    const power = makePower({
      effects: [makeEffect({ grau: 3, behavior: { kind: 'DANO', tipoDano: 'corte' } })],
      isDanoAcoplado: true,
    });
    const [mut] = resolvePowerUse({ power, context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] } });
    // Grau 3: 4 * 2^(3-1) = 16 -> 1d16
    expect(mut).toMatchObject({ formula: '1d16' });
  });

  it('usa dadoModularizado mesmo quando isDanoAcoplado é true', () => {
    const power = makePower({
      effects: [makeEffect({ grau: 3, dadoModularizado: '2d8', behavior: { kind: 'DANO', tipoDano: 'corte' } })],
      isDanoAcoplado: true,
    });
    const [mut] = resolvePowerUse({ power, context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] } });
    expect(mut).toMatchObject({ formula: '2d8' });
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

  it('mantém recuperação de PE fixa mesmo quando a recuperação está acoplada', () => {
    const power = makePower({
      effects: [makeEffect({
        grau: 3,
        behavior: { kind: 'RECUPERACAO', recurso: 'PE', formula: 'tabela' },
      })],
      isRecuperacaoAcoplada: true,
    });

    const result = resolvePowerUse({
      power,
      context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] },
    });

    expect(result[0]).toMatchObject({
      type: 'RESTORE_PE',
      formula: '12',
    });
  });

  it('PV com formula "tabela" usa valor da tabela universal pelo grau', () => {
    const power = makePower({
      effects: [makeEffect({ grau: 5, behavior: { kind: 'RECUPERACAO', recurso: 'PV', formula: 'tabela' } })],
    });
    const [mut] = resolvePowerUse({ power, context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] } });
    expect(mut).toMatchObject({ type: 'HEAL', formula: '1d128' });
  });

  it('PE com formula "tabela" usa grau * 4', () => {
    const power = makePower({
      effects: [makeEffect({ grau: 3, behavior: { kind: 'RECUPERACAO', recurso: 'PE', formula: 'tabela' } })],
    });
    const [mut] = resolvePowerUse({ power, context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] } });
    expect(mut).toMatchObject({ type: 'RESTORE_PE', formula: '12' });
  });

  it('prioriza dadoModularizado mesmo com formula de tabela', () => {
    const power = makePower({
      effects: [makeEffect({ grau: 5, dadoModularizado: '8d16', behavior: { kind: 'RECUPERACAO', recurso: 'PV', formula: 'tabela' } })],
    });
    const [mut] = resolvePowerUse({ power, context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] } });
    expect(mut).toMatchObject({ type: 'HEAL', formula: '8d16' });
  });

  it('aplica modificador de atributo no executor de RECUPERACAO', () => {
    const powerAttr = makePower({
      effects: [
        makeEffect({
          grau: 1,
          behavior: { kind: 'RECUPERACAO', recurso: 'PV', formula: 'tabela' },
          modifications: [{ modificationBaseId: 'baseado-atributos', grau: 1, targetingEffect: 'NENHUM', casterEffect: 'NENHUM' }],
        })
      ]
    });
    const ctx = {
      ...BASE_CONTEXT,
      isEspiritual: false,
      casterState: {
        ...BASE_CONTEXT.casterState,
        keyPhysicalModifier: 3,
      }
    };
    const [mut] = resolvePowerUse({ power: powerAttr, context: ctx });
    // Grau 1 PV tabela -> 1d8, +3 physical modifier
    expect(mut).toMatchObject({ type: 'HEAL', formula: '1d8+3' });
  });

  it('usa a escala de cura de arma/acoplada quando isRecuperacaoAcoplada é true', () => {
    const power = makePower({
      effects: [makeEffect({ grau: 3, behavior: { kind: 'RECUPERACAO', recurso: 'PV', formula: 'tabela' } })],
      isRecuperacaoAcoplada: true,
    });
    const [mut] = resolvePowerUse({ power, context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] } });
    // Grau 3: 4 * 2^(3-1) = 16 -> 1d16
    expect(mut).toMatchObject({ type: 'HEAL', formula: '1d16' });
  });

  it('usa dadoModularizado mesmo quando isRecuperacaoAcoplada é true', () => {
    const power = makePower({
      effects: [makeEffect({ grau: 3, dadoModularizado: '2d8', behavior: { kind: 'RECUPERACAO', recurso: 'PV', formula: 'tabela' } })],
      isRecuperacaoAcoplada: true,
    });
    const [mut] = resolvePowerUse({ power, context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] } });
    expect(mut).toMatchObject({ type: 'HEAL', formula: '2d8' });
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

  it('PV_TEMP aplica modificador de atributo físico/mental com base no isEspiritual', () => {
    const powerAttr = makePower({
      effects: [
        makeEffect({
          grau: 1,
          behavior: { kind: 'FORTALECER', alvo: 'PV_TEMP', formula: '1d6' },
          modifications: [{ modificationBaseId: 'baseado-atributos', grau: 1, targetingEffect: 'NENHUM', casterEffect: 'NENHUM' }],
        })
      ]
    });

    // Físico (isEspiritual = false)
    const ctxFisico = {
      ...BASE_CONTEXT,
      isEspiritual: false,
      casterState: {
        ...BASE_CONTEXT.casterState,
        keyPhysicalModifier: 3,
        keyMentalModifier: 5,
      }
    };
    const mutFisico = resolvePowerUse({ power: powerAttr, context: ctxFisico });
    expect(mutFisico[0]).toMatchObject({ type: 'ADD_TEMP_PV', formula: '1d6+3' });

    // Mental/Espiritual (isEspiritual = true)
    const ctxMental = {
      ...BASE_CONTEXT,
      isEspiritual: true,
      casterState: {
        ...BASE_CONTEXT.casterState,
        keyPhysicalModifier: 3,
        keyMentalModifier: 5,
      }
    };
    const mutMental = resolvePowerUse({ power: powerAttr, context: ctxMental });
    expect(mutMental[0]).toMatchObject({ type: 'ADD_TEMP_PV', formula: '1d6+5' });
  });

  it('DANO_BONUS retorna vazio (Fase 2)', () => {
    const power = makePower({
      effects: [makeEffect({ behavior: { kind: 'FORTALECER', alvo: 'DANO_BONUS' } })],
    });
    expect(resolvePowerUse({ power, context: BASE_CONTEXT })).toHaveLength(0);
  });

  describe('Dano e Recuperação (Cálculos e Matching)', () => {
    it('calcularBonusFortalecer dobra bônus a partir de +4', () => {
      expect(calcularBonusFortalecer(1)).toBe(4);
      expect(calcularBonusFortalecer(2)).toBe(8);
      expect(calcularBonusFortalecer(3)).toBe(16);
      expect(calcularBonusFortalecer(5)).toBe(64);
      expect(calcularBonusFortalecer(10)).toBe(2048);
    });

    it('fortaleceAlvoMatch bate desarmado corretamente', () => {
      expect(fortaleceAlvoMatch({ tipo: 'DESARMADO' }, { tipo: 'DESARMADO' })).toBe(true);
      expect(fortaleceAlvoMatch({ tipo: 'DESARMADO' }, { tipo: 'ARMA', domains: ['arma-branca'] })).toBe(false);
    });

    it('fortaleceAlvoMatch bate domínios com normalização case-insensitive e de hifens/underscores', () => {
      // DOMINIO vs PODER
      expect(fortaleceAlvoMatch({ tipo: 'DOMINIO', dominio: 'ARMA_BRANCA' }, { tipo: 'PODER', dominio: 'arma-branca' })).toBe(true);
      expect(fortaleceAlvoMatch({ tipo: 'DOMINIO', dominio: 'arma-branca' }, { tipo: 'PODER', dominio: 'ARMA_BRANCA' })).toBe(true);
      expect(fortaleceAlvoMatch({ tipo: 'DOMINIO', dominio: 'natural' }, { tipo: 'PODER', dominio: 'NATURAL' })).toBe(true);

      // DOMINIO vs ARMA
      expect(fortaleceAlvoMatch(
        { tipo: 'DOMINIO', dominio: 'ARMA_BRANCA' },
        { tipo: 'ARMA', domains: ['natural', 'arma-branca'] }
      )).toBe(true);
      expect(fortaleceAlvoMatch(
        { tipo: 'DOMINIO', dominio: 'arma-branca' },
        { tipo: 'ARMA', domains: ['natural', 'ARMA_BRANCA'] }
      )).toBe(true);
      expect(fortaleceAlvoMatch(
        { tipo: 'DOMINIO', dominio: 'sacrilegio' },
        { tipo: 'ARMA', domains: ['natural', 'arma-branca'] }
      )).toBe(false);
    });

    it('executeFortalecerDanoRecuperacao calcula bônus e retorna componente correto ou null', () => {
      const config = {
        alvo: { tipo: 'DOMINIO' as const, dominio: 'ARMA_BRANCA' },
        bonusDescritor: 'Fogo',
      };

      const matched = executeFortalecerDanoRecuperacao(config, 2, { tipo: 'ARMA', domains: ['arma-branca'] });
      expect(matched).toEqual({ formula: '+8', descritor: 'Fogo' });

      const unmatched = executeFortalecerDanoRecuperacao(config, 2, { tipo: 'ARMA', domains: ['natural'] });
      expect(unmatched).toBeNull();
    });

    it('suporta tipo ITEM e compara corretamente com o id do item', () => {
      const config = {
        alvo: { tipo: 'ITEM' as const },
        bonusDescritor: 'Físico',
      };

      // Match do item de arma
      const matchedArma = executeFortalecerDanoRecuperacao(
        config,
        1,
        { tipo: 'ARMA', domains: ['arma-branca'], itemId: 'weapon-123' },
        'weapon-123'
      );
      expect(matchedArma).toEqual({ formula: '+4', descritor: 'Físico' });

      // Unmatch se o id da arma for diferente
      const unmatchedArma = executeFortalecerDanoRecuperacao(
        config,
        1,
        { tipo: 'ARMA', domains: ['arma-branca'], itemId: 'weapon-456' },
        'weapon-123'
      );
      expect(unmatchedArma).toBeNull();

      // Match do item de poder
      const matchedPoder = executeFortalecerDanoRecuperacao(
        config,
        1,
        { tipo: 'PODER', dominio: 'fogo', originItemId: 'weapon-123' },
        'weapon-123'
      );
      expect(matchedPoder).toEqual({ formula: '+4', descritor: 'Físico' });

      // Unmatch se o originItemId do poder for diferente
      const unmatchedPoder = executeFortalecerDanoRecuperacao(
        config,
        1,
        { tipo: 'PODER', dominio: 'fogo', originItemId: 'weapon-456' },
        'weapon-123'
      );
      expect(unmatchedPoder).toBeNull();
    });
  });

  describe('Características de Item (Crítico e Alcance)', () => {
    it('calcularBonusCriticoMultiplicador retorna floor(grau / 2)', () => {
      expect(calcularBonusCriticoMultiplicador(1)).toBe(0);
      expect(calcularBonusCriticoMultiplicador(2)).toBe(1);
      expect(calcularBonusCriticoMultiplicador(3)).toBe(1);
      expect(calcularBonusCriticoMultiplicador(4)).toBe(2);
      expect(calcularBonusCriticoMultiplicador(5)).toBe(2);
      expect(calcularBonusCriticoMultiplicador(6)).toBe(3);
    });

    it('calcularBonusCriticoMargem retorna floor(grau / 2)', () => {
      expect(calcularBonusCriticoMargem(1)).toBe(0);
      expect(calcularBonusCriticoMargem(2)).toBe(1);
      expect(calcularBonusCriticoMargem(3)).toBe(1);
      expect(calcularBonusCriticoMargem(4)).toBe(2);
      expect(calcularBonusCriticoMargem(5)).toBe(2);
      expect(calcularBonusCriticoMargem(6)).toBe(3);
    });

    it('calcularBonusAlcanceItem retorna grau * 2', () => {
      expect(calcularBonusAlcanceItem(1)).toBe(2);
      expect(calcularBonusAlcanceItem(2)).toBe(4);
      expect(calcularBonusAlcanceItem(5)).toBe(10);
      expect(calcularBonusAlcanceItem(10)).toBe(20);
    });

    it('parseFortalecerCaracteristicaItem parseia input JSON corretamente', () => {
      expect(parseFortalecerCaracteristicaItem('{"alvo":{"tipo":"DESARMADO"}}')).toEqual({
        alvo: { tipo: 'DESARMADO' },
      });
      expect(parseFortalecerCaracteristicaItem('{"alvo":{"tipo":"ITEM"}}')).toEqual({
        alvo: { tipo: 'ITEM' },
      });
      expect(parseFortalecerCaracteristicaItem(undefined)).toEqual({
        alvo: { tipo: 'ITEM' },
      });
      expect(parseFortalecerCaracteristicaItem('invalid')).toEqual({
        alvo: { tipo: 'ITEM' },
      });
    });
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

describe('resolvePowerUse — Descarga e Gradativo', () => {
  it('repete a rolagem completa por uso de Descarga e soma o bônus fixo uma vez', () => {
    const power = makePower({
      parametros: { acao: 1, alcance: 2, duracao: 0 }, // instantâneo
      effects: [
        makeEffect({
          grau: 1,
          behavior: { kind: 'DANO', formula: '2d8 + 4', tipoDano: 'fogo' },
          modifications: [makeMod({ modificationBaseId: 'descarga', grau: 6 })],
        }),
      ],
    });

    const mutations3x = resolvePowerUse({
      power,
      context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] },
      descargaMultiplier: 3,
    });
    expect(mutations3x[0]).toMatchObject({
      type: 'DEAL_DAMAGE',
      formula: '2d8 + 2d8 + 2d8 + 4',
    });

    const mutations6x = resolvePowerUse({
      power,
      context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] },
      descargaMultiplier: 6,
    });
    expect(mutations6x[0]).toMatchObject({
      type: 'DEAL_DAMAGE',
      formula: '2d8 + 2d8 + 2d8 + 2d8 + 2d8 + 2d8 + 4',
    });
  });

  it('repete dados modularizados sem condensá-los nem aplicar o limite entre Descargas', () => {
    const power = makePower({
      effects: [
        makeEffect({
          dadoModularizado: '8d16',
          behavior: { kind: 'DANO', tipoDano: 'fogo' },
          modifications: [makeMod({ modificationBaseId: 'descarga', grau: 3 })],
        }),
      ],
    });

    const mutations = resolvePowerUse({
      power,
      context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] },
      descargaMultiplier: 3,
    });

    expect(mutations[0]).toMatchObject({
      formula: '8d16 + 8d16 + 8d16',
    });
  });

  it('não multiplica fórmulas se a duração do poder não for instantânea (duracao > 0)', () => {
    const power = makePower({
      parametros: { acao: 1, alcance: 2, duracao: 1 }, // sustentado
      effects: [
        makeEffect({
          grau: 1,
          behavior: { kind: 'DANO', formula: '2d8 + 4', tipoDano: 'fogo' },
          modifications: [makeMod({ modificationBaseId: 'descarga', grau: 3 })],
        }),
      ],
    });

    const mutations = resolvePowerUse({
      power,
      context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] },
      descargaMultiplier: 3,
    });
    expect(mutations[0]).toMatchObject({ type: 'DEAL_DAMAGE', formula: '2d8 + 4' });
  });

  it('ignora o multiplicador quando o efeito não possui Descarga', () => {
    const power = makePower({
      effects: [
        makeEffect({
          behavior: { kind: 'DANO', formula: '2d8 + 4', tipoDano: 'fogo' },
        }),
      ],
    });

    const mutations = resolvePowerUse({
      power,
      context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] },
      descargaMultiplier: 3,
    });

    expect(mutations[0]).toMatchObject({ formula: '2d8 + 4' });
  });

  it('limita cada efeito pelo próprio grau de Descarga', () => {
    const power = makePower({
      effects: [
        makeEffect({
          id: 'damage-with-descarga',
          behavior: { kind: 'DANO', formula: '1d8 + 4', tipoDano: 'fogo' },
          modifications: [makeMod({ modificationBaseId: 'descarga', grau: 2 })],
        }),
        makeEffect({
          id: 'damage-without-descarga',
          behavior: { kind: 'DANO', formula: '1d10 + 2', tipoDano: 'frio' },
        }),
      ],
    });

    const mutations = resolvePowerUse({
      power,
      context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] },
      descargaMultiplier: 5,
    });

    expect(mutations[0]).toMatchObject({ formula: '1d8 + 1d8 + 4' });
    expect(mutations[1]).toMatchObject({ formula: '1d10 + 2' });
  });

  it('aplica Descarga global somente a Dano e Recuperação de PV', () => {
    const power = makePower({
      globalModifications: [makeMod({ modificationBaseId: 'descarga', grau: 3 })],
      effects: [
        makeEffect({
          id: 'damage',
          behavior: { kind: 'DANO', formula: '1d8', tipoDano: 'fogo' },
        }),
        makeEffect({
          id: 'heal',
          effectBaseId: 'recuperacao',
          behavior: { kind: 'RECUPERACAO', recurso: 'PV', formula: '1d6' },
        }),
        makeEffect({
          id: 'restore-energy',
          effectBaseId: 'recuperacao',
          behavior: { kind: 'RECUPERACAO', recurso: 'PE', formula: '1d6' },
        }),
      ],
    });

    const mutations = resolvePowerUse({
      power,
      context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] },
      descargaMultiplier: 3,
    });

    expect(mutations[0]).toMatchObject({ type: 'DEAL_DAMAGE', formula: '1d8 + 1d8 + 1d8' });
    expect(mutations[1]).toMatchObject({ type: 'HEAL', formula: '1d6 + 1d6 + 1d6' });
    expect(mutations[2]).toMatchObject({ type: 'RESTORE_PE', formula: '20' });
  });

  it('aplica a progressão local de Gradativo desde o grau 1', () => {
    const power = makePower({
      effects: [
        makeEffect({
          grau: 5,
          behavior: { kind: 'DANO', tipoDano: 'fogo' }, // grau 5 -> 1d128
          modifications: [makeMod({ modificationBaseId: 'gradativo' })],
        }),
      ],
    });

    const mutationsGradativo = resolvePowerUse({
      power,
      context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] },
      gradativoProgress: { effects: { 'effect-1': 2 } },
    });
    expect(mutationsGradativo[0]).toMatchObject({ formula: '1d16' });
  });

  it('soma metade da característica máxima por avanço excessivo', () => {
    const power = makePower({
      effects: [
        makeEffect({
          grau: 4,
          behavior: { kind: 'DANO', tipoDano: 'fogo' },
          modifications: [makeMod({ modificationBaseId: 'gradativo' })],
        }),
      ],
    });

    const mutation = resolvePowerUse({
      power,
      context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] },
      gradativoProgress: { effects: { 'effect-1': 14 } },
    })[0];

    expect(mutation).toMatchObject({ formula: '1d384' });
  });

  it('preserva a quantidade de dados modularizados durante o excesso', () => {
    const power = makePower({
      effects: [
        makeEffect({
          grau: 4,
          dadoModularizado: '8d8',
          behavior: { kind: 'DANO', tipoDano: 'fogo' },
          modifications: [makeMod({ modificationBaseId: 'gradativo' })],
        }),
      ],
    });

    const mutation = resolvePowerUse({
      power,
      context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] },
      gradativoProgress: { effects: { 'effect-1': 5 } },
    })[0];

    expect(mutation).toMatchObject({ formula: '8d12' });
  });

  it('usa um único progresso para Gradativo global', () => {
    const power = makePower({
      globalModifications: [makeMod({ modificationBaseId: 'gradativo' })],
      effects: [
        makeEffect({ id: 'damage', grau: 3, behavior: { kind: 'DANO', tipoDano: 'fogo' } }),
        makeEffect({ id: 'heal', effectBaseId: 'recuperacao', grau: 5, behavior: { kind: 'RECUPERACAO', recurso: 'PV', formula: 'tabela' } }),
      ],
    });

    const mutations = resolvePowerUse({
      power,
      context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] },
      gradativoProgress: { global: 2 },
    });

    expect(mutations[0]).toMatchObject({ formula: '1d16' });
    expect(mutations[1]).toMatchObject({ formula: '1d16' });
  });

  it('aplica o excesso Gradativo antes de repetir a rolagem com Descarga', () => {
    const power = makePower({
      effects: [
        makeEffect({
          grau: 4,
          behavior: { kind: 'DANO', tipoDano: 'fogo' },
          modifications: [
            makeMod({ modificationBaseId: 'gradativo' }),
            makeMod({ modificationBaseId: 'descarga', grau: 2 }),
          ],
        }),
      ],
    });

    const mutation = resolvePowerUse({
      power,
      context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] },
      gradativoProgress: { effects: { 'effect-1': 5 } },
      descargaMultiplier: 2,
    })[0];

    expect(mutation).toMatchObject({ formula: '1d96 + 1d96' });
  });

  it('aplica excesso a características numéricas lineares', () => {
    const power = makePower({
      effects: [
        makeEffect({
          effectBaseId: 'recuperacao',
          grau: 5,
          behavior: { kind: 'RECUPERACAO', recurso: 'PE', formula: 'tabela' },
          modifications: [makeMod({ modificationBaseId: 'gradativo' })],
        }),
      ],
    });

    const mutation = resolvePowerUse({
      power,
      context: { ...BASE_CONTEXT, candidateTargetIds: ['target-1'] },
      gradativoProgress: { effects: { 'effect-1': 7 } },
    })[0];

    expect(mutation).toMatchObject({ type: 'RESTORE_PE', formula: '40' });
  });
});
