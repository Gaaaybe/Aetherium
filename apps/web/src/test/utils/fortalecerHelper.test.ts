import { describe, it, expect } from 'vitest';
import {
  obterBonusFortalecerAtivos,
  obterMaximoFormulaDados,
  obterBonusVidaEnergiaFortalecer,
  obterBonusFortalecerDanoRecuperacao,
  obterBonusFortalecerRD,
  obterBonusFortalecerAcoes,
  obterBonusFortalecerCaracteristicasItem,
  obterBonusFortalecerCaracteristicasDesarmado,
  aplicarGradativoAosEfeitosDoPoder,
} from '../../features/ficha-personagem/utils/fortalecerHelper';

describe('aplicarGradativoAosEfeitosDoPoder', () => {
  it('deve aplicar o mesmo progresso global a todos os efeitos do poder', () => {
    const effects = aplicarGradativoAosEfeitosDoPoder({
      id: 'power-global',
      globalModifications: [{ modificationBaseId: 'gradativo' }],
      effects: [
        { id: 'fort-1', effectBaseId: 'fortalecer', grau: 5, modifications: [] },
        { id: 'fort-2', effectBaseId: 'fortalecer', grau: 3, modifications: [] },
      ],
    }, { 'power-global:global': 4 });

    expect(effects[0]).toMatchObject({ grau: 4, gradativoMaxDegree: 5, gradativoExcessiveSteps: 0 });
    expect(effects[1]).toMatchObject({ grau: 3, gradativoMaxDegree: 3, gradativoExcessiveSteps: 1 });
  });

  it('deve aceitar os nomes legados usados por poderes de acervos', () => {
    const effects = aplicarGradativoAosEfeitosDoPoder({
      id: 'power-legado',
      modificacoesGlobais: [{ modificacaoBaseId: 'gradativo' }],
      efeitos: [{ id: 'fort-1', efeitoBaseId: 'fortalecer', grau: 5 }],
    }, { 'power-legado:global': 3 });

    expect(effects[0]).toMatchObject({ grau: 3, gradativoMaxDegree: 5 });
  });
});

describe('obterMaximoFormulaDados', () => {
  it('deve extrair o valor máximo de fórmulas simples e complexas', () => {
    expect(obterMaximoFormulaDados('1d20')).toBe(20);
    expect(obterMaximoFormulaDados('2d6')).toBe(12);
    expect(obterMaximoFormulaDados('1d128+2')).toBe(130);
    expect(obterMaximoFormulaDados('3d8-2')).toBe(22);
    expect(obterMaximoFormulaDados('10')).toBe(10);
    expect(obterMaximoFormulaDados('+5')).toBe(5);
    expect(obterMaximoFormulaDados('-3')).toBe(-3);
    expect(obterMaximoFormulaDados('')).toBe(0);
    expect(obterMaximoFormulaDados(null as any)).toBe(0);
  });
});

