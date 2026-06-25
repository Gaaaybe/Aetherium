export const COMPOSITE_CONDITIONS: Record<string, string[]> = {
  Fatigado: ['Fraco', 'Vulnerável'],
  Exausto: ['Debilitado', 'Lento', 'Vulnerável'],
  Agarrado: ['Desprevenido', 'Imóvel'],
  Atordoado: ['Desprevenido'],
  Cego: ['Desprevenido', 'Lento'],
  Surpreendido: ['Desprevenido'],
  Inconsciente: ['Indefeso'],
  Indefeso: ['Desprevenido'],
  Paralisado: ['Imóvel', 'Indefeso'],
};

export class RulesValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'RulesValidationError';
  }
}

export function getAttributeModifier(value: number): number {
  return Math.ceil((value - 10) / 2);
}

export function getAttributeRollModifier(attr: { baseValue: number; extraBonus?: number }): number {
  return getAttributeModifier(attr.baseValue) + (attr.extraBonus ?? 0);
}

export function hasConditionEffectOf(activeConditions: string[], condition: string): boolean {
  if (activeConditions.includes(condition)) return true;

  for (const active of activeConditions) {
    const inherited = COMPOSITE_CONDITIONS[active];
    if (inherited && inherited.includes(condition)) {
      return true;
    }
  }
  return false;
}

export function getIncomingDamageMultiplier(activeConditions: string[]): number {
  return hasConditionEffectOf(activeConditions, 'Vulnerável') ? 2 : 1;
}

export function getSkillCostMultiplier(activeConditions: string[]): number {
  return hasConditionEffectOf(activeConditions, 'Alquebrado') ? 2 : 1;
}

export function getGeneralDisadvantageCount(activeConditions: string[]): number {
  if (hasConditionEffectOf(activeConditions, 'Apavorado')) return 3;
  if (hasConditionEffectOf(activeConditions, 'Abalado')) return 1;
  return 0;
}

export function getEfficiencyBonus(level: number): number {
  return Math.round(3000 * (level / 250) ** 2) + 1;
}

export function getSkillRollBonus(
  skills: any,
  skillName: string,
  level: number,
  baseAttributeModifier: number,
  activeConditions: string[],
  includeExtraBonus = true,
): number {
  const skill = skills[skillName];
  if (!skill) {
    throw new Error(`Perícia não encontrada: ${skillName}`);
  }

  let finalBonus = baseAttributeModifier + (skill.trainingBonus || 0);

  if (includeExtraBonus) {
    finalBonus += skill.extraBonus || 0;
  }

  const effBonus = getEfficiencyBonus(level);

  if (skill.proficiencyState === 'EFFICIENT') {
    finalBonus += effBonus;
  } else if (skill.proficiencyState === 'INEFFICIENT') {
    finalBonus -= Math.round(effBonus / 2);
  }

  return finalBonus - getGeneralDisadvantageCount(activeConditions);
}

export function calculateTotalPda(level: number, extraPda = 0): number {
  const base = 15;
  const porNivel = (level - 1) * 7;
  const bonus = Math.floor(level / 5) * 7;
  return base + porNivel + bonus + extraPda;
}

export function calculateMaxPV(level: number, constitutionModifier: number): number {
  const calculated = level * constitutionModifier + 6;
  return Math.max(4, calculated);
}

export function calculateMaxPE(keyPhysicalModifier: number, keyMentalModifier: number): number {
  const sumMod = keyPhysicalModifier + keyMentalModifier;
  const peCalculado = Math.floor(899 * Math.sqrt(Math.max(0, sumMod) / 15000));
  return Math.max(4, peCalculado);
}

export function calculateMaxSlots(intelligenceModifier: number): number {
  const effectiveMod = Math.max(0, intelligenceModifier);
  const espacosCalculados = Math.floor(899 * Math.sqrt(effectiveMod / 15000));
  return Math.max(4, espacosCalculados);
}

export function calculateUsedSlots(powers: any[], powerArrays: any[]): number {
  const usedFromPowers = (powers || [])
    .filter((p: any) => p.isEquipped)
    .reduce((sum: number, p: any) => sum + (p.slotCost ?? 0), 0);
  const usedFromPowerArrays = (powerArrays || [])
    .filter((pa: any) => pa.isEquipped)
    .reduce((sum: number, pa: any) => sum + (pa.slotCost ?? 0), 0);
  return usedFromPowers + usedFromPowerArrays;
}

