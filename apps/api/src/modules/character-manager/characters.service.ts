import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { ResourceNotFoundError, NotAllowedError, DomainValidationError } from './errors/character-errors';
import * as PrismaCharacterMapper from '@/infrastructure/database/prisma/mappers/prisma-character-mapper';
import { DomainEvents } from '@/core/events/domain-events';
import { Character } from '@/domain/character-manager/enterprise/entities/character';
import { NarrativeProfile } from '@/domain/character-manager/enterprise/entities/value-objects/narrative-profile';
import { AttributeSet } from '@/domain/character-manager/enterprise/entities/value-objects/attribute-set';
import { Attribute } from '@/domain/character-manager/enterprise/entities/value-objects/attribute';
import { SkillsManager } from '@/domain/character-manager/enterprise/entities/value-objects/skills-manager';
import { SpiritualPrinciple } from '@/domain/character-manager/enterprise/entities/value-objects/spiritual-principle';
import { PdAManager } from '@/domain/character-manager/enterprise/entities/value-objects/pda-manager';
import { HealthManager } from '@/domain/character-manager/enterprise/entities/value-objects/health-manager';
import { EnergyManager } from '@/domain/character-manager/enterprise/entities/value-objects/energy-manager';
import { SlotManager } from '@/domain/character-manager/enterprise/entities/value-objects/slot-manager';
import { ConditionManager } from '@/domain/character-manager/enterprise/entities/value-objects/condition-manager';
import { DeathManager } from '@/domain/character-manager/enterprise/entities/value-objects/death-manager';
import { Inventory } from '@/domain/character-manager/enterprise/entities/value-objects/inventory';
import { EquipmentSlots } from '@/domain/character-manager/enterprise/entities/value-objects/equipment-slots';
import { CharacterPowerList } from '@/domain/character-manager/enterprise/entities/watched-lists/character-power-list';
import { CharacterPowerArrayList } from '@/domain/character-manager/enterprise/entities/watched-lists/character-power-array-list';
import { CharacterBenefitList } from '@/domain/character-manager/enterprise/entities/watched-lists/character-benefit-list';
import { UniqueEntityId } from '@/core/entities/unique-entity-ts';
import { UnarmedMastery } from '@/domain/character-manager/enterprise/entities/value-objects/unarmed-mastery';
import { DomainsLookupPort } from '@/domain/character-manager/application/repositories/domains-lookup-port';
import { ItemsLookupPort } from '@/domain/character-manager/application/repositories/items-lookup-port';
import { PowersLookupPort } from '@/domain/character-manager/application/repositories/powers-lookup-port';
import { AcquirePowerService } from '@/domain/character-manager/enterprise/services/acquire-power';
import { PowerArraysLookupPort } from '@/domain/character-manager/application/repositories/power-arrays-lookup-port';
import { AcquirePowerArrayService } from '@/domain/character-manager/enterprise/services/acquire-power-array';
import { BenefitsLookupPort } from '@/domain/character-manager/application/repositories/benefits-lookup-port';
import { AcquireBenefitService } from '@/domain/character-manager/enterprise/services/acquire-benefit';

export type EquipSlot = 'suit' | 'accessory' | 'hand' | 'quick-access';
import { MasteryLevel } from '@/domain/character-manager/enterprise/entities/value-objects/domain-mastery';
import { SkillName, ProficiencyState } from '@/domain/character-manager/enterprise/entities/value-objects/skills-manager';
import { SpiritualStage } from '@/domain/character-manager/enterprise/entities/value-objects/spiritual-principle';
import { RestService, RestQuality } from '@/domain/character-manager/enterprise/services/rest-service';
import { PhysicalAttribute, MentalAttribute } from '@/domain/character-manager/enterprise/entities/value-objects/attribute-set';
import { ConditionName } from '@/domain/character-manager/enterprise/entities/value-objects/condition-manager';

