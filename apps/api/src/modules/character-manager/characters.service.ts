import { Character } from '@aetherium/rules-engine';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainMasteryLevel, UserRole } from '@prisma/client';
import { CatalogBenefitsLookupAdapter } from '@/infrastructure/database/catalog-benefits-lookup-adapter';
import { CatalogDomainsLookupAdapter } from '@/infrastructure/database/catalog-domains-lookup-adapter';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { PrismaCharacterManagerItemsLookupAdapter } from '@/infrastructure/database/prisma-character-manager-items-lookup-adapter';
import { PrismaCharacterManagerPowerArraysLookupAdapter } from '@/infrastructure/database/prisma-character-manager-power-arrays-lookup-adapter';
import { PrismaCharacterManagerPowersLookupAdapter } from '@/infrastructure/database/prisma-character-manager-powers-lookup-adapter';
import {
  DomainValidationError,
  NotAllowedError,
  ResourceNotFoundError,
} from './errors/character-errors';

export type EquipSlot = 'suit' | 'accessory' | 'hand' | 'quick-access';

import {
  AttributesSchema,
  applyAddRunics,
  applyAddTemporaryPE,
  applyAddTemporaryPV,
  applyAddToInventory,
  applyChangeLevel,
  applyCondition,
  applyConsumeEnergy,
  applyDamage,
  applyEquipItem,
  applyEquipPower,
  applyEquipPowerArray,
  applyHeal,
  applyLevelUp,
  applyRecoverEnergy,
  applyRefundPda,
  applyRemoveBenefit,
  applyRemoveCondition,
  applyRemoveFromInventory,
  applyRemovePower,
  applyRemovePowerArray,
  applyRestResult,
  applySetItemQuantityInInventory,
  applySpendPda,
  applySpendRunics,
  applyTickDeathCounter,
  applyUnequipItem,
  applyUnequipPower,
  applyUnequipPowerArray,
  applyUpdateConditions,
  applyUpdateSkill,
  calculateMaxPE,
  calculateMaxPV,
  calculateMaxSlots,
  calculateTotalPda,
  calculateUsedSlots,
  EnergyStateSchema,
  EquipmentSlotsSchema,
  getAttributeModifier,
  getAttributeRollModifier,
  getUnarmedMasteryTotalPdaCost,
  HealthStateSchema,
  hasConditionEffectOf,
  InventorySchema,
  NarrativeProfileSchema,
  PdaStateSchema,
  RulesValidationError,
  SkillsSchema,
  SpiritualPrincipleSchema,
  UnarmedMasterySchema,
} from '@aetherium/rules-engine';

import { CharacterCreatedEvent } from './events/character-created-event';
import { CharacterDiedEvent } from './events/character-died-event';
import { CharacterItemDiscardedEvent } from './events/character-item-discarded-event';
import { CharacterLeveledUpEvent } from './events/character-leveled-up-event';
import { CharacterPowerArrayDiscardedEvent } from './events/character-power-array-discarded-event';
import { CharacterPowerDiscardedEvent } from './events/character-power-discarded-event';

const INCLUDE = {
  powers: true,
  powerArrays: true,
  benefits: true,
  domains: true,
} as const;

function runRules<T>(fn: () => T): T {
  try {
    return fn();
  } catch (error: any) {
    if (error instanceof RulesValidationError || error.name === 'RulesValidationError') {
      throw new DomainValidationError(error.message, error.field);
    }
    throw error;
  }
}

@Injectable()
export class CharactersService {
  constructor(
    private prisma: PrismaService,
    private domainsLookupPort: CatalogDomainsLookupAdapter,
    private itemsLookupPort: PrismaCharacterManagerItemsLookupAdapter,
    private powersLookupPort: PrismaCharacterManagerPowersLookupAdapter,
    private powerArraysLookupPort: PrismaCharacterManagerPowerArraysLookupAdapter,
    private benefitsLookupPort: CatalogBenefitsLookupAdapter,
    private eventEmitter: EventEmitter2,
  ) {}

  private validateAndMigrateJSONB(raw: any): { updatedFields: any; migrated: boolean } {
    let migrated = false;
    const updatedFields: any = {};

    try {
      AttributesSchema.parse(raw.attributes);
    } catch {
      migrated = true;
    }

    try {
      NarrativeProfileSchema.parse(raw.narrativeProfile);
    } catch {
      migrated = true;
    }

    try {
      SkillsSchema.parse(raw.skills);
    } catch {
      migrated = true;
    }

    try {
      PdaStateSchema.parse(raw.pdaState);
    } catch {
      migrated = true;
    }

    try {
      HealthStateSchema.parse(raw.healthState);
    } catch {
      migrated = true;
    }

    try {
      EnergyStateSchema.parse(raw.energyState);
    } catch {
      migrated = true;
    }

    try {
      SpiritualPrincipleSchema.parse(raw.spiritualPrinciple);
    } catch {
      migrated = true;
    }

    try {
      EquipmentSlotsSchema.parse(raw.equipmentSlots);
    } catch {
      migrated = true;
    }

    try {
      InventorySchema.parse(raw.inventory);
    } catch {
      migrated = true;
    }

    if (raw.unarmedMastery) {
      try {
        UnarmedMasterySchema.parse(raw.unarmedMastery);
      } catch {
        migrated = true;
      }
    }

    return { updatedFields, migrated };
  }