export function getCombatStats(
  character: any,
  equippedSuitRd = 0,
  equippedSuitBlockRd = 0,
  weaponShieldBlockRd = 0,
) {
  const dexterityRollModifier = getAttributeRollModifier(character.attributes.dexterity);
  const constitutionBaseModifier = getAttributeModifier(character.attributes.constitution.baseValue);

  const reflexosBonus = getSkillRollBonus(
    character.skills,
    'Reflexos',
    character.level,
    dexterityRollModifier,
    character.conditions,
  );
  const fortitudeBonus = getSkillRollBonus(
    character.skills,
    'Fortitude',
    character.level,
    constitutionBaseModifier,
    character.conditions,
    false,
  );

  let dodge = reflexosBonus;

  if (hasConditionEffectOf(character.conditions, 'Indefeso')) {
    dodge = 0;
  } else if (hasConditionEffectOf(character.conditions, 'Desprevenido')) {
    dodge = Math.floor(reflexosBonus / 2);
  }

  const baseDamageReduction = Math.max(0, equippedSuitRd);
  let blockDamageReduction = fortitudeBonus + equippedSuitBlockRd + weaponShieldBlockRd;

  if (hasConditionEffectOf(character.conditions, 'Indefeso')) {
    blockDamageReduction = 0;
  } else if (hasConditionEffectOf(character.conditions, 'Desprevenido')) {
    blockDamageReduction = Math.floor(blockDamageReduction / 2);
  }

  return {
    dodge,
    baseRD: baseDamageReduction,
    blockRD: Math.max(0, blockDamageReduction),
  };
}

export function getCalamityRank(level: number): string {
  if (level <= 7) return 'Raposa';
  if (level <= 12) return 'Lobo';
  if (level <= 22) return 'Tigre';
  if (level <= 42) return 'Demônio';
  if (level <= 72) return 'Dragão';
  if (level <= 102) return 'Celestial';
  if (level <= 162) return 'Ser Cósmico';
  if (level <= 192) return 'Semi Deuses';
  if (level <= 242) return 'Deuses Menores';
  return 'Deuses';
}

export function getUnarmedMasteryDamageDie(degree: number): string {
  const dieValue = 2 ** (degree + 1);
  return `1d${dieValue}`;
}

export function getUnarmedMasteryCriticalMargin(marginImprovements: number): number {
  return Math.max(10, 20 - marginImprovements);
}

export function getUnarmedMasteryCriticalMultiplier(multiplierImprovements: number): number {
  return 2 + multiplierImprovements;
}

export function getUnarmedMasteryTotalPdaCost(mastery: any): number {
  if (!mastery) return 0;
  let cost = mastery.degree * 7;
  const improvementUnitCost = mastery.degree > 0 ? mastery.degree : 1;
  cost += (mastery.marginImprovements ?? 0) * improvementUnitCost;
  cost += (mastery.multiplierImprovements ?? 0) * improvementUnitCost;
  if (mastery.damageType && mastery.damageType.toLowerCase() !== 'impacto' && mastery.damageType !== '') {
    cost += 1;
  }
  return cost;
}

export function validateUnarmedMastery(mastery: any): string | null {
  if (mastery.degree < 0 || mastery.degree > 9) {
    return 'O grau deve estar entre 0 e 9.';
  }
  if (mastery.marginImprovements > mastery.degree * 2) {
    return `Com Grau ${mastery.degree}, você só pode ter até ${mastery.degree * 2} melhorias de margem de crítico.`;
  }
  if (mastery.marginImprovements > 10) {
    return 'A margem de crítico não pode ser menor que 10.';
  }
  if (mastery.multiplierImprovements > 0) {
    if (mastery.degree < 3) {
      return 'Melhorias de multiplicador exigem pelo menos Grau 3.';
    }
    const maxMultiplierImprovements = Math.min(3, Math.floor((mastery.degree - 1) / 2));
    if (mastery.multiplierImprovements > maxMultiplierImprovements) {
      const allowed = 2 + maxMultiplierImprovements;
      return `Com Grau ${mastery.degree}, o multiplicador máximo permitido é x${allowed}.`;
    }
  }
  return null;
}

export function applyLevelUp(character: any): void {
  if (character.level >= 250) return;
  character.level += 1;
  const constMod = getAttributeModifier(character.attributes.constitution.baseValue);
  character.healthState.currentPV = calculateMaxPV(character.level, constMod);
}