describe('obterBonusFortalecerAtivos', () => {
  const charBase = {
    attributes: {
      keyPhysical: 'forca',
      keyMental: 'vontade',
      forca: { rollModifier: 3 },
      vontade: { rollModifier: 4 }
    }
  };

  it('deve retornar recordes vazios quando não há poderes ativos', () => {
    const res = obterBonusFortalecerAtivos([], charBase);
    expect(res).toEqual({ atributos: {}, pericias: {} });
  });

  it('deve calcular bônus de atributo e perícia simples', () => {
    const inputVal = JSON.stringify([
      { tipo: 'atributo', alvo: 'forca', bonus: 2 },
      { tipo: 'pericia', alvo: 'luta', bonus: 5 }
    ]);

    const activePowers = [
      {
        id: 'p-1',
        powerId: 'power-1',
        effects: [
          {
            efeitoBaseId: 'fortalecer',
            inputCustomizado: inputVal,
            grau: 1
          }
        ]
      }
    ];

    const res = obterBonusFortalecerAtivos(activePowers, charBase);
    expect(res.atributos.forca).toBe(2);
    expect(res.pericias.luta).toBe(5);
  });

  it('deve aplicar modificador de atributo com a modificação baseado-atributos', () => {
    const inputVal = JSON.stringify([
      { tipo: 'atributo', alvo: 'forca', bonus: 2 }
    ]);

    const activePowers = [
      {
        id: 'p-1',
        powerId: 'power-1',
        dominio: { name: 'fogo' }, // domínio físico
        effects: [
          {
            efeitoBaseId: 'fortalecer',
            inputCustomizado: inputVal,
            grau: 1,
            modifications: [{ modificationBaseId: 'baseado-atributos' }]
          }
        ]
      }
    ];

    // O charBase tem keyPhysical 'forca' com rollModifier: 3.
    // O bônus final deve ser bonus (2) + modAtributo (3) = 5
    const res = obterBonusFortalecerAtivos(activePowers, charBase);
    expect(res.atributos.forca).toBe(5);
  });

  it('deve usar atributo mental se o poder for espiritual', () => {
    const inputVal = JSON.stringify([
      { tipo: 'atributo', alvo: 'forca', bonus: 2 }
    ]);

    const activePowers = [
      {
        id: 'p-1',
        powerId: 'power-1',
        dominio: { name: 'sagrado' }, // domínio espiritual
        effects: [
          {
            efeitoBaseId: 'fortalecer',
            inputCustomizado: inputVal,
            grau: 1,
            modifications: [{ modificationBaseId: 'baseado-atributos' }]
          }
        ]
      }
    ];

    // O charBase tem keyMental 'vontade' com rollModifier: 4.
    // O bônus final deve ser bonus (2) + modAtributo (4) = 6
    const res = obterBonusFortalecerAtivos(activePowers, charBase);
    expect(res.atributos.forca).toBe(6);
  });

  it('deve agrupar por powerId pegando o máximo e somar entre powerIds distintos', () => {
    // p-1-a e p-1-b pertencem ao mesmo powerId ('power-1')
    // p-2 pertence a outro powerId ('power-2')
    const activePowers = [
      {
        id: 'p-1-a',
        powerId: 'power-1',
        effects: [
          {
            efeitoBaseId: 'fortalecer',
            inputCustomizado: JSON.stringify([{ tipo: 'atributo', alvo: 'forca', bonus: 2 }])
          }
        ]
      },
      {
        id: 'p-1-b',
        powerId: 'power-1',
        effects: [
          {
            efeitoBaseId: 'fortalecer',
            inputCustomizado: JSON.stringify([{ tipo: 'atributo', alvo: 'forca', bonus: 4 }])
          }
        ]
      },
      {
        id: 'p-2',
        powerId: 'power-2',
        effects: [
          {
            efeitoBaseId: 'fortalecer',
            inputCustomizado: JSON.stringify([{ tipo: 'atributo', alvo: 'forca', bonus: 3 }])
          }
        ]
      }
    ];

    // Do power-1, o max é 4.
    // Do power-2, o max é 3.
    // Soma total = 4 + 3 = 7
    const res = obterBonusFortalecerAtivos(activePowers, charBase);
    expect(res.atributos.forca).toBe(7);
  });

  it('deve reduzir proporcionalmente as alocações de um Fortalecer gradativo', () => {
    const activePowers = [{
      id: 'p-gradativo',
      effects: [{
        efeitoBaseId: 'fortalecer',
        grau: 1,
        gradativoMaxDegree: 5,
        gradativoExcessiveSteps: 0,
        inputCustomizado: JSON.stringify([
          { tipo: 'atributo', alvo: 'forca', bonus: 25 },
          { tipo: 'pericia', alvo: 'luta', bonus: 15 },
        ]),
      }],
    }];

    const res = obterBonusFortalecerAtivos(activePowers, charBase);
    expect(res.atributos.forca).toBe(2);
    expect(res.pericias.luta).toBe(1);
  });

  it('deve aplicar o excesso gradativo às alocações do grau máximo', () => {
    const activePowers = [{
      id: 'p-gradativo',
      effects: [{
        efeitoBaseId: 'fortalecer',
        grau: 5,
        gradativoMaxDegree: 5,
        gradativoExcessiveSteps: 2,
        inputCustomizado: JSON.stringify([
          { tipo: 'atributo', alvo: 'forca', bonus: 25 },
          { tipo: 'pericia', alvo: 'luta', bonus: 15 },
        ]),
      }],
    }];

    const res = obterBonusFortalecerAtivos(activePowers, charBase);
    expect(res.atributos.forca).toBe(50);
    expect(res.pericias.luta).toBe(30);
  });

  it('deve aplicar Gradativo a um Fortalecer antigo que guarda somente o nome do atributo', () => {
    const power = {
      id: 'liberacao',
      globalModifications: [{ modificationBaseId: 'gradativo' }],
      effects: [{
        id: 'fort-con',
        effectBaseId: 'fortalecer',
        configuracaoId: 'atributo',
        inputValue: 'Constituição',
        grau: 5,
        modifications: [],
      }],
    };
    const progressiveEffects = aplicarGradativoAosEfeitosDoPoder(
      power,
      { 'liberacao:global': 2 },
    );

    const res = obterBonusFortalecerAtivos([{ ...power, effects: progressiveEffects }], charBase);
    expect(res.atributos.constitution).toBe(5);
  });
});

