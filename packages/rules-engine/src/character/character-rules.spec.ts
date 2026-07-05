import { describe, it, expect } from 'vitest';
import {
  getAttributeModifier,
  getAttributeRollModifier,
  hasConditionEffectOf,
  getIncomingDamageMultiplier,
  getSkillCostMultiplier,
  getGeneralDisadvantageCount,
  calculateTotalPda,
  calculateMaxPV,
  calculateMaxPE,
  calculateMaxSlots,
  calculateUsedSlots,
  getCombatStats,
  getCalamityRank,
  getUnarmedMasteryDamageDie,
  getUnarmedMasteryCriticalMargin,
  getUnarmedMasteryCriticalMultiplier,
  getUnarmedMasteryTotalPdaCost,
  validateUnarmedMastery,
  applyLevelUp,
  applyChangeLevel,
  applyDamage,
  applyHeal,
  applyTickDeathCounter,
  applyConsumeEnergy,
  applyRecoverEnergy,
  applyAddTemporaryPV,
  applyAddTemporaryPE,
  applyCondition,
  applyRemoveCondition,
  applyUpdateConditions,
  applyAddRunics,
  applySpendRunics,
  applyAddToInventory,
  applyRemoveFromInventory,
  applySetItemQuantityInInventory,
  applySpendPda,
  applyRefundPda,
  applyEquipPower,
  applyUnequipPower,
  applyEquipPowerArray,
  applyUnequipPowerArray,
  applyRemovePower,
  applyRemovePowerArray,
  applyRemoveBenefit,
  applyEquipItem,
  applyUnequipItem,
  applyRestResult,
  RulesValidationError
} from './character-rules';

// Helper para criar um personagem fake válido para os testes
function makeFakeCharacter(overrides = {}) {
  return {
    level: 1,
    attributes: {
      strength: { baseValue: 10 },
      dexterity: { baseValue: 10 },
      constitution: { baseValue: 10 },
      intelligence: { baseValue: 10 },
      wisdom: { baseValue: 10 },
      charisma: { baseValue: 10 },
      keyPhysical: 'strength',
      keyMental: 'intelligence'
    },
    skills: {
      Reflexos: { proficiencyState: 'UNTRAINED', trainingBonus: 0, extraBonus: 0 },
      Fortitude: { proficiencyState: 'UNTRAINED', trainingBonus: 0, extraBonus: 0 }
    },
    conditions: [],
    healthState: {
      currentPV: 6,
      temporaryPV: 0
    },
    energyState: {
      currentPE: 4,
      temporaryPE: 0
    },
    pdaState: {
      spentPda: 0,
      extraPda: 0
    },
    powers: [],
    powerArrays: [],
    benefits: [],
    inventory: {
      runics: 0,
      bag: []
    },
    equipmentSlots: {
      suitId: null,
      accessoryId: null,
      hands: [],
      numberOfHands: 2,
      quickAccess: []
    },
    deathState: 'ALIVE',
    deathCounter: 0,
    ...overrides
  };
}