export function applyChangeLevel(character: any, newLevel: number): void {
  if (newLevel < 1 || newLevel > 250) {
    throw new RulesValidationError('O nível deve estar entre 1 e 250.', 'level');
  }
  character.level = newLevel;
}

export function applyDamage(character: any, amount: number): { died: boolean } {
  if (amount < 0) throw new RulesValidationError('O dano não pode ser negativo.', 'damage');
  const finalDamage = amount * getIncomingDamageMultiplier(character.conditions);

  let remainingDamage = finalDamage;
  let newTemp = character.healthState.temporaryPV ?? 0;
  let newCurrent = character.healthState.currentPV;

  if (newTemp > 0) {
    if (newTemp >= remainingDamage) {
      newTemp -= remainingDamage;
      remainingDamage = 0;
    } else {
      remainingDamage -= newTemp;
      newTemp = 0;
    }
  }

  if (remainingDamage > 0) {
    newCurrent = Math.max(0, newCurrent - remainingDamage);
  }

  character.healthState.currentPV = newCurrent;
  character.healthState.temporaryPV = newTemp;

  let died = false;
  if (newCurrent <= 0) {
    if (character.deathState !== 'DEAD') {
      character.deathState = 'DYING';
      character.deathCounter = 0;
      died = true;
    }
  }
  return { died };
}

export function applyHeal(character: any, amount: number): void {
  if (amount < 0) throw new RulesValidationError('A cura não pode ser negativa.', 'heal');
  const constMod = getAttributeModifier(character.attributes.constitution.baseValue);
  const maxPV = calculateMaxPV(character.level, constMod);
  character.healthState.currentPV = Math.min(maxPV, character.healthState.currentPV + amount);

  if (character.healthState.currentPV > 0 && character.deathState === 'DYING') {
    character.deathState = 'ALIVE';
    character.deathCounter = 0;
  }
}

export function applyTickDeathCounter(character: any): { died: boolean } {
  if (character.deathState !== 'DYING') {
    return { died: false };
  }
  const nextCounter = character.deathCounter + 1;
  let died = false;
  if (nextCounter >= 3) {
    character.deathState = 'DEAD';
    character.deathCounter = nextCounter;
    died = true;
  } else {
    character.deathState = 'DYING';
    character.deathCounter = nextCounter;
  }
  return { died };
}

export function applyConsumeEnergy(character: any, amount: number): void {
  if (amount < 0)
    throw new RulesValidationError('A quantidade a consumir não pode ser negativa.', 'consume');
  const finalCost = amount * getSkillCostMultiplier(character.conditions);

  let remainingAmount = finalCost;
  let newTemp = character.energyState.temporaryPE ?? 0;
  let newCurrent = character.energyState.currentPE;

  if (newTemp > 0) {
    if (newTemp >= remainingAmount) {
      newTemp -= remainingAmount;
      remainingAmount = 0;
    } else {
      remainingAmount -= newTemp;
      newTemp = 0;
    }
  }

  if (remainingAmount > 0) {
    if (newCurrent < remainingAmount) {
      throw new RulesValidationError(
        `PE insuficiente. Necessário: ${finalCost}, Disponível: ${newCurrent + (character.energyState.temporaryPE ?? 0)}`,
        'currentPE',
      );
    }
    newCurrent -= remainingAmount;
  }

  character.energyState.currentPE = newCurrent;
  character.energyState.temporaryPE = newTemp;
}

export function applyRecoverEnergy(character: any, amount: number): void {
  if (amount < 0)
    throw new RulesValidationError('A recuperação não pode ser negativa.', 'recover');
  if (hasConditionEffectOf(character.conditions, 'Faminto')) {
    return;
  }
  const strengthMod = getAttributeRollModifier(character.attributes.strength);
  const intelligenceMod = getAttributeRollModifier(character.attributes.intelligence);
  const maxPE = calculateMaxPE(strengthMod, intelligenceMod);
  character.energyState.currentPE = Math.min(maxPE, character.energyState.currentPE + amount);
}

export function applyAddTemporaryPV(character: any, amount: number): void {
  if (amount < 0)
    throw new RulesValidationError('PV temporário não pode ser negativo.', 'temporaryPV');
  character.healthState.temporaryPV = Math.max(character.healthState.temporaryPV ?? 0, amount);
}