  private async migrateIfNeeded(raw: any): Promise<void> {
    const { migrated } = this.validateAndMigrateJSONB(raw);
    if (migrated) {
      const constitutionModifier = Math.ceil(
        ((raw.attributes as any).constitution.baseValue - 10) / 2,
      );
      const maxPV = Math.max(4, raw.level * constitutionModifier + 6);
      const extraPda = (raw.spiritualPrinciple as any).isUnlocked ? 0 : 15;

      await this.prisma.character
        .update({
          where: { id: raw.id },
          data: {
            attributes: raw.attributes as any,
            skills: raw.skills as any,
            pdaState: (raw.pdaState ?? { extraPda, spentPda: 0 }) as any,
            healthState: (raw.healthState ?? { currentPV: maxPV, temporaryPV: 0 }) as any,
            energyState: raw.energyState as any,
            spiritualPrinciple: raw.spiritualPrinciple as any,
            equipmentSlots: raw.equipmentSlots as any,
            inventory: raw.inventory as any,
            unarmedMastery: raw.unarmedMastery as any,
          },
        })
        .catch(() => {});
    }
  }

  private async getCharacterOrThrow(id: string, userId?: string): Promise<Character> {
    const raw = await this.prisma.character.findUnique({
      where: { id },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (userId && raw.userId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user || !user.roles.includes(UserRole.ADMIN)) {
        throw new NotAllowedError();
      }
    }

    await this.migrateIfNeeded(raw);

    return raw as unknown as Character;
  }

  private async saveCharacter(tx: any, character: any): Promise<void> {
    const id = character.id;
    const powers = (character.powers || []).map((power: any, index: number) => ({
      id: power.id.toString(),
      powerId: power.powerId,
      isEquipped: power.isEquipped,
      finalPdaCost: power.finalPdaCost,
      slotCost: power.slotCost,
      posicao: index,
    }));
    const powerArrays = (character.powerArrays || []).map((powerArray: any, index: number) => ({
      id: powerArray.id.toString(),
      powerArrayId: powerArray.powerArrayId,
      isEquipped: powerArray.isEquipped,
      finalPdaCost: powerArray.finalPdaCost,
      slotCost: powerArray.slotCost,
      posicao: index,
    }));
    const benefits = (character.benefits || []).map((benefit: any, index: number) => ({
      id: benefit.id.toString(),
      name: benefit.name,
      degree: benefit.degree,
      pdaCost: benefit.pdaCost,
      posicao: index,
    }));
    const domains = (character.domains || []).map((domain: any) => ({
      domainId: domain.domainId,
      masteryLevel: domain.masteryLevel,
    }));

    await tx.characterPower.deleteMany({ where: { characterId: id } });
    await tx.characterPowerArray.deleteMany({ where: { characterId: id } });
    await tx.characterBenefit.deleteMany({ where: { characterId: id } });
    await tx.characterDomain.deleteMany({ where: { characterId: id } });

    await tx.character.update({
      where: { id },
      data: {
        level: character.level,
        inspiration: character.inspiration,
        attributes: character.attributes,
        narrativeProfile: character.narrativeProfile,
        skills: character.skills,
        pdaState: character.pdaState,
        healthState: character.healthState,
        energyState: character.energyState,
        spiritualPrinciple: character.spiritualPrinciple,
        equipmentSlots: character.equipmentSlots,
        inventory: character.inventory,
        conditions: character.conditions,
        deathState: character.deathState,
        deathCounter: character.deathCounter,
        symbol: character.symbol ?? null,
        art: character.art ?? null,
        unarmedMastery: character.unarmedMastery,
        updatedAt: new Date(),
        powers: {
          create: powers,
        },
        powerArrays: {
          create: powerArrays,
        },
        benefits: {
          create: benefits,
        },
        domains: {
          create: domains,
        },
      },
    });
  }

  async create(userId: string, body: any): Promise<Character> {
    const totalAttributes =
      body.attributes.strength +
      body.attributes.dexterity +
      body.attributes.constitution +
      body.attributes.intelligence +
      body.attributes.wisdom +
      body.attributes.charisma;

    if (totalAttributes > 67) {
      throw new DomainValidationError(
        `A soma dos atributos iniciais (${totalAttributes}) não pode exceder 67.`,
      );
    }

    const skillNames = [
      'Acrobacia',
      'Adestrar Animais',
      'Atletismo',
      'Atuação',
      'Cavalgar',
      'Conhecimento',
      'Cura',
      'Diplomacia',
      'Enganação',
      'Espiritismo',
      'Exploração',
      'Fortitude',
      'Furtividade',
      'Iniciativa',
      'Intimidação',
      'Intuição',
      'Investigação',
      'Ladinagem',
      'Percepção',
      'Pilotar',
      'Reflexos',
      'Religião',
      'Sobrevivência',
      'Vontade',
    ];
    const skillsObj: any = {};
    for (const sName of skillNames) {
      skillsObj[sName] = {
        proficiencyState: 'UNTRAINED',
        trainingBonus: 0,
        extraBonus: 0,
      };
    }

    const extraPda = body.spiritualPrinciple.isUnlocked ? 0 : 15;

    const constitutionModifier = Math.ceil((body.attributes.constitution - 10) / 2);
    const maxPV = Math.max(4, 1 * constitutionModifier + 6);

    const keyPhysicalModifier = Math.ceil((body.attributes[body.attributes.keyPhysical] - 10) / 2);
    const keyMentalModifier = Math.ceil((body.attributes[body.attributes.keyMental] - 10) / 2);
    const sumMod = keyPhysicalModifier + keyMentalModifier;
    const peCalculado = Math.floor(899 * Math.sqrt(Math.max(0, sumMod) / 15000));
    const maxPE = Math.max(4, peCalculado);

    const characterProps = {
      id: crypto.randomUUID(),
      userId,
      level: 1,
      inspiration: 0,
      narrativeProfile: {
        name: body.narrative.name || body.narrative.identity || '',
        identity: body.narrative.identity || '',
        origin: body.narrative.origin || '',
        motivations: body.narrative.motivations || [],
        complications: body.narrative.complications || [],
        generalNotes: '',
      },
      attributes: {
        strength: { baseValue: body.attributes.strength, extraBonus: 0 },
        dexterity: { baseValue: body.attributes.dexterity, extraBonus: 0 },
        constitution: { baseValue: body.attributes.constitution, extraBonus: 0 },
        intelligence: { baseValue: body.attributes.intelligence, extraBonus: 0 },
        wisdom: { baseValue: body.attributes.wisdom, extraBonus: 0 },
        charisma: { baseValue: body.attributes.charisma, extraBonus: 0 },
        keyPhysical: body.attributes.keyPhysical,
        keyMental: body.attributes.keyMental,
      },
      skills: skillsObj,
      spiritualPrinciple: {
        isUnlocked: body.spiritualPrinciple.isUnlocked,
        stage: 'NORMAL' as const,
      },
      pdaState: {
        extraPda,
        spentPda: 0,
      },
      healthState: {
        currentPV: maxPV,
        temporaryPV: 0,
      },
      energyState: {
        currentPE: maxPE,
        temporaryPE: 0,
      },
      equipmentSlots: {
        suitId: null,
        accessoryId: null,
        hands: [],
        quickAccess: [],
        numberOfHands: 2,
      },
      inventory: {
        runics: 0,
        bag: [],
      },
      conditions: [],
      deathState: 'ALIVE' as const,
      deathCounter: 0,
      unarmedMastery: {
        degree: 0,
        marginImprovements: 0,
        multiplierImprovements: 0,
        damageType: 'Impacto',
      },
    };

    const raw = await this.prisma.character.create({
      data: {
        ...characterProps,
        powers: { create: [] },
        powerArrays: { create: [] },
        benefits: { create: [] },
        domains: { create: [] },
      },
      include: INCLUDE,
    });

    await this.eventEmitter.emitAsync(
      'CharacterCreatedEvent',
      new CharacterCreatedEvent(raw as any),
    );

    return raw as unknown as Character;
  }

  async getById(id: string) {
    return this.getCharacterOrThrow(id);
  }

  async fetchUserCharacters(userId: string): Promise<Character[]> {
    const raws = await this.prisma.character.findMany({
      where: { userId },
      include: INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });

    for (const raw of raws) {
      await this.migrateIfNeeded(raw);
    }

    return raws as unknown as Character[];
  }

  async fetchAllCharacters(userId: string): Promise<Character[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.roles.includes(UserRole.ADMIN)) {
      throw new NotAllowedError('Acesso não autorizado');
    }

    const raws = await this.prisma.character.findMany({
      include: INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });

    for (const raw of raws) {
      await this.migrateIfNeeded(raw);
    }

    return raws as unknown as Character[];
  }