import {
  AttributesSchema,
  NarrativeProfileSchema,
  SkillsSchema,
  PdaStateSchema,
  HealthStateSchema,
  EnergyStateSchema,
  SpiritualPrincipleSchema,
  EquipmentSlotsSchema,
  InventorySchema,
  UnarmedMasterySchema,
} from '@aetherium/rules-engine';

const INCLUDE = {
  powers: true,
  powerArrays: true,
  benefits: true,
  domains: true,
} as const;

@Injectable()
export class CharactersService {
  constructor(
    private prisma: PrismaService,
    private domainsLookupPort: DomainsLookupPort,
    private restService: RestService,
    private itemsLookupPort: ItemsLookupPort,
    private powersLookupPort: PowersLookupPort,
    private acquirePowerService: AcquirePowerService,
    private powerArraysLookupPort: PowerArraysLookupPort,
    private acquirePowerArrayService: AcquirePowerArrayService,
    private benefitsLookupPort: BenefitsLookupPort,
    private acquireBenefitService: AcquireBenefitService,
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

  private async saveDomainCharacter(tx: any, character: Character): Promise<void> {
    const { id, powers, powerArrays, benefits, domains, ...fields } =
      PrismaCharacterMapper.toPrisma(character);

    await tx.characterPower.deleteMany({ where: { characterId: id } });
    await tx.characterPowerArray.deleteMany({ where: { characterId: id } });
    await tx.characterBenefit.deleteMany({ where: { characterId: id } });
    await tx.characterDomain.deleteMany({ where: { characterId: id } });

    await tx.character.update({
      where: { id },
      data: {
        ...fields,
        powers,
        powerArrays,
        benefits,
        domains,
      },
    });

    DomainEvents.dispatchEventsForAggregate(character.id);
  }

  async create(userId: string, body: any) {
    const totalAttributes =
      body.attributes.strength +
      body.attributes.dexterity +
      body.attributes.constitution +
      body.attributes.intelligence +
      body.attributes.wisdom +
      body.attributes.charisma;

    if (totalAttributes > 67) {
      throw new DomainValidationError(`A soma dos atributos iniciais (${totalAttributes}) não pode exceder 67.`);
    }

    const narrativeProfile = NarrativeProfile.create(body.narrative);

    const attributes = AttributeSet.create({
      strength: Attribute.create({ baseValue: body.attributes.strength }),
      dexterity: Attribute.create({ baseValue: body.attributes.dexterity }),
      constitution: Attribute.create({ baseValue: body.attributes.constitution }),
      intelligence: Attribute.create({ baseValue: body.attributes.intelligence }),
      wisdom: Attribute.create({ baseValue: body.attributes.wisdom }),
      charisma: Attribute.create({ baseValue: body.attributes.charisma }),
      keyPhysical: body.attributes.keyPhysical,
      keyMental: body.attributes.keyMental,
    });

    const skills = SkillsManager.createInitial();

    const spiritualPrinciple = SpiritualPrinciple.create({
      isUnlocked: body.spiritualPrinciple.isUnlocked,
      stage: 'NORMAL',
    });

    const extraPda = body.spiritualPrinciple.isUnlocked ? 0 : 15;

    const pda = PdAManager.create({ level: 1, extraPda });

    const health = HealthManager.create({
      level: 1,
      constitutionModifier: attributes.constitution.baseModifier,
    });

    const energy = EnergyManager.create({
      keyPhysicalModifier: attributes[body.attributes.keyPhysical].baseModifier,
      keyMentalModifier: attributes[body.attributes.keyMental].baseModifier,
    });

    const slots = SlotManager.create({
      intelligenceModifier: attributes.intelligence.baseModifier,
    });

    const conditions = ConditionManager.create([]);
    const deathManager = DeathManager.create();

    const inventory = Inventory.create({ runics: 0, bag: [] });
    const equipment = EquipmentSlots.create({ hands: [], quickAccess: [], numberOfHands: 2 });

    const character = Character.create({
      userId: new UniqueEntityId(userId),
      level: 1,
      inspiration: 0,
      narrativeProfile,
      attributes,
      skills,
      spiritualPrinciple,
      domainMasteries: [],
      pda,
      health,
      energy,
      slots,
      conditions,
      deathManager,
      inventory,
      equipment,
      powers: new CharacterPowerList(),
      powerArrays: new CharacterPowerArrayList(),
      benefits: new CharacterBenefitList(),
    });

    const data = PrismaCharacterMapper.toPrisma(character);

    const raw = await this.prisma.character.create({
      data,
      include: INCLUDE,
    });

    DomainEvents.dispatchEventsForAggregate(character.id);

    return PrismaCharacterMapper.toDomain(raw);
  }

  async getById(id: string) {
    const raw = await this.prisma.character.findUnique({
      where: { id },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    const { migrated } = this.validateAndMigrateJSONB(raw);
    if (migrated) {
      const character = PrismaCharacterMapper.toDomain(raw);
      await this.prisma.character.update({
        where: { id },
        data: {
          attributes: raw.attributes as any,
          skills: raw.skills as any,
          pdaState: raw.pdaState as any,
          healthState: raw.healthState as any,
          energyState: raw.energyState as any,
          spiritualPrinciple: raw.spiritualPrinciple as any,
          equipmentSlots: raw.equipmentSlots as any,
          inventory: raw.inventory as any,
        },
      }).catch(() => {});
    }

    return PrismaCharacterMapper.toDomain(raw);
  }

  async fetchUserCharacters(userId: string) {
    const raws = await this.prisma.character.findMany({
      where: { userId },
      include: INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });

    return raws.map(PrismaCharacterMapper.toDomain);
  }

  async fetchAllCharacters(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.roles.includes('MASTER')) {
      throw new NotAllowedError('Acesso não autorizado');
    }

    const raws = await this.prisma.character.findMany({
      include: INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });

    return raws.map(PrismaCharacterMapper.toDomain);
  }

  async delete(id: string, userId: string) {
    const raw = await this.prisma.character.findUnique({
      where: { id },
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    await this.prisma.character.delete({
      where: { id },
    });
  }

  async updateAttributes(characterId: string, userId: string, attrProps: any) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    const newAttributes = AttributeSet.create({
      strength: Attribute.create({ baseValue: attrProps.strength }),
      dexterity: Attribute.create({ baseValue: attrProps.dexterity }),
      constitution: Attribute.create({ baseValue: attrProps.constitution }),
      intelligence: Attribute.create({ baseValue: attrProps.intelligence }),
      wisdom: Attribute.create({ baseValue: attrProps.wisdom }),
      charisma: Attribute.create({ baseValue: attrProps.charisma }),
      keyPhysical: attrProps.keyPhysical,
      keyMental: attrProps.keyMental,
    });

    character.updateAttributes(newAttributes);

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async updateSkills(
    characterId: string,
    userId: string,
    skillName: SkillName,
    proficiencyState: ProficiencyState,
    trainingBonusIncrease = 0,
  ) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    character.updateSkill(skillName, proficiencyState, trainingBonusIncrease, 0);

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async updateUnarmedMastery(characterId: string, userId: string, masteryProps: any) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError('Usuário não autorizado.');
    }

    const validationError = UnarmedMastery.validate(masteryProps);
    if (validationError) {
      throw new DomainValidationError(validationError, 'unarmedMastery');
    }

    const character = PrismaCharacterMapper.toDomain(raw);
    const newMastery = UnarmedMastery.create(masteryProps);

    const currentCost = character.unarmedMastery.totalPdaCost;
    const newCost = newMastery.totalPdaCost;
    const pdaDiff = newCost - currentCost;

    if (pdaDiff > character.pda.availablePda) {
      throw new DomainValidationError('PdA insuficiente para esta evolução.', 'pda');
    }

    if (pdaDiff > 0) {
      character.spendPda(pdaDiff);
    } else if (pdaDiff < 0) {
      character.refundPda(Math.abs(pdaDiff));
    }

    character.updateUnarmedMastery(newMastery);

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async acquireDomainMastery(
    characterId: string,
    userId: string,
    domainId: string,
    masteryLevel: MasteryLevel,
  ) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const domain = await this.domainsLookupPort.findById(domainId);

    if (!domain) {
      throw new ResourceNotFoundError('Domínio não encontrado');
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    if (domain.espiritual && !character.spiritualPrinciple.isUnlocked) {
      throw new DomainValidationError(
        `O domínio "${domain.nome}" é de natureza espiritual. Você precisa despertar seu Princípio Espiritual para adquiri-lo.`,
        'spiritualPrinciple',
      );
    }

    character.setDomainMastery(domainId, masteryLevel);

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async discardDomainMastery(characterId: string, userId: string, domainId: string) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    character.removeDomainMastery(domainId);

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async unlockSpiritualPrinciple(characterId: string, userId: string, stage: SpiritualStage = 'NORMAL') {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    character.unlockSpiritualPrinciple(stage);

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async evolveSpiritualPrinciple(characterId: string, userId: string) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    character.evolveSpiritualPrinciple();

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async levelUp(characterId: string, userId: string) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    character.levelUp();

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async rest(
    characterId: string,
    userId: string,
    quality: RestQuality,
    durationHours: number,
    hasCare: boolean,
  ) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    const roll = (sides: number) => Math.floor(Math.random() * sides) + 1;

    const result = this.restService.execute({
      quality,
      durationHours,
      hasCare,
      hasInjury: character.hasInjury,
      maxPV: character.health.maxPV,
      maxPE: character.energy.maxPE,
      currentPV: character.health.currentPV,
      currentPE: character.energy.currentPE,
      rolls: {
        pvRoll1: roll(character.health.maxPV),
        pvRoll2: roll(character.health.maxPV),
        peRoll1: roll(character.energy.maxPE),
        peRoll2: roll(character.energy.maxPE),
        injuryPenaltyPvRoll: roll(character.health.currentPV || 1),
        injuryPenaltyPeRoll: roll(character.energy.currentPE || 1),
      },
    });

    character.applyRestResult(result.pvChange, result.peChange);

    await this.saveDomainCharacter(this.prisma, character);

    return {
      character,
      pvChange: result.pvChange,
      peChange: result.peChange,
    };
  }

  async tickDeathCounter(characterId: string, userId: string) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    character.tickDeathCounter();

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async sync(characterId: string, userId: string, data: any) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    if (data.level !== undefined) {
      character.changeLevel(data.level);
    }

    if (data.narrative) {
      const newNarrative = NarrativeProfile.create(data.narrative);
      character.updateNarrative(newNarrative);
    }

    if (data.symbol !== undefined) {
      character.updateSymbol(data.symbol);
    }

    if (data.art !== undefined) {
      character.updateArt(data.art);
    }

    if (data.inspiration !== undefined) {
      character.updateInspiration(data.inspiration);
    }

    if (data.extraPda !== undefined) {
      character.updateExtraPda(data.extraPda);
    }

    if (data.pvChange !== undefined || data.peChange !== undefined) {
      character.applyRestResult(data.pvChange ?? 0, data.peChange ?? 0);
    }

    if (data.tempPvChange !== undefined && data.tempPvChange > 0) {
      character.addTemporaryPV(data.tempPvChange);
    }

    if (data.tempPeChange !== undefined && data.tempPeChange > 0) {
      character.addTemporaryPE(data.tempPeChange);
    }

    if (data.attributes) {
      const newAttributes = AttributeSet.create({
        strength: Attribute.create(data.attributes.strength),
        dexterity: Attribute.create(data.attributes.dexterity),
        constitution: Attribute.create(data.attributes.constitution),
        intelligence: Attribute.create(data.attributes.intelligence),
        wisdom: Attribute.create(data.attributes.wisdom),
        charisma: Attribute.create(data.attributes.charisma),
        keyPhysical: data.attributes.keyPhysical,
        keyMental: data.attributes.keyMental,
      });

      const allowedPoints = 67 + (character.level * (character.level + 1)) / 2;
      const spentPoints = newAttributes.totalBasePoints;

      if (spentPoints > allowedPoints) {
        throw new DomainValidationError(
          `Limite de atributos excedido. Gasto: ${spentPoints}, Máximo permitido para nível ${character.level}: ${allowedPoints}`,
          'attributes',
        );
      }

      character.updateAttributes(newAttributes);
    }

    if (data.skills) {
      for (const skillUpdate of data.skills) {
        character.updateSkill(
          skillUpdate.name,
          skillUpdate.state,
          skillUpdate.trainingBonus ?? 0,
          skillUpdate.extraBonus ?? 0,
        );
      }
    }

    if (data.conditions) {
      character.updateConditions(data.conditions);
    }

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async addItemToInventory(characterId: string, userId: string, itemId: string, quantity = 1) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

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

    const character = PrismaCharacterMapper.toDomain(raw);

    character.addToInventory(newInstanceId, quantity);

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async removeFromInventory(characterId: string, userId: string, itemId: string, quantity = 1) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    character.removeFromInventory(itemId, quantity);

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async changeInventoryItemQuantity(characterId: string, userId: string, itemId: string, quantity: number) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    const itemExistsInBag = character.inventory.bag.some((i) => i.itemId === itemId);
    if (!itemExistsInBag) {
      throw new ResourceNotFoundError('Item não encontrado no inventário');
    }

    character.setItemQuantityInInventory(itemId, quantity);

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async addRunics(characterId: string, userId: string, amount: number) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    character.addRunics(amount);

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async spendRunics(characterId: string, userId: string, amount: number) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    character.spendRunics(amount);

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async equipItem(
    characterId: string,
    userId: string,
    itemId: string,
    slot: EquipSlot,
    quantity = 1,
  ) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const item = await this.itemsLookupPort.findById(itemId);

    if (!item) {
      throw new ResourceNotFoundError('Item não encontrado');
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    const maxStack = item.maxStack ?? 1;

    const inInventory = character.inventory.bag.find(i => i.itemId === itemId);
    
    if (!inInventory || inInventory.quantity < quantity) {
      throw new DomainValidationError('Quantidade de item insuficiente no inventário.', 'itemId');
    }

    character.equipItem(itemId, slot, quantity, maxStack);

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async unequipItem(
    characterId: string,
    userId: string,
    itemId: string,
    slot: EquipSlot,
    quantity = 1,
  ) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    character.unequipItem(itemId, slot, quantity);

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async upgradeItem(
    characterId: string,
    userId: string,
    itemId: string,
    materialId: string,
    runicsCost: number,
  ) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const item = await this.itemsLookupPort.findById(itemId);

    if (!item) {
      throw new ResourceNotFoundError('Item não encontrado');
    }

    if (item.characterId !== characterId) {
      throw new DomainValidationError('Apenas itens vinculados à ficha podem ser aprimorados', 'itemId');
    }

    const currentUpgradeValue = item.upgradeLevel?.value ?? item.upgradeLevelValue;
    const maxUpgradeLimit = item.upgradeLevel?.maxLevel ?? item.upgradeLevelMax;

    if (typeof currentUpgradeValue !== 'number' || typeof maxUpgradeLimit !== 'number') {
      throw new DomainValidationError('Este item não suporta aprimoramentos', 'itemId');
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    const materialInInventory = character.inventory.bag.find(i => i.itemId === materialId);
    
    if (!materialInInventory || materialInInventory.quantity < 1) {
      throw new DomainValidationError('Material de aprimoramento não encontrado no inventário', 'materialId');
    }

    const material = await this.itemsLookupPort.findById(materialId);

    if (!material || material.tipo !== 'UPGRADE_MATERIAL') {
      throw new DomainValidationError('Item selecionado não é um material de aprimoramento válido', 'materialId');
    }

    if (currentUpgradeValue >= maxUpgradeLimit) {
      throw new DomainValidationError('O item já atingiu seu limite máximo de aprimoramento', 'itemId');
    }

    if (currentUpgradeValue >= material.maxUpgradeLimit) {
      throw new DomainValidationError(`O material fornecido suporta aprimoramentos apenas até o nível ${material.maxUpgradeLimit}. O item já está no nível ${currentUpgradeValue}.`, 'materialId');
    }

    character.spendRunics(runicsCost);

    character.removeFromInventory(materialId, 1);

    await this.itemsLookupPort.upgradeItem(itemId);

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async acquirePower(characterId: string, userId: string, powerId: string) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

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

    const character = PrismaCharacterMapper.toDomain(raw);

    const result = this.acquirePowerService.execute({
      character,
      powerId: newInstanceId,
      domainId: powerInfo.domainId,
      slotCost: powerInfo.slotCost,
      calculatedFinalCost: powerInfo.pdaCost,
    });

    if (result.isLeft()) {
      throw result.value;
    }

    await this.saveDomainCharacter(this.prisma, character);

    return {
      character,
      globalModificationIdToInject: result.value.globalModificationIdToInject,
    };
  }

  async equipPower(characterId: string, userId: string, powerId: string) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    character.equipPower(powerId);

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async unequipPower(characterId: string, userId: string, powerId: string) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    character.unequipPower(powerId);

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async deletePowerFromCharacter(characterId: string, userId: string, powerId: string) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    character.removePower(powerId);

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async acquirePowerArray(characterId: string, userId: string, powerArrayId: string) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

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

    const character = PrismaCharacterMapper.toDomain(raw);

    const result = this.acquirePowerArrayService.execute({
      character,
      powerArrayId: newInstanceId,
      domainId: arrayInfo.domainId,
      slotCost: arrayInfo.slotCost,
      calculatedFinalCost: arrayInfo.pdaCost,
    });

    if (result.isLeft()) {
      throw result.value;
    }

    await this.saveDomainCharacter(this.prisma, character);

    return {
      character,
      globalModificationIdToInject: result.value.globalModificationIdToInject,
    };
  }

  async equipPowerArray(characterId: string, userId: string, powerArrayId: string) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    character.equipPowerArray(powerArrayId);

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async unequipPowerArray(characterId: string, userId: string, powerArrayId: string) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    character.unequipPowerArray(powerArrayId);

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async deletePowerArrayFromCharacter(characterId: string, userId: string, powerArrayId: string) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    character.removePowerArray(powerArrayId);

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }

  async acquireBenefit(characterId: string, userId: string, benefitName: string, targetDegree: number) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const benefitInfo = await this.benefitsLookupPort.findByName(benefitName);

    if (!benefitInfo) {
      throw new ResourceNotFoundError('Benefício não encontrado');
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    const result = this.acquireBenefitService.execute({
      character,
      benefitCatalogEntry: benefitInfo,
      targetDegree,
    });

    if (result.isLeft()) {
      throw result.value;
    }

    await this.saveDomainCharacter(this.prisma, character);

    return {
      character,
      costPaid: result.value.costPaid,
    };
  }

  async discardBenefit(characterId: string, userId: string, benefitId: string) {
    const raw = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: INCLUDE,
    });

    if (!raw) {
      throw new ResourceNotFoundError('Personagem não encontrado');
    }

    if (raw.userId !== userId) {
      throw new NotAllowedError();
    }

    const character = PrismaCharacterMapper.toDomain(raw);

    character.removeBenefit(benefitId);

    await this.saveDomainCharacter(this.prisma, character);

    return character;
  }
}