export function applyAddTemporaryPE(character: any, amount: number): void {
  if (amount < 0)
    throw new RulesValidationError('PE temporário não pode ser negativo.', 'temporaryPE');
  character.energyState.temporaryPE = Math.max(character.energyState.temporaryPE ?? 0, amount);
}

export function applyUpdateSkill(
  character: any,
  skillName: string,
  state: string,
  trainingBonus = 0,
  extraBonus = 0,
): void {
  character.skills[skillName] = {
    proficiencyState: state,
    trainingBonus: Math.max(0, trainingBonus),
    extraBonus,
  };
}

export function applyCondition(character: any, condition: string): void {
  const conditionsSet = new Set(character.conditions || []);
  if (conditionsSet.has(condition)) {
    const EVOLUTIONS: Record<string, string> = {
      Abalado: 'Apavorado',
      Fraco: 'Debilitado',
      Debilitado: 'Inconsciente',
      Frustrado: 'Esmorecido',
      Fatigado: 'Exausto',
      Exausto: 'Inconsciente',
    };
    const evo = EVOLUTIONS[condition];
    if (evo) {
      conditionsSet.delete(condition);
      conditionsSet.add(evo);
    }
  } else {
    conditionsSet.add(condition);
  }
  character.conditions = Array.from(conditionsSet);
}

export function applyRemoveCondition(character: any, condition: string): void {
  character.conditions = (character.conditions || []).filter((c: string) => c !== condition);
}

export function applyUpdateConditions(character: any, conditions: string[]): void {
  character.conditions = [...conditions];
}

export function applyAddRunics(character: any, amount: number): void {
  if (amount < 0)
    throw new RulesValidationError('Não pode adicionar runics negativos', 'runics');
  character.inventory.runics = (character.inventory.runics ?? 0) + amount;
}

export function applySpendRunics(character: any, amount: number): void {
  if (amount < 0) throw new RulesValidationError('Não pode gastar runics negativos', 'runics');
  if ((character.inventory.runics ?? 0) < amount) {
    throw new RulesValidationError('Runics insuficientes', 'runics');
  }
  character.inventory.runics = (character.inventory.runics ?? 0) - amount;
}

export function applyAddToInventory(character: any, itemId: string, quantity = 1): void {
  if (quantity <= 0) throw new RulesValidationError('Quantidade deve ser positiva', 'quantity');
  const bag = character.inventory.bag || [];
  const existingIndex = bag.findIndex((item: any) => item.itemId === itemId);

  if (existingIndex >= 0) {
    bag[existingIndex].quantity += quantity;
  } else {
    bag.push({ itemId, quantity });
  }
  character.inventory.bag = bag;
}

export function applyRemoveFromInventory(
  character: any,
  itemId: string,
  quantity = 1,
): { discarded: boolean } {
  if (quantity <= 0) throw new RulesValidationError('Quantidade deve ser positiva', 'quantity');
  const bag = character.inventory.bag || [];
  const existingIndex = bag.findIndex((item: any) => item.itemId === itemId);

  if (existingIndex === -1) {
    throw new RulesValidationError('Item não encontrado no inventário', 'bag');
  }

  const currentQuantity = bag[existingIndex].quantity;
  if (currentQuantity < quantity) {
    throw new RulesValidationError('Não há quantidade suficiente para remover', 'bag');
  }

  let discarded = false;
  if (currentQuantity === quantity) {
    bag.splice(existingIndex, 1);
    discarded = true;
  } else {
    bag[existingIndex].quantity -= quantity;
  }
  character.inventory.bag = bag;
  return { discarded };
}

export function applySetItemQuantityInInventory(
  character: any,
  itemId: string,
  quantity: number,
): { discarded: boolean } {
  if (quantity < 0)
    throw new RulesValidationError('Quantidade não pode ser negativa', 'quantity');
  const bag = character.inventory.bag || [];
  const existingIndex = bag.findIndex((item: any) => item.itemId === itemId);

  let discarded = false;
  if (existingIndex === -1 && quantity > 0) {
    bag.push({ itemId, quantity });
  } else if (existingIndex >= 0) {
    if (quantity === 0) {
      bag.splice(existingIndex, 1);
      discarded = true;
    } else {
      bag[existingIndex].quantity = quantity;
    }
  }
  character.inventory.bag = bag;
  return { discarded };
}