  async delete(id: string, userId: string) {
    const character = await this.getCharacterOrThrow(id, userId);
    await this.prisma.character.delete({
      where: { id: character.id },
    });
  }

  async updateAttributes(characterId: string, userId: string, attrProps: any) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    character.attributes = {
      strength: {
        baseValue: attrProps.strength,
        extraBonus: character.attributes.strength.extraBonus ?? 0,
      },
      dexterity: {
        baseValue: attrProps.dexterity,
        extraBonus: character.attributes.dexterity.extraBonus ?? 0,
      },
      constitution: {
        baseValue: attrProps.constitution,
        extraBonus: character.attributes.constitution.extraBonus ?? 0,
      },
      intelligence: {
        baseValue: attrProps.intelligence,
        extraBonus: character.attributes.intelligence.extraBonus ?? 0,
      },
      wisdom: {
        baseValue: attrProps.wisdom,
        extraBonus: character.attributes.wisdom.extraBonus ?? 0,
      },
      charisma: {
        baseValue: attrProps.charisma,
        extraBonus: character.attributes.charisma.extraBonus ?? 0,
      },
      keyPhysical: attrProps.keyPhysical,
      keyMental: attrProps.keyMental,
    };

    const constitutionModifier = getAttributeModifier(character.attributes.constitution.baseValue);
    const maxPV = calculateMaxPV(character.level, constitutionModifier);
    character.healthState.currentPV = Math.min(character.healthState.currentPV, maxPV);

    const keyPhysicalName = character.attributes.keyPhysical || 'strength';
    const keyMentalName = character.attributes.keyMental || 'intelligence';
    const keyPhysicalAttr = character.attributes[keyPhysicalName] || character.attributes.strength;
    const keyMentalAttr = character.attributes[keyMentalName] || character.attributes.intelligence;
    const keyPhysicalModifier = getAttributeRollModifier(keyPhysicalAttr);
    const keyMentalModifier = getAttributeRollModifier(keyMentalAttr);
    const maxPE = calculateMaxPE(keyPhysicalModifier, keyMentalModifier);
    character.energyState.currentPE = Math.min(character.energyState.currentPE, maxPE);

    await this.saveCharacter(this.prisma, character);