describe('obterBonusVidaEnergiaFortalecer', () => {
  it('deve retornar zeros se não houver poderes ativos', () => {
    const res = obterBonusVidaEnergiaFortalecer([]);
    expect(res).toEqual({ maxPV: 0, maxPE: 0, tempPV: 0, tempPE: 0 });
  });

  it('deve conceder PE temporário igual a 4 * grau', () => {
    const activePowers = [
      {
        id: 'p-1',
        powerId: 'power-1',
        effects: [
          {
            efeitoBaseId: 'fortalecer',
            configuracaoSelecionada: 'pe',
            grau: 3
          }
        ]
      }
    ];

    const res = obterBonusVidaEnergiaFortalecer(activePowers);
    expect(res.tempPE).toBe(12); // 4 * 3
  });

  it('deve conceder PV temporário se isRollExempt for verdadeiro', () => {
    const activePowers = [
      {
        id: 'p-1',
        powerId: 'power-1',
        duracao: 3, // Ativado/isRollExempt
        effects: [
          {
            efeitoBaseId: 'fortalecer',
            configuracaoSelecionada: 'pv',
            grau: 1 // grau 1 na tabela universal -> dano '1d4' -> max 4
          }
        ]
      }
    ];

    const res = obterBonusVidaEnergiaFortalecer(activePowers);
    expect(res.tempPV).toBe(8);
  });
});

describe('obterBonusFortalecerDanoRecuperacao', () => {
  it('deve calcular bônus de dano de domínios correspondentes', () => {
    const activePowers = [
      {
        id: 'p-1',
        powerId: 'power-1',
        effects: [
          {
            efeitoBaseId: 'fortalecer',
            configuracaoSelecionada: 'dano',
            grau: 2, // calcularBonusFortalecer(2) -> 8
            inputCustomizado: JSON.stringify({
              alvo: { tipo: 'DOMINIO', dominio: 'ARMA_BRANCA' },
              bonusDescritor: 'Corte'
            })
          }
        ]
      }
    ];

    const source = {
      tipo: 'ARMA' as const,
      domains: ['arma-branca']
    };

    const res = obterBonusFortalecerDanoRecuperacao(activePowers, source);
    expect(res).toHaveLength(1);
    expect(res[0]).toEqual({
      formula: '+8',
      descritor: 'Corte',
      grau: 2,
      configId: 'dano'
    });
  });

  it('deve ignorar domínios que não correspondem', () => {
    const activePowers = [
      {
        id: 'p-1',
        powerId: 'power-1',
        effects: [
          {
            efeitoBaseId: 'fortalecer',
            configuracaoSelecionada: 'dano',
            grau: 2,
            inputCustomizado: JSON.stringify({
              alvo: { tipo: 'DOMINIO', dominio: 'ARMA_BRANCA' },
              bonusDescritor: 'Corte'
            })
          }
        ]
      }
    ];

    const source = {
      tipo: 'ARMA' as const,
      domains: ['fogo']
    };

    const res = obterBonusFortalecerDanoRecuperacao(activePowers, source);
    expect(res).toHaveLength(0);
  });
});