export function applySpendPda(character: any, amount: number): void {
  if (amount < 0)
    throw new RulesValidationError('A quantidade a gastar não pode ser negativa.', 'spentPda');
  const totalPda = calculateTotalPda(character.level, character.pdaState.extraPda ?? 0);
  const availablePda = totalPda - (character.pdaState.spentPda ?? 0);
  if (availablePda < amount) {
    throw new RulesValidationError(
      `PdA insuficiente. Necessário: ${amount}, Disponível: ${availablePda}`,
      'spentPda',
    );
  }
  character.pdaState.spentPda = (character.pdaState.spentPda || 0) + amount;
}

export function applyRefundPda(character: any, amount: number): void {
  if (amount < 0)
    throw new RulesValidationError(
      'A quantidade a reembolsar não pode ser negativa.',
      'spentPda',
    );
  character.pdaState.spentPda = Math.max(0, (character.pdaState.spentPda || 0) - amount);
}

export function applyEquipPower(character: any, powerId: string): void {
  const power = (character.powers || []).find((p: any) => p.powerId === powerId);
  if (!power) {
    throw new RulesValidationError('Poder não encontrado na ficha.', 'powerId');
  }
  if (power.isEquipped) {
    return;
  }
  const intelligenceMod = getAttributeModifier(character.attributes.intelligence.baseValue);
  const maxSlots = calculateMaxSlots(intelligenceMod);
  const usedSlots = calculateUsedSlots(character.powers, character.powerArrays);
  const availableSlots = maxSlots - usedSlots;

  if (power.slotCost < 0) {
    throw new RulesValidationError(
      'A quantidade de espaços a usar não pode ser negativa.',
      'slots',
    );
  }
  if (availableSlots < power.slotCost) {
    throw new RulesValidationError('Espaços de Limite de Poderes insuficientes.', 'slots');
  }

  power.isEquipped = true;
}

export function applyUnequipPower(character: any, powerId: string): void {
  const power = (character.powers || []).find((p: any) => p.powerId === powerId);
  if (!power) {
    throw new RulesValidationError('Poder não encontrado na ficha.', 'powerId');
  }
  if (!power.isEquipped) {
    return;
  }
  power.isEquipped = false;
}

export function applyEquipPowerArray(character: any, arrayId: string): void {
  const array = (character.powerArrays || []).find((a: any) => a.powerArrayId === arrayId);
  if (!array) {
    throw new RulesValidationError('Acervo não encontrado na ficha.', 'powerArrayId');
  }
  if (array.isEquipped) {
    return;
  }
  const intelligenceMod = getAttributeModifier(character.attributes.intelligence.baseValue);
  const maxSlots = calculateMaxSlots(intelligenceMod);
  const usedSlots = calculateUsedSlots(character.powers, character.powerArrays);
  const availableSlots = maxSlots - usedSlots;

  if (array.slotCost < 0) {
    throw new RulesValidationError(
      'A quantidade de espaços a usar não pode ser negativa.',
      'slots',
    );
  }
  if (availableSlots < array.slotCost) {
    throw new RulesValidationError('Espaços de Limite de Poderes insuficientes.', 'slots');
  }

  array.isEquipped = true;
}

export function applyUnequipPowerArray(character: any, arrayId: string): void {
  const array = (character.powerArrays || []).find((a: any) => a.powerArrayId === arrayId);
  if (!array) {
    throw new RulesValidationError('Acervo não encontrado na ficha.', 'powerArrayId');
  }
  if (!array.isEquipped) {
    return;
  }
  array.isEquipped = false;
}

export function applyRemovePower(character: any, powerId: string): { power: any } {
  const power = (character.powers || []).find((p: any) => p.powerId === powerId);
  if (!power) {
    throw new RulesValidationError('Poder não encontrado na ficha.', 'powerId');
  }
  if (power.isEquipped) {
    applyUnequipPower(character, powerId);
  }
  applyRefundPda(character, power.finalPdaCost);
  character.powers = (character.powers || []).filter((p: any) => p.powerId !== powerId);
  return { power };
}

export function applyRemovePowerArray(character: any, arrayId: string): { array: any } {
  const array = (character.powerArrays || []).find((a: any) => a.powerArrayId === arrayId);
  if (!array) {
    throw new RulesValidationError('Acervo não encontrado na ficha.', 'powerArrayId');
  }
  if (array.isEquipped) {
    applyUnequipPowerArray(character, arrayId);
  }
  applyRefundPda(character, array.finalPdaCost);
  character.powerArrays = (character.powerArrays || []).filter((a: any) => a.powerArrayId !== arrayId);
  return { array };
}