describe('Motor de Regras de Personagem - character-rules.ts', () => {

  describe('Cálculos de Atributos e Modificadores', () => {
    it('deve calcular modificador de atributo corretamente (D&D-style)', () => {
      expect(getAttributeModifier(10)).toBe(0);
      expect(getAttributeModifier(11)).toBe(1);
      expect(getAttributeModifier(12)).toBe(1);
      expect(getAttributeModifier(13)).toBe(2);
      expect(getAttributeModifier(14)).toBe(2);
      expect(getAttributeModifier(8)).toBe(-1);
      expect(getAttributeModifier(9)).toBe(-0);
      expect(getAttributeModifier(18)).toBe(4);
    });

    it('deve calcular o modificador de rolagem de atributo incluindo bônus extras', () => {
      expect(getAttributeRollModifier({ baseValue: 12 })).toBe(1);
      expect(getAttributeRollModifier({ baseValue: 12, extraBonus: 2 })).toBe(3);
      expect(getAttributeRollModifier({ baseValue: 8, extraBonus: -1 })).toBe(-2);
    });
  });

  describe('Sistema de Condições e Multiplicadores', () => {
    it('deve identificar efeitos herdados de condições compostas', () => {
      // Condição direta
      expect(hasConditionEffectOf(['Fatigado'], 'Fatigado')).toBe(true);
      // Condição composta (Fatigado herda Fraco e Vulnerável)
      expect(hasConditionEffectOf(['Fatigado'], 'Fraco')).toBe(true);
      expect(hasConditionEffectOf(['Fatigado'], 'Vulnerável')).toBe(true);
      expect(hasConditionEffectOf(['Fatigado'], 'Lento')).toBe(false);

      // Agarrado herda Desprevenido e Imóvel
      expect(hasConditionEffectOf(['Agarrado'], 'Desprevenido')).toBe(true);
      expect(hasConditionEffectOf(['Agarrado'], 'Imóvel')).toBe(true);
    });

    it('deve dobrar o dano recebido se o personagem estiver vulnerável', () => {
      expect(getIncomingDamageMultiplier([])).toBe(1);
      expect(getIncomingDamageMultiplier(['Vulnerável'])).toBe(2);
      expect(getIncomingDamageMultiplier(['Fatigado'])).toBe(2); // Fatigado herda Vulnerável
    });

    it('deve dobrar o custo de PE de perícias se estiver alquebrado', () => {
      expect(getSkillCostMultiplier([])).toBe(1);
      expect(getSkillCostMultiplier(['Alquebrado'])).toBe(2);
    });

    it('deve calcular a quantidade de desvantagens gerais por condições', () => {
      expect(getGeneralDisadvantageCount([])).toBe(0);
      expect(getGeneralDisadvantageCount(['Abalado'])).toBe(1);
      expect(getGeneralDisadvantageCount(['Apavorado'])).toBe(3);
    });
  });

  describe('Fórmulas de Limite e Capacidade (Max PV/PE/Slots/PdA)', () => {
    it('deve calcular o PdA total por nível', () => {
      // Nível 1: 15 base + 0 nível + 0 bônus = 15
      expect(calculateTotalPda(1)).toBe(15);
      // Nível 5: 15 base + 28 nível + 7 bônus = 50
      expect(calculateTotalPda(5)).toBe(50);
    });

    it('deve calcular o PV máximo baseado no nível e modificador de constituição', () => {
      // Nível 1, mod 0: 1 * 0 + 6 = 6
      expect(calculateMaxPV(1, 0)).toBe(6);
      // Nível 5, mod 2: 5 * 2 + 6 = 16
      expect(calculateMaxPV(5, 2)).toBe(16);
      // Garante mínimo de 4 PV
      expect(calculateMaxPV(1, -5)).toBe(4);
    });

    it('deve calcular o PE máximo baseado nos modificadores chaves', () => {
      // Soma mod = 10. pe = floor(899 * sqrt(10/15000)) = floor(899 * 0.0258) = 23
      expect(calculateMaxPE(5, 5)).toBe(23);
      // Garante mínimo de 4 PE
      expect(calculateMaxPE(-5, -5)).toBe(4);
    });

    it('deve calcular o limite máximo de slots de poder', () => {
      // Modificador de int = 10. slots = floor(899 * sqrt(10/15000)) = 23
      expect(calculateMaxSlots(10)).toBe(23);
      // Garante mínimo de 4 slots
      expect(calculateMaxSlots(-5)).toBe(4);
    });
  });

  describe('Combate e Estatísticas de Defesa', () => {
    it('deve calcular dodge e blockRD corretos sob condições normais e debuffs', () => {
      const char = makeFakeCharacter({
        level: 5,
        attributes: {
          strength: { baseValue: 10 },
          dexterity: { baseValue: 14 }, // mod = +2
          constitution: { baseValue: 12 }, // mod = +1
          intelligence: { baseValue: 10 },
          wisdom: { baseValue: 10 },
          charisma: { baseValue: 10 }
        }
      });
      // Com level 5, Reflexos sem treino = baseAttributeModifier (+2) + 0 = 2.
      // Fortitude sem treino (sem extraBonus) = baseConstitution (+1) + 0 = 1.
      const stats = getCombatStats(char, 2, 1, 1);
      expect(stats.baseRD).toBe(2);
      expect(stats.dodge).toBe(2);
      expect(stats.blockRD).toBe(3); // Fortitude (1) + suitBlock (1) + shield (1) = 3
    });

    it('deve zerar esquiva e bloqueio se estiver Indefeso', () => {
      const char = makeFakeCharacter({ conditions: ['Indefeso'] });
      const stats = getCombatStats(char, 2, 2, 2);
      expect(stats.dodge).toBe(0);
      expect(stats.blockRD).toBe(0);
    });

    it('deve reduzir à metade esquiva e bloqueio se estiver Desprevenido', () => {
      const char = makeFakeCharacter({
        level: 5,
        conditions: ['Desprevenido']
      });
      // dodge base = 0. blockRD base = fortitude (0) + suitBlock (2) + shield (2) = 4.
      const stats = getCombatStats(char, 0, 2, 2);
      expect(stats.dodge).toBe(0);
      expect(stats.blockRD).toBe(2); // 4 / 2 = 2
    });
  });

  describe('Maestria Desarmada e Calamidade', () => {
    it('deve retornar a classificação de calamidade por nível', () => {
      expect(getCalamityRank(5)).toBe('Raposa');
      expect(getCalamityRank(10)).toBe('Lobo');
      expect(getCalamityRank(30)).toBe('Demônio');
      expect(getCalamityRank(250)).toBe('Deuses');
    });

    it('deve calcular dados de dano e atributos de crítico de maestria desarmada', () => {
      expect(getUnarmedMasteryDamageDie(1)).toBe('1d4');
      expect(getUnarmedMasteryDamageDie(3)).toBe('1d16');
      expect(getUnarmedMasteryCriticalMargin(2)).toBe(18);
      expect(getUnarmedMasteryCriticalMultiplier(1)).toBe(3);
    });

    it('deve calcular corretamente o custo total de PdA de maestria', () => {
      const mastery = {
        degree: 2,
        marginImprovements: 1,
        multiplierImprovements: 1,
        damageType: 'Impacto'
      };
      // Grau 2 * 7 = 14. Melhorias: 1 margin * 2 (unit) + 1 mult * 2 (unit) = 4. Tipo Impacto = 0. Total = 18
      expect(getUnarmedMasteryTotalPdaCost(mastery)).toBe(18);

      // Com tipo diferente de Impacto, soma +1
      const masteryCortante = { ...mastery, damageType: 'Cortante' };
      expect(getUnarmedMasteryTotalPdaCost(masteryCortante)).toBe(19);
    });

    it('deve validar consistência da maestria desarmada', () => {
      expect(validateUnarmedMastery({ degree: -1 })).not.toBeNull();
      expect(validateUnarmedMastery({ degree: 2, marginImprovements: 5 })).toContain('margem'); // Max degree * 2 = 4
      expect(validateUnarmedMastery({ degree: 2, multiplierImprovements: 1 })).toContain('Grau 3'); // Exige grau 3
    });
  });

  describe('Mutação de Vida (Dano, Cura e Morte)', () => {
    it('deve aplicar dano simples deduzindo dos PVs', () => {
      const char = makeFakeCharacter({ healthState: { currentPV: 10, temporaryPV: 0 } });
      const res = applyDamage(char, 4);
      expect(char.healthState.currentPV).toBe(6);
      expect(res.died).toBe(false);
    });

    it('deve deduzir dano prioritariamente dos PVs temporários', () => {
      const char = makeFakeCharacter({ healthState: { currentPV: 10, temporaryPV: 5 } });
      applyDamage(char, 4);
      expect(char.healthState.temporaryPV).toBe(1);
      expect(char.healthState.currentPV).toBe(10); // PV principal intacto
    });

    it('deve drenar PV temporário e aplicar o excedente no PV real', () => {
      const char = makeFakeCharacter({ healthState: { currentPV: 10, temporaryPV: 5 } });
      applyDamage(char, 8);
      expect(char.healthState.temporaryPV).toBe(0);
      expect(char.healthState.currentPV).toBe(7); // Drenou 5 temp e 3 real
    });

    it('deve levar personagem ao estado DYING se PV zerar', () => {
      const char = makeFakeCharacter({ healthState: { currentPV: 5, temporaryPV: 0 } });
      const res = applyDamage(char, 5);
      expect(char.healthState.currentPV).toBe(0);
      expect(char.deathState).toBe('DYING');
      expect(res.died).toBe(true);
    });

    it('deve curar respeitando o PV máximo', () => {
      const char = makeFakeCharacter({
        level: 1,
        attributes: { constitution: { baseValue: 10 } }, // mod = 0. maxPV = 6
        healthState: { currentPV: 2 }
      });
      applyHeal(char, 10);
      expect(char.healthState.currentPV).toBe(6); // travou no máximo 6
    });

    it('deve reverter o estado DYING para ALIVE ao curar', () => {
      const char = makeFakeCharacter({ healthState: { currentPV: 0 }, deathState: 'DYING' });
      applyHeal(char, 2);
      expect(char.healthState.currentPV).toBe(2);
      expect(char.deathState).toBe('ALIVE');
    });

    it('deve avançar contador de morte (DYING -> DEAD)', () => {
      const char = makeFakeCharacter({ deathState: 'DYING', deathCounter: 0 });
      let res = applyTickDeathCounter(char);
      expect(char.deathCounter).toBe(1);
      expect(res.died).toBe(false);

      applyTickDeathCounter(char); // counter = 2
      res = applyTickDeathCounter(char); // counter = 3 -> DEAD
      expect(char.deathCounter).toBe(3);
      expect(char.deathState).toBe('DEAD');
      expect(res.died).toBe(true);
    });
  });

  describe('Mutação de Energia (Consumo e Recuperação de PE)', () => {
    it('deve consumir PE simples', () => {
      const char = makeFakeCharacter({ energyState: { currentPE: 10, temporaryPE: 0 } });
      applyConsumeEnergy(char, 3);
      expect(char.energyState.currentPE).toBe(7);
    });

    it('deve consumir PE temporário prioritariamente', () => {
      const char = makeFakeCharacter({ energyState: { currentPE: 10, temporaryPE: 4 } });
      applyConsumeEnergy(char, 3);
      expect(char.energyState.temporaryPE).toBe(1);
      expect(char.energyState.currentPE).toBe(10);
    });

    it('deve lançar erro se o PE disponível (real + temp) for insuficiente', () => {
      const char = makeFakeCharacter({ energyState: { currentPE: 4, temporaryPE: 2 } });
      expect(() => applyConsumeEnergy(char, 7)).toThrow(RulesValidationError);
    });

    it('deve recuperar PE respeitando o PE máximo', () => {
      const char = makeFakeCharacter({
        attributes: {
          keyPhysical: 'strength',
          keyMental: 'intelligence',
          strength: { baseValue: 12 }, // mod = +1
          intelligence: { baseValue: 12 }, // mod = +1
          constitution: { baseValue: 10 },
          dexterity: { baseValue: 10 },
          wisdom: { baseValue: 10 },
          charisma: { baseValue: 10 }
        },
        energyState: { currentPE: 2 }
      });
      // maxPE para mod sum 2 = floor(899 * sqrt(2/15000)) = 10
      applyRecoverEnergy(char, 20);
      expect(char.energyState.currentPE).toBe(10); // limitou em 10
    });

    it('não deve recuperar PE se estiver Faminto', () => {
      const char = makeFakeCharacter({ energyState: { currentPE: 2 }, conditions: ['Faminto'] });
      applyRecoverEnergy(char, 5);
      expect(char.energyState.currentPE).toBe(2); // sem alteração
    });
  });

  describe('Evolução e Modificação de Condições', () => {
    it('deve evoluir condições duplicadas', () => {
      const char = makeFakeCharacter({ conditions: ['Abalado'] });
      // Aplicar Abalado novamente deve evoluir para Apavorado
      applyCondition(char, 'Abalado');
      expect(char.conditions).toContain('Apavorado');
      expect(char.conditions).not.toContain('Abalado');
    });

    it('deve adicionar novas condições sem evoluir as não duplicadas', () => {
      const char = makeFakeCharacter({ conditions: ['Abalado'] });
      applyCondition(char, 'Fraco');
      expect(char.conditions).toContain('Abalado');
      expect(char.conditions).toContain('Fraco');
    });
  });

  describe('Equipamento de Poderes e Limites de Slots', () => {
    it('deve equipar poder consumindo slots disponíveis', () => {
      const char = makeFakeCharacter({
        attributes: { intelligence: { baseValue: 12 } }, // slots max = 10
        powers: [{ powerId: 'p1', slotCost: 3, isEquipped: false }]
      });
      applyEquipPower(char, 'p1');
      expect(char.powers[0].isEquipped).toBe(true);
    });

    it('deve lançar erro ao equipar poder se slots forem insuficientes', () => {
      const char = makeFakeCharacter({
        attributes: { intelligence: { baseValue: 10 } }, // slots max = 4
        powers: [
          { powerId: 'p1', slotCost: 3, isEquipped: true },
          { powerId: 'p2', slotCost: 2, isEquipped: false }
        ]
      });
      expect(() => applyEquipPower(char, 'p2')).toThrow(RulesValidationError);
    });
  });

  describe('Gerenciamento de Inventário e Equipamento de Itens', () => {
    it('deve adicionar itens ao inventário', () => {
      const char = makeFakeCharacter();
      applyAddToInventory(char, 'item1', 2);
      expect(char.inventory.bag).toContainEqual({ itemId: 'item1', quantity: 2 });

      // Deve empilhar no mesmo item id
      applyAddToInventory(char, 'item1', 3);
      expect(char.inventory.bag).toContainEqual({ itemId: 'item1', quantity: 5 });
    });

    it('deve remover itens do inventário', () => {
      const char = makeFakeCharacter({
        inventory: { bag: [{ itemId: 'item1', quantity: 5 }] }
      });
      const res = applyRemoveFromInventory(char, 'item1', 3);
      expect(char.inventory.bag).toContainEqual({ itemId: 'item1', quantity: 2 });
      expect(res.discarded).toBe(false);

      // Deve deletar o item se quantidade zerar
      const res2 = applyRemoveFromInventory(char, 'item1', 2);
      expect(char.inventory.bag.length).toBe(0);
      expect(res2.discarded).toBe(true);
    });

    it('deve equipar item do inventário nos slots correspondentes', () => {
      const char = makeFakeCharacter({
        inventory: { bag: [{ itemId: 'armor1', quantity: 1 }] }
      });
      applyEquipItem(char, 'armor1', 'suit');
      expect(char.equipmentSlots.suitId).toBe('armor1');
      expect(char.inventory.bag.length).toBe(0); // tirou do inventário
    });

    it('deve retornar item anterior ao inventário se equipar outro por cima', () => {
      const char = makeFakeCharacter({
        inventory: { bag: [{ itemId: 'armor2', quantity: 1 }] },
        equipmentSlots: { suitId: 'armor1', accessoryId: null, hands: [], quickAccess: [] }
      });
      applyEquipItem(char, 'armor2', 'suit');
      expect(char.equipmentSlots.suitId).toBe('armor2');
      expect(char.inventory.bag).toContainEqual({ itemId: 'armor1', quantity: 1 });
    });
  });

  describe('Descanso (Rest Result)', () => {
    it('deve curar PV e restaurar PE no descanso', () => {
      const char = makeFakeCharacter({
        healthState: { currentPV: 2, temporaryPV: 0 },
        energyState: { currentPE: 2, temporaryPE: 0 }
      });
      applyRestResult(char, 2, 2);
      expect(char.healthState.currentPV).toBe(4);
      expect(char.energyState.currentPE).toBe(4);
    });
  });

});