describe('obterBonusFortalecerRD', () => {
  it('deve calcular RD baseada no grau: 2 * 2^(grau-1)', () => {
    // grau 1 -> 2 * 2^0 = 2
    // grau 3 -> 2 * 2^2 = 8
    const activePowers = [
      {
        id: 'p-1',
        powerId: 'power-1',
        effects: [
          {
            efeitoBaseId: 'fortalecer',
            configuracaoSelecionada: 'rd',
            grau: 3
          }
        ]
      }
    ];

    const res = obterBonusFortalecerRD(activePowers);
    expect(res).toBe(8);
  });
});

describe('obterBonusFortalecerAcoes', () => {
  it('deve conceder ações adicionais de acordo com patamares de grau', () => {
    const activePowers = (grau: number) => [
      {
        id: 'p-1',
        powerId: 'power-1',
        effects: [
          {
            efeitoBaseId: 'fortalecer',
            configuracaoSelecionada: 'acoes',
            grau
          }
        ]
      }
    ];

    expect(obterBonusFortalecerAcoes(activePowers(1))).toBe(0);
    expect(obterBonusFortalecerAcoes(activePowers(2))).toBe(1);
    expect(obterBonusFortalecerAcoes(activePowers(5))).toBe(1);
    expect(obterBonusFortalecerAcoes(activePowers(6))).toBe(2);
    expect(obterBonusFortalecerAcoes(activePowers(9))).toBe(2);
    expect(obterBonusFortalecerAcoes(activePowers(10))).toBe(3);
  });
});

describe('obterBonusFortalecerCaracteristicasItem', () => {
  it('deve calcular bônus de crítico e alcance para o item correto', () => {
    const activePowers = [
      {
        id: 'p-1',
        powerId: 'power-1',
        originItemId: 'weapon-123',
        effects: [
          {
            efeitoBaseId: 'fortalecer',
            configuracaoSelecionada: 'critico-multiplicador',
            grau: 4, // calcularBonusCriticoMultiplicador(4) -> floor(4/2) = 2
            inputCustomizado: JSON.stringify({
              alvo: { tipo: 'ITEM' }
            })
          },
          {
            efeitoBaseId: 'fortalecer',
            configuracaoSelecionada: 'alcance',
            grau: 3, // calcularBonusAlcanceItem(3) -> 3 * 2 = 6
            inputCustomizado: JSON.stringify({
              alvo: { tipo: 'ITEM' }
            })
          }
        ]
      }
    ];

    const res = obterBonusFortalecerCaracteristicasItem(activePowers, 'weapon-123');
    expect(res.critMultiplierBonus).toBe(2);
    expect(res.alcanceBonus).toBe(6);
    expect(res.critMarginBonus).toBe(0);
  });

  it('deve ignorar itens com id diferente', () => {
    const activePowers = [
      {
        id: 'p-1',
        powerId: 'power-1',
        originItemId: 'weapon-123',
        effects: [
          {
            efeitoBaseId: 'fortalecer',
            configuracaoSelecionada: 'alcance',
            grau: 3,
            inputCustomizado: JSON.stringify({
              alvo: { tipo: 'ITEM' }
            })
          }
        ]
      }
    ];

    const res = obterBonusFortalecerCaracteristicasItem(activePowers, 'weapon-999');
    expect(res.alcanceBonus).toBe(0);
  });
});

describe('obterBonusFortalecerCaracteristicasDesarmado', () => {
  it('deve conceder bônus apenas para alvos DESARMADO', () => {
    const activePowers = [
      {
        id: 'p-1',
        powerId: 'power-1',
        effects: [
          {
            efeitoBaseId: 'fortalecer',
            configuracaoSelecionada: 'critico-margem',
            grau: 5, // calcularBonusCriticoMargem(5) -> floor(5/2) = 2
            inputCustomizado: JSON.stringify({
              alvo: { tipo: 'DESARMADO' }
            })
          }
        ]
      }
    ];

    const res = obterBonusFortalecerCaracteristicasDesarmado(activePowers);
    expect(res.critMarginBonus).toBe(2);
  });
});