export function applyRemoveBenefit(character: any, benefitId: string): { benefit: any } {
  const benefit = (character.benefits || []).find((b: any) => b.id.toString() === benefitId);
  if (!benefit) {
    throw new RulesValidationError('Benefício não encontrado na ficha.', 'benefitId');
  }
  applyRefundPda(character, benefit.pdaCost);
  character.benefits = (character.benefits || []).filter((b: any) => b.id.toString() !== benefitId);
  return { benefit };
}

export function applyEquipItem(
  character: any,
  itemId: string,
  slot: 'suit' | 'accessory' | 'hand' | 'quick-access',
  quantity = 1,
  maxStack = 1,
): void {
  applyRemoveFromInventory(character, itemId, quantity);

  if (slot === 'suit') {
    if (character.equipmentSlots.suitId) {
      applyAddToInventory(character, character.equipmentSlots.suitId, 1);
    }
    character.equipmentSlots.suitId = itemId;
  } else if (slot === 'accessory') {
    if (character.equipmentSlots.accessoryId) {
      applyAddToInventory(character, character.equipmentSlots.accessoryId, 1);
    }
    character.equipmentSlots.accessoryId = itemId;
  } else if (slot === 'hand') {
    const hands = character.equipmentSlots.hands || [];
    const numberOfHands = character.equipmentSlots.numberOfHands ?? 2;
    if (hands.length >= numberOfHands) {
      throw new RulesValidationError('Mãos cheias. Desequipe um item primeiro.', 'hands');
    }
    const existing = hands.find((h: any) => h.itemId === itemId);
    if (existing) {
      if (existing.quantity + quantity > maxStack) {
        throw new RulesValidationError(
          `O limite de empilhamento para este item é ${maxStack}.`,
          'hands',
        );
      }
      existing.quantity += quantity;
    } else {
      hands.push({ itemId, quantity });
    }
    character.equipmentSlots.hands = hands;
  } else if (slot === 'quick-access') {
    const quick = character.equipmentSlots.quickAccess || [];
    if (quick.length >= 2) {
      throw new RulesValidationError('Acesso rápido cheio.', 'quickAccess');
    }
    const existing = quick.find((q: any) => q.itemId === itemId);
    if (existing) {
      if (existing.quantity + quantity > maxStack) {
        throw new RulesValidationError(
          `O limite de empilhamento para este item é ${maxStack}.`,
          'quickAccess',
        );
      }
      existing.quantity += quantity;
    } else {
      quick.push({ itemId, quantity });
    }
    character.equipmentSlots.quickAccess = quick;
  }
}

export function applyUnequipItem(
  character: any,
  itemId: string,
  slot: 'suit' | 'accessory' | 'hand' | 'quick-access',
  quantity = 1,
): void {
  if (slot === 'suit' && character.equipmentSlots.suitId === itemId) {
    character.equipmentSlots.suitId = null;
  } else if (slot === 'accessory' && character.equipmentSlots.accessoryId === itemId) {
    character.equipmentSlots.accessoryId = null;
  } else if (slot === 'hand') {
    const hands = character.equipmentSlots.hands || [];
    const index = hands.findIndex((h: any) => h.itemId === itemId);
    if (index !== -1) {
      if (hands[index].quantity <= quantity) {
        hands.splice(index, 1);
      } else {
        hands[index].quantity -= quantity;
      }
    }
    character.equipmentSlots.hands = hands;
  } else if (slot === 'quick-access') {
    const quick = character.equipmentSlots.quickAccess || [];
    const index = quick.findIndex((q: any) => q.itemId === itemId);
    if (index !== -1) {
      if (quick[index].quantity <= quantity) {
        quick.splice(index, 1);
      } else {
        quick[index].quantity -= quantity;
      }
    }
    character.equipmentSlots.quickAccess = quick;
  }
  applyAddToInventory(character, itemId, quantity);
}

export function applyRestResult(character: any, pvChange: number, peChange: number): void {
  if (pvChange > 0) {
    applyHeal(character, pvChange);
  } else if (pvChange < 0) {
    applyDamage(character, Math.abs(pvChange));
  }

  if (peChange > 0) {
    applyRecoverEnergy(character, peChange);
  } else if (peChange < 0) {
    applyConsumeEnergy(character, Math.abs(peChange));
  }
}
