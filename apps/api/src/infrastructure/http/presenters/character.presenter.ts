import {
  Character,
  calculateMaxPE,
  calculateMaxPV,
  calculateMaxSlots,
  calculateTotalPda,
  calculateUsedSlots,
  getAttributeModifier,
  getAttributeRollModifier,
  getCalamityRank,
  getCombatStats,
  getEfficiencyBonus,
  getUnarmedMasteryCriticalMargin,
  getUnarmedMasteryCriticalMultiplier,
  getUnarmedMasteryDamageDie,
  getUnarmedMasteryTotalPdaCost,
} from '@aetherium/rules-engine';

export class CharacterPresenter {
  static toHTTP(character: Character, peculiarities: any[] = [], items: any[] = []) {
    let suitRD = 0;
    const suitBlockRD = 0;
    let handsBlockRD = 0;

    const equipment = character.equipmentSlots;

    // 1. Procurar Traje equipado
    if (equipment.suitId) {
      const suitItem = items.find((i) => i.id.toString() === equipment.suitId);
      if (
        suitItem &&
        (suitItem.tipo === 'DEFENSIVE_EQUIPMENT' || suitItem.tipo === 'defensive-equipment')
      ) {
        const upgradeLevel = suitItem.upgradeLevelValue ?? suitItem.upgradeLevel ?? 0;
        const baseRD = suitItem.baseRD ?? 2;
        const rdAtual = suitItem.rdAtual ?? baseRD * 2 ** upgradeLevel;
        const tipoEquipamento = suitItem.tipoEquipamento;
        if (tipoEquipamento === 'TRAJE' || tipoEquipamento === 'traje') {
          suitRD = rdAtual;
        }
      }
    }

    // 2. Procurar Proteções nas mãos
    const hands = equipment.hands || [];
    hands.forEach((h) => {
      const handItem = items.find((i) => i.id.toString() === h.itemId);
      if (
        handItem &&
        (handItem.tipo === 'DEFENSIVE_EQUIPMENT' || handItem.tipo === 'defensive-equipment')
      ) {
        const upgradeLevel = handItem.upgradeLevelValue ?? handItem.upgradeLevel ?? 0;
        const baseRD = handItem.baseRD ?? 2;
        const rdAtual = handItem.rdAtual ?? baseRD * 2 ** upgradeLevel;
        const tipoEquipamento = handItem.tipoEquipamento;
        if (tipoEquipamento === 'PROTECAO' || tipoEquipamento === 'protecao') {
          handsBlockRD += rdAtual;
        }
      }
    });

    const stats = getCombatStats(character, suitRD, suitBlockRD, handsBlockRD);

    const intMod = getAttributeRollModifier(character.attributes.intelligence);
    const maxSlots = calculateMaxSlots(intMod);
    const usedSlots = calculateUsedSlots(character.powers ?? [], character.powerArrays ?? []);
    const availableSlots = maxSlots - usedSlots;

    const keyPhysicalName = character.attributes.keyPhysical || 'strength';
    const keyMentalName = character.attributes.keyMental || 'intelligence';
    const keyPhysicalAttr = character.attributes[keyPhysicalName] || character.attributes.strength;
    const keyMentalAttr = character.attributes[keyMentalName] || character.attributes.intelligence;
    const keyPhysicalMod = getAttributeRollModifier(keyPhysicalAttr);
    const keyMentalMod = getAttributeRollModifier(keyMentalAttr);
    const constMod = getAttributeModifier(character.attributes.constitution.baseValue);

    const totalPda = calculateTotalPda(character.level, character.pdaState.extraPda ?? 0);
    const spentPda = character.pdaState.spentPda ?? 0;
    const availablePda = totalPda - spentPda;

    const uMastery = character.unarmedMastery;

    return {
      id: character.id.toString(),
      userId: character.userId.toString(),
      level: character.level,
      inspiration: character.inspiration,
      calamityRank: getCalamityRank(character.level),
      efficiencyBonus: getEfficiencyBonus(character.level),
      narrative: {
        name: character.narrativeProfile.name || character.narrativeProfile.identity || '',
        identity: character.narrativeProfile.identity || '',
        origin: character.narrativeProfile.origin || '',
        motivations: character.narrativeProfile.motivations || [],
        complications: character.narrativeProfile.complications || [],
        generalNotes: character.narrativeProfile.generalNotes || '',
      },
      attributes: {
        strength: {
          baseValue: character.attributes.strength.baseValue,
          extraBonus: character.attributes.strength.extraBonus ?? 0,
          baseModifier: getAttributeModifier(character.attributes.strength.baseValue),
          rollModifier: getAttributeRollModifier(character.attributes.strength),
        },
        dexterity: {
          baseValue: character.attributes.dexterity.baseValue,
          extraBonus: character.attributes.dexterity.extraBonus ?? 0,
          baseModifier: getAttributeModifier(character.attributes.dexterity.baseValue),
          rollModifier: getAttributeRollModifier(character.attributes.dexterity),
        },
        constitution: {
          baseValue: character.attributes.constitution.baseValue,
          extraBonus: character.attributes.constitution.extraBonus ?? 0,
          baseModifier: getAttributeModifier(character.attributes.constitution.baseValue),
          rollModifier: getAttributeRollModifier(character.attributes.constitution),
        },
        intelligence: {
          baseValue: character.attributes.intelligence.baseValue,
          extraBonus: character.attributes.intelligence.extraBonus ?? 0,
          baseModifier: getAttributeModifier(character.attributes.intelligence.baseValue),
          rollModifier: getAttributeRollModifier(character.attributes.intelligence),
        },
        wisdom: {
          baseValue: character.attributes.wisdom.baseValue,
          extraBonus: character.attributes.wisdom.extraBonus ?? 0,
          baseModifier: getAttributeModifier(character.attributes.wisdom.baseValue),
          rollModifier: getAttributeRollModifier(character.attributes.wisdom),
        },
        charisma: {
          baseValue: character.attributes.charisma.baseValue,
          extraBonus: character.attributes.charisma.extraBonus ?? 0,
          baseModifier: getAttributeModifier(character.attributes.charisma.baseValue),
          rollModifier: getAttributeRollModifier(character.attributes.charisma),
        },
        keyPhysical: character.attributes.keyPhysical,
        keyMental: character.attributes.keyMental,
      },
      skills: Object.entries(character.skills || {}).map(([name, value]: [string, any]) => ({
        name,
        proficiencyState: value.proficiencyState,
        trainingBonus: value.trainingBonus,
        extraBonus: value.extraBonus,
      })),
      spiritualPrinciple: {
        isUnlocked: character.spiritualPrinciple.isUnlocked,
        stage: character.spiritualPrinciple.stage,
      },
      domainMasteries: (character.domains || []).map((domain: any) => {
        const peculiarity = peculiarities.find((p) => p.id.toString() === domain.domainId);
        return {
          domainId: domain.domainId,
          masteryLevel: domain.masteryLevel,
          nome: peculiarity?.nome ?? null,
          icone: peculiarity?.icone ?? null,
        };
      }),
      pda: {
        total: totalPda,
        spent: spentPda,
        extra: character.pdaState.extraPda ?? 0,
        available: availablePda,
      },
      health: {
        maxPV: calculateMaxPV(character.level, constMod),
        currentPV: character.healthState.currentPV,
        temporaryPV: character.healthState.temporaryPV ?? 0,
        limitMaxPV: character.healthState.limitMaxPV ?? null,
      },
      energy: {
        maxPE: calculateMaxPE(keyPhysicalMod, keyMentalMod),
        currentPE: character.energyState.currentPE,
        temporaryPE: character.energyState.temporaryPE ?? 0,
        limitMaxPE: character.energyState.limitMaxPE ?? null,
      },
      slots: {
        maxSlots,
        usedSlots,
        availableSlots,
      },
      conditions: character.conditions || [],
      death: {
        state: character.deathState,
        counter: character.deathCounter,
      },
      inventory: {
        runics: character.inventory.runics ?? 0,
        bag: character.inventory.bag || [],
      },
      equipment: {
        suitId: equipment.suitId ?? null,
        accessoryId: equipment.accessoryId ?? null,
        hands: equipment.hands || [],
        quickAccess: equipment.quickAccess || [],
        numberOfHands: equipment.numberOfHands ?? 2,
        maxQuickAccessSlots: 2,
      },
      powers: (character.powers || []).map((power) => ({
        id: power.id.toString(),
        powerId: power.powerId,
        isEquipped: power.isEquipped,
        finalPdaCost: power.finalPdaCost,
        slotCost: power.slotCost,
      })),
      powerArrays: (character.powerArrays || []).map((powerArray) => ({
        id: powerArray.id.toString(),
        powerArrayId: powerArray.powerArrayId,
        isEquipped: powerArray.isEquipped,
        finalPdaCost: powerArray.finalPdaCost,
        slotCost: powerArray.slotCost,
      })),
      benefits: (character.benefits || []).map((benefit) => ({
        id: benefit.id.toString(),
        name: benefit.name,
        degree: benefit.degree,
        pdaCost: benefit.pdaCost,
      })),
      unarmedMastery: uMastery
        ? {
            customName: uMastery.customName,
            degree: uMastery.degree ?? 0,
            marginImprovements: uMastery.marginImprovements ?? 0,
            multiplierImprovements: uMastery.multiplierImprovements ?? 0,
            damageType: uMastery.damageType ?? 'Impacto',
            damageDie: getUnarmedMasteryDamageDie(uMastery.degree ?? 0),
            criticalMargin: getUnarmedMasteryCriticalMargin(uMastery.marginImprovements ?? 0),
            criticalMultiplier: getUnarmedMasteryCriticalMultiplier(
              uMastery.multiplierImprovements ?? 0,
            ),
            totalPdaCost: getUnarmedMasteryTotalPdaCost(uMastery),
          }
        : null,
      symbol: character.symbol ?? null,
      art: character.art ?? null,
      combatStats: {
        dodge: stats.dodge,
        baseRD: stats.baseRD,
        blockRD: stats.blockRD,
      },
      createdAt: character.createdAt,
      updatedAt: character.updatedAt ?? null,
    };
  }
}