    return character;
  }

  async updateSkills(
    characterId: string,
    userId: string,
    skillName: string,
    proficiencyState: string,
    trainingBonusIncrease = 0,
  ) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    runRules(() =>
      applyUpdateSkill(character, skillName, proficiencyState, trainingBonusIncrease, 0),
    );

    await this.saveCharacter(this.prisma, character);

    return character;
  }

  async updateUnarmedMastery(characterId: string, userId: string, masteryProps: any) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    const currentCost = getUnarmedMasteryTotalPdaCost(character.unarmedMastery);
    const newCost = getUnarmedMasteryTotalPdaCost(masteryProps);

    const pdaDiff = newCost - currentCost;

    const totalPda = calculateTotalPda(character.level, character.pdaState.extraPda ?? 0);
    const availablePda = totalPda - (character.pdaState.spentPda ?? 0);

    if (pdaDiff > availablePda) {
      throw new DomainValidationError('PdA insuficiente para esta evolução.', 'pda');
    }

    runRules(() => {
      if (pdaDiff > 0) {
        applySpendPda(character, pdaDiff);
      } else if (pdaDiff < 0) {
        applyRefundPda(character, Math.abs(pdaDiff));
      }
    });

    character.unarmedMastery = {
      degree: masteryProps.degree,
      marginImprovements: masteryProps.marginImprovements,
      multiplierImprovements: masteryProps.multiplierImprovements,
      damageType: masteryProps.damageType,
      customName: masteryProps.customName,
    };

    await this.saveCharacter(this.prisma, character);

    return character;
  }

  async acquireDomainMastery(
    characterId: string,
    userId: string,
    domainId: string,
    masteryLevel: DomainMasteryLevel,
  ) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    const domain = await this.domainsLookupPort.findById(domainId);

    if (!domain) {
      throw new ResourceNotFoundError('Domínio não encontrado');
    }

    if (domain.espiritual && !character.spiritualPrinciple.isUnlocked) {
      throw new DomainValidationError(
        `O domínio "${domain.nome}" é de natureza espiritual. Você precisa despertar seu Princípio Espiritual para adquiri-lo.`,
        'spiritualPrinciple',
      );
    }

    const domains = character.domains || [];
    const existingIndex = domains.findIndex((m: any) => m.domainId === domainId);

    if (existingIndex >= 0) {
      domains[existingIndex] = {
        id: domains[existingIndex].id,
        characterId,
        domainId,
        masteryLevel,
      };
    } else {
      domains.push({
        id: crypto.randomUUID(),
        characterId,
        domainId,
        masteryLevel,
      });
    }
    character.domains = domains;

    await this.saveCharacter(this.prisma, character);

    return character;
  }

  async discardDomainMastery(characterId: string, userId: string, domainId: string) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    character.domains = (character.domains || []).filter((m: any) => m.domainId !== domainId);

    await this.saveCharacter(this.prisma, character);

    return character;
  }

  async unlockSpiritualPrinciple(
    characterId: string,
    userId: string,
    stage: 'NORMAL' | 'DIVINE' = 'NORMAL',
  ) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    if (character.spiritualPrinciple?.isUnlocked) {
      throw new DomainValidationError(
        'Princípio Espiritual já está desbloqueado.',
        'spiritualPrinciple',
      );
    }

    runRules(() => applySpendPda(character, 15));

    character.spiritualPrinciple = {
      isUnlocked: true,
      stage,
    };

    await this.saveCharacter(this.prisma, character);

    return character;
  }

  async evolveSpiritualPrinciple(characterId: string, userId: string) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    if (!character.spiritualPrinciple?.isUnlocked) {
      throw new DomainValidationError(
        'O personagem precisa ter despertado o Princípio Espiritual antes de evoluí-lo.',
        'spiritualPrinciple',
      );
    }
    if (character.spiritualPrinciple.stage === 'DIVINE') {
      throw new DomainValidationError(
        'O Princípio Espiritual já atingiu o estágio Divino.',
        'spiritualPrinciple',
      );
    }
    if (character.level < 35) {
      throw new DomainValidationError('A evolução espiritual exige no mínimo o nível 35.', 'level');
    }

    character.spiritualPrinciple = {
      isUnlocked: true,
      stage: 'DIVINE',
    };

    await this.saveCharacter(this.prisma, character);

    return character;
  }

  async levelUp(characterId: string, userId: string) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    runRules(() => applyLevelUp(character));

    await this.saveCharacter(this.prisma, character);

    await this.eventEmitter.emitAsync(
      'CharacterLeveledUpEvent',
      new CharacterLeveledUpEvent(character as any, character.level),
    );

    return character;
  }

  async rest(
    characterId: string,
    userId: string,
    quality: string,
    durationHours: number,
    hasCare: boolean,
    useGastronomicRule = false,
    consumedMeal = false,
    customMaxPV?: number,
    customMaxPE?: number,
  ) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    const hasInjury = hasConditionEffectOf(character.conditions, 'Lesão');

    const timeMultiplier = Math.min(1, Math.max(2, durationHours) / 8);
    let effectiveQuality = quality;

    if (hasInjury) {
      if (effectiveQuality === 'LUXUOSA') effectiveQuality = 'CONFORTAVEL';
      else if (effectiveQuality === 'CONFORTAVEL') effectiveQuality = 'NORMAL';
      else if (effectiveQuality === 'NORMAL') effectiveQuality = 'RUIM';
    }

    let pvChange = 0;
    let peChange = 0;

    const keyPhysicalName = character.attributes.keyPhysical || 'strength';
    const keyMentalName = character.attributes.keyMental || 'intelligence';
    const keyPhysicalAttr = character.attributes[keyPhysicalName] || character.attributes.strength;
    const keyMentalAttr = character.attributes[keyMentalName] || character.attributes.intelligence;
    const keyPhysicalMod = getAttributeRollModifier(keyPhysicalAttr);
    const keyMentalMod = getAttributeRollModifier(keyMentalAttr);
    const constMod = getAttributeModifier(character.attributes.constitution.baseValue);

    const maxPV = calculateMaxPV(character.level, constMod);
    const maxPE = calculateMaxPE(keyPhysicalMod, keyMentalMod);

    const roll = (sides: number) => Math.floor(Math.random() * sides) + 1;
    const rolls = {
      pvRoll1: roll(maxPV),
      pvRoll2: roll(maxPV),
      peRoll1: roll(maxPE),
      peRoll2: roll(maxPE),
      injuryPenaltyPvRoll: roll(character.healthState.currentPV || 1),
      injuryPenaltyPeRoll: roll(character.energyState.currentPE || 1),
    };

    if (effectiveQuality === 'RUIM' && hasInjury) {
      pvChange = -rolls.injuryPenaltyPvRoll;
      peChange = -rolls.injuryPenaltyPeRoll;
    } else {
      let pvRecovered = 0;
      let peRecovered = 0;

      switch (effectiveQuality) {
        case 'RUIM':
          pvRecovered = rolls.pvRoll1 / 3;
          peRecovered = rolls.peRoll1 / 3;
          break;
        case 'NORMAL':
          pvRecovered = rolls.pvRoll1 / 2;
          peRecovered = rolls.peRoll1 / 2;
          break;
        case 'CONFORTAVEL':
          pvRecovered = rolls.pvRoll1;
          peRecovered = rolls.peRoll1;
          break;
        case 'LUXUOSA':
          pvRecovered = rolls.pvRoll1 + rolls.pvRoll2;
          peRecovered = rolls.peRoll1 + rolls.peRoll2;
          break;
      }

      pvRecovered *= timeMultiplier;
      peRecovered *= timeMultiplier;

      if (hasInjury && !hasCare) {
        pvRecovered = 0;
      }

      pvChange = Math.floor(pvRecovered);
      peChange = Math.floor(peRecovered);
    }

    let isCurrentlyFaminto = false;
    runRules(() => {
      if (useGastronomicRule) {
        if (consumedMeal) {
          applyRemoveCondition(character, 'Faminto');
        } else {
          applyCondition(character, 'Faminto');
        }
      } else if (consumedMeal) {
        applyRemoveCondition(character, 'Faminto');
      }
      isCurrentlyFaminto = hasConditionEffectOf(character.conditions, 'Faminto');
    });

    if (isCurrentlyFaminto) {
      if (pvChange > 0) pvChange = 0;
      if (peChange > 0) peChange = 0;
    }

    const baseCurrentPV = character.healthState.currentPV;
    const baseCurrentPE = character.energyState.currentPE;

    runRules(() => applyRestResult(character, pvChange, peChange));

    if (pvChange > 0 && customMaxPV !== undefined) {
      const expectedPV = baseCurrentPV + pvChange;
      character.healthState.currentPV = Math.min(customMaxPV, expectedPV);
    }
    if (peChange > 0 && customMaxPE !== undefined) {
      const expectedPE = baseCurrentPE + peChange;
      character.energyState.currentPE = Math.min(customMaxPE, expectedPE);
    }

    await this.saveCharacter(this.prisma, character);

    return {
      character,
      pvChange,
      peChange,
    };
  }

  async tickDeathCounter(characterId: string, userId: string) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    const { died } = runRules(() => applyTickDeathCounter(character));

    await this.saveCharacter(this.prisma, character);

    if (died && character.deathState === 'DEAD') {
      await this.eventEmitter.emitAsync(
        'CharacterDiedEvent',
        new CharacterDiedEvent(character as any),
      );
    }

    return character;
  }

  async sync(characterId: string, userId: string, data: any) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    runRules(() => {
      if (data.level !== undefined) {
        applyChangeLevel(character, data.level);
      }

      if (data.narrative) {
        character.narrativeProfile = {
          name: data.narrative.name !== undefined ? data.narrative.name : (character.narrativeProfile.name || ''),
          identity: data.narrative.identity !== undefined ? data.narrative.identity : (character.narrativeProfile.identity || ''),
          origin: data.narrative.origin !== undefined ? data.narrative.origin : (character.narrativeProfile.origin || ''),
          motivations: data.narrative.motivations || character.narrativeProfile.motivations || [],
          complications: data.narrative.complications || character.narrativeProfile.complications || [],
          generalNotes: data.narrative.generalNotes !== undefined ? data.narrative.generalNotes : (character.narrativeProfile.generalNotes || ''),
          deity: data.narrative.deity !== undefined ? data.narrative.deity : character.narrativeProfile.deity,
          psychicState: data.narrative.psychicState !== undefined ? data.narrative.psychicState : character.narrativeProfile.psychicState,
        };
      }

      if (data.symbol !== undefined) {
        character.symbol = data.symbol ?? undefined;
      }

      if (data.art !== undefined) {
        character.art = data.art ?? undefined;
      }

      if (data.inspiration !== undefined) {
        character.inspiration = Math.max(0, Math.min(3, data.inspiration));
      }

      if (data.extraPda !== undefined) {
        if (data.extraPda < 0)
          throw new RulesValidationError('PdA Extra não pode ser negativo.', 'extraPda');
        character.pdaState.extraPda = data.extraPda;
      }

      if (data.limitMaxPV !== undefined) {
        character.healthState.limitMaxPV = data.limitMaxPV;
        if (data.limitMaxPV !== null && data.limitMaxPV !== undefined) {
          character.healthState.currentPV = Math.min(data.limitMaxPV, character.healthState.currentPV);
        }
      }

      if (data.limitMaxPE !== undefined) {
        character.energyState.limitMaxPE = data.limitMaxPE;
        if (data.limitMaxPE !== null && data.limitMaxPE !== undefined) {
          character.energyState.currentPE = Math.min(data.limitMaxPE, character.energyState.currentPE);
        }
      }

      if (data.pvChange !== undefined || data.peChange !== undefined) {
        const baseCurrentPV = character.healthState.currentPV;
        const baseCurrentPE = character.energyState.currentPE;

        applyRestResult(character, data.pvChange ?? 0, data.peChange ?? 0);

        if (data.pvChange !== undefined && data.pvChange > 0 && data.customMaxPV !== undefined) {
          const expectedPV = baseCurrentPV + data.pvChange;
          const limit = character.healthState.limitMaxPV;
          const cap = limit !== null && limit !== undefined ? Math.min(data.customMaxPV, limit) : data.customMaxPV;
          character.healthState.currentPV = Math.min(cap, expectedPV);
        }
        if (data.peChange !== undefined && data.peChange > 0 && data.customMaxPE !== undefined) {
          const expectedPE = baseCurrentPE + data.peChange;
          const limit = character.energyState.limitMaxPE;
          const cap = limit !== null && limit !== undefined ? Math.min(data.customMaxPE, limit) : data.customMaxPE;
          character.energyState.currentPE = Math.min(cap, expectedPE);
        }
      }

      if (data.tempPvChange !== undefined && data.tempPvChange > 0) {
        applyAddTemporaryPV(character, data.tempPvChange);
      }

      if (data.tempPeChange !== undefined && data.tempPeChange > 0) {
        applyAddTemporaryPE(character, data.tempPeChange);
      }

      if (data.attributes) {
        const allowedPoints = 67 + (character.level * (character.level + 1)) / 2;
        const spentPoints =
          data.attributes.strength.baseValue +
          data.attributes.dexterity.baseValue +
          data.attributes.constitution.baseValue +
          data.attributes.intelligence.baseValue +
          data.attributes.wisdom.baseValue +
          data.attributes.charisma.baseValue;

        if (spentPoints > allowedPoints) {
          throw new RulesValidationError(
            `Limite de atributos excedido. Gasto: ${spentPoints}, Máximo permitido para nível ${character.level}: ${allowedPoints}`,
            'attributes',
          );
        }

        character.attributes = {
          strength: {
            baseValue: data.attributes.strength.baseValue,
            extraBonus: data.attributes.strength.extraBonus ?? 0,
          },
          dexterity: {
            baseValue: data.attributes.dexterity.baseValue,
            extraBonus: data.attributes.dexterity.extraBonus ?? 0,
          },
          constitution: {
            baseValue: data.attributes.constitution.baseValue,
            extraBonus: data.attributes.constitution.extraBonus ?? 0,
          },
          intelligence: {
            baseValue: data.attributes.intelligence.baseValue,
            extraBonus: data.attributes.intelligence.extraBonus ?? 0,
          },
          wisdom: {
            baseValue: data.attributes.wisdom.baseValue,
            extraBonus: data.attributes.wisdom.extraBonus ?? 0,
          },
          charisma: {
            baseValue: data.attributes.charisma.baseValue,
            extraBonus: data.attributes.charisma.extraBonus ?? 0,
          },
          keyPhysical: data.attributes.keyPhysical,
          keyMental: data.attributes.keyMental,
        };
      }

      if (data.skills) {
        for (const skillUpdate of data.skills) {
          applyUpdateSkill(
            character,
            skillUpdate.name,
            skillUpdate.state,
            skillUpdate.trainingBonus ?? 0,
            skillUpdate.extraBonus ?? 0,
          );
        }
      }

      if (data.conditions) {
        applyUpdateConditions(character, data.conditions);
      }

      if (data.deathState !== undefined) {
        character.deathState = data.deathState;
        if (data.deathState === 'ALIVE') {
          character.conditions = (character.conditions || []).filter((c: string) => c !== 'Morrendo');
        } else if (data.deathState === 'DYING') {
          const condSet = new Set(character.conditions || []);
          condSet.add('Morrendo');
          condSet.add('Caído');
          character.conditions = Array.from(condSet);
        }
      }

      if (data.deathCounter !== undefined) {
        character.deathCounter = Math.max(0, Math.min(3, data.deathCounter));
        if (character.deathCounter >= 3) {
          character.deathState = 'DEAD';
        } else if (character.deathCounter > 0) {
          character.deathState = 'DYING';
          const condSet = new Set(character.conditions || []);
          condSet.add('Morrendo');
          condSet.add('Caído');
          character.conditions = Array.from(condSet);
        }
      }
    });

    await this.saveCharacter(this.prisma, character);

    return character;
  }

  async addItemToInventory(characterId: string, userId: string, itemId: string, quantity = 1) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    const item = await this.itemsLookupPort.findById(itemId);

    if (!item) {
      throw new ResourceNotFoundError('Item não encontrado');
    }

    const newInstanceId = await this.itemsLookupPort.createCharacterInstance(
      itemId,
      characterId,
      userId,
    );

    if (!newInstanceId) {
      throw new ResourceNotFoundError('Instância de item não pôde ser criada');
    }

    runRules(() => applyAddToInventory(character, newInstanceId, quantity));

    await this.saveCharacter(this.prisma, character);

    return character;
  }

  async removeFromInventory(characterId: string, userId: string, itemId: string, quantity = 1) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    const { discarded } = runRules(() => applyRemoveFromInventory(character, itemId, quantity));

    await this.saveCharacter(this.prisma, character);

    if (discarded) {
      await this.eventEmitter.emitAsync(
        'CharacterItemDiscardedEvent',
        new CharacterItemDiscardedEvent(character as any, itemId),
      );
    }

    return character;
  }

  async changeInventoryItemQuantity(
    characterId: string,
    userId: string,
    itemId: string,
    quantity: number,
  ) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    const itemExistsInBag = (character.inventory.bag || []).some((i: any) => i.itemId === itemId);
    if (!itemExistsInBag) {
      throw new ResourceNotFoundError('Item não encontrado no inventário');
    }

    const { discarded } = runRules(() =>
      applySetItemQuantityInInventory(character, itemId, quantity),
    );

    await this.saveCharacter(this.prisma, character);

    if (discarded) {
      await this.eventEmitter.emitAsync(
        'CharacterItemDiscardedEvent',
        new CharacterItemDiscardedEvent(character as any, itemId),
      );
    }

    return character;
  }

  async addRunics(characterId: string, userId: string, amount: number) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    runRules(() => applyAddRunics(character, amount));

    await this.saveCharacter(this.prisma, character);

    return character;
  }

  async spendRunics(characterId: string, userId: string, amount: number) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    runRules(() => applySpendRunics(character, amount));

    await this.saveCharacter(this.prisma, character);

    return character;
  }

  async equipItem(
    characterId: string,
    userId: string,
    itemId: string,
    slot: EquipSlot,
    quantity = 1,
  ) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    const item = await this.itemsLookupPort.findById(itemId);

    if (!item) {
      throw new ResourceNotFoundError('Item não encontrado');
    }

    const maxStack = item.maxStack ?? 1;

    const inInventory = (character.inventory.bag || []).find((i: any) => i.itemId === itemId);

    if (!inInventory || inInventory.quantity < quantity) {
      throw new DomainValidationError('Quantidade de item insuficiente no inventário.', 'itemId');
    }

    runRules(() => applyEquipItem(character, itemId, slot, quantity, maxStack));

    await this.saveCharacter(this.prisma, character);

    return character;
  }

  async unequipItem(
    characterId: string,
    userId: string,
    itemId: string,
    slot: EquipSlot,
    quantity = 1,
  ) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    runRules(() => applyUnequipItem(character, itemId, slot, quantity));

    await this.saveCharacter(this.prisma, character);

    return character;
  }

  async upgradeItem(
    characterId: string,
    userId: string,
    itemId: string,
    materialId: string,
    runicsCost: number,
  ) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    const item = await this.itemsLookupPort.findById(itemId);

    if (!item) {
      throw new ResourceNotFoundError('Item não encontrado');
    }

    if (item.characterId !== characterId) {
      throw new DomainValidationError(
        'Apenas itens vinculados à ficha podem ser aprimorados',
        'itemId',
      );
    }

    const currentUpgradeValue = item.upgradeLevel?.value ?? item.upgradeLevelValue;
    const maxUpgradeLimit = item.upgradeLevel?.maxLevel ?? item.upgradeLevelMax;

    if (typeof currentUpgradeValue !== 'number' || typeof maxUpgradeLimit !== 'number') {
      throw new DomainValidationError('Este item não suporta aprimoramentos', 'itemId');
    }

    const materialInInventory = (character.inventory.bag || []).find(
      (i: any) => i.itemId === materialId,
    );

    if (!materialInInventory || materialInInventory.quantity < 1) {
      throw new DomainValidationError(
        'Material de aprimoramento não encontrado no inventário',
        'materialId',
      );
    }

    const material = await this.itemsLookupPort.findById(materialId);

    if (!material || material.tipo !== 'UPGRADE_MATERIAL') {
      throw new DomainValidationError(
        'Item selecionado não é um material de aprimoramento válido',
        'materialId',
      );
    }

    if (currentUpgradeValue >= maxUpgradeLimit) {
      throw new DomainValidationError(
        'O item já atingiu seu limite máximo de aprimoramento',
        'itemId',
      );
    }

    if (currentUpgradeValue >= material.maxUpgradeLimit) {
      throw new DomainValidationError(
        `O material fornecido suporta aprimoramentos apenas até o nível ${material.maxUpgradeLimit}. O item já está no nível ${currentUpgradeValue}.`,
        'materialId',
      );
    }

    runRules(() => {
      applySpendRunics(character, runicsCost);
      applyRemoveFromInventory(character, materialId, 1);
    });

    await this.itemsLookupPort.upgradeItem(itemId);

    await this.saveCharacter(this.prisma, character);

    return character;
  }

  async acquirePower(characterId: string, userId: string, powerId: string) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    const powerInfo = await this.powersLookupPort.findById(powerId);

    if (!powerInfo) {
      throw new ResourceNotFoundError('Poder não encontrado');
    }

    const newInstanceId = await this.powersLookupPort.createCharacterInstance(
      powerInfo.id,
      characterId,
      userId,
    );

    if (!newInstanceId) {
      throw new ResourceNotFoundError('Falha ao criar instância do poder');
    }

    const alreadyHasPower = (character.powers || []).some((p: any) => p.powerId === newInstanceId);
    if (alreadyHasPower) {
      throw new DomainValidationError('O personagem já possui este poder.', 'powerId');
    }

    const domainsMapped = (character.domains || []).map((domain: any) => {
      let modificationIdToInject: string | null = null;
      if (domain.masteryLevel === 'INICIANTE') modificationIdToInject = 'dominio-iniciante';
      if (domain.masteryLevel === 'MESTRE') modificationIdToInject = 'dominio-mestre';
      return {
        domainId: domain.domainId,
        masteryLevel: domain.masteryLevel,
        modificationIdToInject,
      };
    });

    const mastery = domainsMapped.find((m) => m.domainId === powerInfo.domainId);
    if (!mastery) {
      throw new DomainValidationError(
        'O personagem não possui a maestria no domínio necessário para este poder.',
        'domainId',
      );
    }

    const globalModificationIdToInject = mastery ? mastery.modificationIdToInject : null;

    runRules(() => applySpendPda(character, powerInfo.pdaCost));

    const powerData = {
      id: crypto.randomUUID(),
      characterId,
      powerId: newInstanceId,
      posicao: character.powers!.length,
      isEquipped: false,
      finalPdaCost: powerInfo.pdaCost,
      slotCost: powerInfo.slotCost,
    };
    character.powers!.push(powerData);

    await this.saveCharacter(this.prisma, character);

    return {
      character,
      globalModificationIdToInject,
    };
  }

  async equipPower(characterId: string, userId: string, powerId: string) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    runRules(() => applyEquipPower(character, powerId));

    await this.saveCharacter(this.prisma, character);

    return character;
  }

  async unequipPower(characterId: string, userId: string, powerId: string) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    runRules(() => applyUnequipPower(character, powerId));

    await this.saveCharacter(this.prisma, character);

    return character;
  }

  async deletePowerFromCharacter(characterId: string, userId: string, powerId: string) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    runRules(() => applyRemovePower(character, powerId));

    await this.saveCharacter(this.prisma, character);

    await this.eventEmitter.emitAsync(
      'CharacterPowerDiscardedEvent',
      new CharacterPowerDiscardedEvent(character as any, powerId),
    );

    return character;
  }

  async acquirePowerArray(characterId: string, userId: string, powerArrayId: string) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    const arrayInfo = await this.powerArraysLookupPort.findById(powerArrayId);

    if (!arrayInfo) {
      throw new ResourceNotFoundError('Array de poder não encontrado');
    }

    const newInstanceId = await this.powerArraysLookupPort.createCharacterInstance(
      arrayInfo.id,
      characterId,
      userId,
    );

    if (!newInstanceId) {
      throw new ResourceNotFoundError('Falha ao criar instância do array de poder');
    }

    const alreadyHasArray = (character.powerArrays || []).some(
      (a: any) => a.powerArrayId === newInstanceId,
    );
    if (alreadyHasArray) {
      throw new DomainValidationError('O personagem já possui este acervo.', 'powerArrayId');
    }

    const domainsMapped = (character.domains || []).map((domain: any) => {
      let modificationIdToInject: string | null = null;
      if (domain.masteryLevel === 'INICIANTE') modificationIdToInject = 'dominio-iniciante';
      if (domain.masteryLevel === 'MESTRE') modificationIdToInject = 'dominio-mestre';
      return {
        domainId: domain.domainId,
        masteryLevel: domain.masteryLevel,
        modificationIdToInject,
      };
    });

    const mastery = domainsMapped.find((m) => m.domainId === arrayInfo.domainId);
    if (!mastery) {
      throw new DomainValidationError(
        'O personagem não possui a maestria no domínio necessário para este acervo.',
        'domainId',
      );
    }

    const globalModificationIdToInject = mastery ? mastery.modificationIdToInject : null;

    runRules(() => applySpendPda(character, arrayInfo.pdaCost));

    const arrayData = {
      id: crypto.randomUUID(),
      characterId,
      powerArrayId: newInstanceId,
      posicao: character.powerArrays!.length,
      isEquipped: false,
      finalPdaCost: arrayInfo.pdaCost,
      slotCost: arrayInfo.slotCost,
    };
    character.powerArrays!.push(arrayData);

    await this.saveCharacter(this.prisma, character);

    return {
      character,
      globalModificationIdToInject,
    };
  }

  async equipPowerArray(characterId: string, userId: string, powerArrayId: string) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    runRules(() => applyEquipPowerArray(character, powerArrayId));

    await this.saveCharacter(this.prisma, character);

    return character;
  }

  async unequipPowerArray(characterId: string, userId: string, powerArrayId: string) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    runRules(() => applyUnequipPowerArray(character, powerArrayId));

    await this.saveCharacter(this.prisma, character);

    return character;
  }

  async deletePowerArrayFromCharacter(characterId: string, userId: string, powerArrayId: string) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    runRules(() => applyRemovePowerArray(character, powerArrayId));

    await this.saveCharacter(this.prisma, character);

    await this.eventEmitter.emitAsync(
      'CharacterPowerArrayDiscardedEvent',
      new CharacterPowerArrayDiscardedEvent(character as any, powerArrayId),
    );

    return character;
  }

  async acquireBenefit(
    characterId: string,
    userId: string,
    benefitName: string,
    targetDegree: number,
  ) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    const benefitInfo = await this.benefitsLookupPort.findByName(benefitName);

    if (!benefitInfo) {
      throw new ResourceNotFoundError('Benefício não encontrado');
    }

    const currentBenefit = (character.benefits || []).find(
      (b: any) => b.name.trim().toLowerCase() === benefitName.trim().toLowerCase()
    );

    const currentDegree = currentBenefit ? currentBenefit.degree : 0;

    if (targetDegree <= currentDegree) {
      throw new DomainValidationError(
        'O novo grau deve ser maior que o grau atual do benefício.',
        'targetDegree',
      );
    }

    if (typeof benefitInfo.graus === 'number' && targetDegree > benefitInfo.graus) {
      throw new DomainValidationError(
        `O grau máximo para este benefício é ${benefitInfo.graus}.`,
        'targetDegree',
      );
    }

    const baseCost = benefitInfo.custo_base ?? 3;
    const rule = benefitInfo.regra_custo ?? 'linear';

    const calculateTotalCostForDegree = (degree: number): number => {
      if (degree <= 0) return 0;
      if (rule === 'dobro_por_grau') {
        return baseCost * (2 ** degree - 1);
      }
      return baseCost * degree;
    };

    const targetTotalCost = calculateTotalCostForDegree(targetDegree);
    const currentTotalCost = calculateTotalCostForDegree(currentDegree);
    const costPaid = targetTotalCost - currentTotalCost;

    runRules(() => applySpendPda(character, costPaid));

    if (currentBenefit) {
      character.benefits = character.benefits!.filter(
        (b: any) => b.name.trim().toLowerCase() !== benefitName.trim().toLowerCase()
      );

      const updatedBenefit = {
        id: currentBenefit.id.toString(),
        characterId,
        name: benefitName,
        degree: targetDegree,
        posicao: character.benefits!.length,
        pdaCost: currentBenefit.pdaCost + costPaid,
      };
      character.benefits!.push(updatedBenefit);
    } else {
      const updatedBenefit = {
        id: crypto.randomUUID(),
        characterId,
        name: benefitName,
        degree: targetDegree,
        posicao: character.benefits!.length,
        pdaCost: costPaid,
      };
      character.benefits!.push(updatedBenefit);
    }

    await this.saveCharacter(this.prisma, character);

    return {
      character,
      costPaid,
    };
  }

  async discardBenefit(characterId: string, userId: string, benefitId: string) {
    const character = await this.getCharacterOrThrow(characterId, userId);

    runRules(() => applyRemoveBenefit(character, benefitId));

    await this.saveCharacter(this.prisma, character);

    return character;
  }

  async changeOwner(id: string, newOwnerId: string, currentUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (!user || !user.roles.includes(UserRole.ADMIN)) {
      throw new NotAllowedError();
    }

    const newOwner = await this.prisma.user.findUnique({
      where: { id: newOwnerId },
    });
    if (!newOwner) {
      throw new ResourceNotFoundError();
    }

    const updated = await this.prisma.character.update({
      where: { id },
      data: {
        userId: newOwnerId,
      },
      include: INCLUDE,
    });

    return updated as unknown as Character;
  }
}
