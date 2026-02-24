import { InMemoryEffectsRepository } from '@test/repositories/in-memory-effects-repository';
import { InMemoryModificationsRepository } from '@test/repositories/in-memory-modifications-repository';
import { InMemoryPeculiaritiesRepository } from '@test/repositories/in-memory-peculiarities-repository';
import { InMemoryPowersRepository } from '@test/repositories/in-memory-powers-repository';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DomainEvents } from '@/core/events/domain-events';
import { AppliedEffect } from '../../enterprise/entities/applied-effect';
import { EffectBase } from '../../enterprise/entities/effect-base';
import { ModificationBase, ModificationType } from '../../enterprise/entities/modification-base';
import { Peculiarity } from '../../enterprise/entities/peculiarity';
import { Power } from '../../enterprise/entities/power';
import { AlternativeCost } from '../../enterprise/entities/value-objects/alternative-cost';
import { AppliedModification } from '../../enterprise/entities/value-objects/applied-modification';
import { Domain, DomainName } from '../../enterprise/entities/value-objects/domain';
import { PowerCost } from '../../enterprise/entities/value-objects/power-cost';
import { PowerParameters } from '../../enterprise/entities/value-objects/power-parameters';
import { PowerEffectList } from '../../enterprise/entities/watched-lists/power-effect-list';
import { PowerCostCalculator } from '../../enterprise/services/power-cost-calculator';
import { OnPowerMadePublic } from '../subscribers/on-power-made-public';
import { UpdatePowerUseCase } from './update-power';

describe('UpdatePowerUseCase', () => {
  let sut: UpdatePowerUseCase;
  let powersRepository: InMemoryPowersRepository;
  let effectsRepository: InMemoryEffectsRepository;
  let modificationsRepository: InMemoryModificationsRepository;
  let peculiaritiesRepository: InMemoryPeculiaritiesRepository;
  let powerCostCalculator: PowerCostCalculator;
  const userId = 'user-1';

  beforeEach(() => {
    powersRepository = new InMemoryPowersRepository();
    effectsRepository = new InMemoryEffectsRepository();
    modificationsRepository = new InMemoryModificationsRepository();
    peculiaritiesRepository = new InMemoryPeculiaritiesRepository();
    powerCostCalculator = new PowerCostCalculator(effectsRepository, modificationsRepository);

    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
    new OnPowerMadePublic(peculiaritiesRepository);

    sut = new UpdatePowerUseCase(powersRepository, powerCostCalculator, peculiaritiesRepository);
  });

  afterEach(() => {
    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
  });

  it('should update power name', async () => {
    const effectBase = EffectBase.create({
      id: 'dano',
      nome: 'Dano',
      custoBase: 1,
      descricao: 'Causa dano',
      categorias: ['Ofensivo'],
    });

    await effectsRepository.create(effectBase);

    const appliedEffect = AppliedEffect.create({
      effectBaseId: 'dano',
      grau: 10,
      custo: PowerCost.createZero(),
    });

    const effectsList = new PowerEffectList();
    effectsList.update([appliedEffect]);

    const power = Power.create({
      nome: 'Rajada Original',
      descricao: 'Descrição',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
      userId,
    });

    await powersRepository.create(power);

    const result = await sut.execute({
      powerId: power.id.toString(),
      userId,
      nome: 'Rajada Atualizada',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.power.nome).toBe('Rajada Atualizada');
      expect(result.value.power.descricao).toBe('Descrição');
    }
  });

  it('should update power description and parameters', async () => {
    const effectBase = EffectBase.create({
      id: 'dano',
      nome: 'Dano',
      custoBase: 1,
      descricao: 'Causa dano',
      categorias: ['Ofensivo'],
    });

    await effectsRepository.create(effectBase);

    const appliedEffect = AppliedEffect.create({
      effectBaseId: 'dano',
      grau: 10,
      custo: PowerCost.createZero(),
    });

    const effectsList = new PowerEffectList();
    effectsList.update([appliedEffect]);

    const power = Power.create({
      nome: 'Rajada',
      descricao: 'Descrição antiga',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
      userId,
    });

    await powersRepository.create(power);

    const newParams = PowerParameters.create({ acao: 1, alcance: 2, duracao: 3 });

    const result = await sut.execute({
      powerId: power.id.toString(),
      userId,
      descricao: 'Descrição atualizada',
      parametros: newParams,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.power.descricao).toBe('Descrição atualizada');
      expect(result.value.power.parametros.acao).toBe(1);
      expect(result.value.power.parametros.alcance).toBe(2);
      expect(result.value.power.parametros.duracao).toBe(3);
    }
  });

  it('should update effects and recalculate cost', async () => {
    const effectBase = EffectBase.create({
      id: 'dano',
      nome: 'Dano',
      custoBase: 1,
      descricao: 'Causa dano',
      categorias: ['Ofensivo'],
    });

    await effectsRepository.create(effectBase);

    const appliedEffect = AppliedEffect.create({
      effectBaseId: 'dano',
      grau: 10,
      custo: PowerCost.createZero(),
    });

    const effectsList = new PowerEffectList();
    effectsList.update([appliedEffect]);

    const power = Power.create({
      nome: 'Rajada',
      descricao: 'Descrição',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
      userId,
    });

    await powersRepository.create(power);

    const newEffect = AppliedEffect.create({
      effectBaseId: 'dano',
      grau: 20,
      custo: PowerCost.createZero(),
    });

    const result = await sut.execute({
      powerId: power.id.toString(),
      userId,
      effects: [newEffect],
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.power.effects.getItems()).toHaveLength(1);
      expect(result.value.power.effects.getItems()[0].grau).toBe(20);
      expect(result.value.power.custoTotal.pda).toBe(20);
    }
  });

  it('should update global modifications and recalculate cost', async () => {
    const effectBase = EffectBase.create({
      id: 'dano',
      nome: 'Dano',
      custoBase: 1,
      descricao: 'Causa dano',
      categorias: ['Ofensivo'],
    });

    const modificationBase = ModificationBase.create({
      id: 'sutil',
      nome: 'Sutil',
      tipo: ModificationType.EXTRA,
      custoFixo: 0,
      custoPorGrau: 1,
      descricao: 'Efeito sutil',
      categoria: 'Gerais',
    });

    await effectsRepository.create(effectBase);
    await modificationsRepository.create(modificationBase);

    const appliedEffect = AppliedEffect.create({
      effectBaseId: 'dano',
      grau: 10,
      custo: PowerCost.createZero(),
    });

    const effectsList = new PowerEffectList();
    effectsList.update([appliedEffect]);

    const power = Power.create({
      nome: 'Rajada',
      descricao: 'Descrição',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
      userId,
    });

    await powersRepository.create(power);

    const globalModification = AppliedModification.createGlobal('sutil', 1);

    const result = await sut.execute({
      powerId: power.id.toString(),
      userId,
      globalModifications: [globalModification],
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.power.globalModifications.getItems()).toHaveLength(1);
      expect(result.value.power.custoTotal.pda).toBe(20);
    }
  });

  it('should update alternative cost', async () => {
    const effectBase = EffectBase.create({
      id: 'dano',
      nome: 'Dano',
      custoBase: 1,
      descricao: 'Causa dano',
      categorias: ['Ofensivo'],
    });

    await effectsRepository.create(effectBase);

    const appliedEffect = AppliedEffect.create({
      effectBaseId: 'dano',
      grau: 10,
      custo: PowerCost.createZero(),
    });

    const effectsList = new PowerEffectList();
    effectsList.update([appliedEffect]);

    const power = Power.create({
      nome: 'Rajada',
      descricao: 'Descrição',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
      userId,
    });

    await powersRepository.create(power);

    const alternativeCost = AlternativeCost.createPE(15);

    const result = await sut.execute({
      powerId: power.id.toString(),
      userId,
      custoAlternativo: alternativeCost,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.power.custoAlternativo).toBeDefined();
      expect(result.value.power.custoAlternativo?.quantidade).toBe(15);
    }
  });

  it('should return error if power not found', async () => {
    const result = await sut.execute({
      powerId: 'poder-inexistente',
      userId,
      nome: 'Novo Nome',
    });

    expect(result.isLeft()).toBe(true);
  });

  it('should return error if effect base not found when updating effects', async () => {
    const effectBase = EffectBase.create({
      id: 'dano',
      nome: 'Dano',
      custoBase: 1,
      descricao: 'Causa dano',
      categorias: ['Ofensivo'],
    });

    await effectsRepository.create(effectBase);

    const appliedEffect = AppliedEffect.create({
      effectBaseId: 'dano',
      grau: 10,
      custo: PowerCost.createZero(),
    });

    const effectsList = new PowerEffectList();
    effectsList.update([appliedEffect]);

    const power = Power.create({
      nome: 'Rajada',
      descricao: 'Descrição',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
      userId,
    });

    await powersRepository.create(power);

    const invalidEffect = AppliedEffect.create({
      effectBaseId: 'inexistente',
      grau: 10,
      custo: PowerCost.createZero(),
    });

    const result = await sut.execute({
      powerId: power.id.toString(),
      userId,
      effects: [invalidEffect],
    });

    expect(result.isLeft()).toBe(true);
  });

  it('should make a private power public', async () => {
    const effectBase = EffectBase.create({
      id: 'dano',
      nome: 'Dano',
      custoBase: 1,
      descricao: 'Causa dano',
      categorias: ['Ofensivo'],
    });

    await effectsRepository.create(effectBase);

    const appliedEffect = AppliedEffect.create({
      effectBaseId: 'dano',
      grau: 10,
      custo: PowerCost.createZero(),
    });

    const effectsList = new PowerEffectList();
    effectsList.update([appliedEffect]);

    const power = Power.create({
      nome: 'Poder Privado',
      descricao: 'Um poder privado',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
      userId,
      isPublic: false,
    });

    await powersRepository.create(power);

    const result = await sut.execute({
      powerId: power.id.toString(),
      userId,
      isPublic: true,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.power.isPublic).toBe(true);
      expect(result.value.power.userId).toBe('user-1');
    }
  });

  it('should make a public power private', async () => {
    const effectBase = EffectBase.create({
      id: 'dano',
      nome: 'Dano',
      custoBase: 1,
      descricao: 'Causa dano',
      categorias: ['Ofensivo'],
    });

    await effectsRepository.create(effectBase);

    const appliedEffect = AppliedEffect.create({
      effectBaseId: 'dano',
      grau: 10,
      custo: PowerCost.createZero(),
    });

    const effectsList = new PowerEffectList();
    effectsList.update([appliedEffect]);

    const power = Power.create({
      nome: 'Poder Público',
      descricao: 'Um poder público',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
      userId,
      isPublic: true,
    });

    await powersRepository.create(power);

    const result = await sut.execute({
      powerId: power.id.toString(),
      userId,
      isPublic: false,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.power.isPublic).toBe(false);
      expect(result.value.power.userId).toBe('user-1');
    }
  });

  it('should make power public and automatically publish referenced private peculiarity', async () => {
    const peculiarity = Peculiarity.create({
      nome: 'Peculiaridade Privada',
      descricao: 'Uma peculiaridade privada',
      userId,
      espiritual: false,
      isPublic: false,
    });

    await peculiaritiesRepository.create(peculiarity);

    const effectBase = EffectBase.create({
      id: 'dano',
      nome: 'Dano',
      custoBase: 1,
      descricao: 'Causa dano',
      categorias: ['Ofensivo'],
    });

    await effectsRepository.create(effectBase);

    const appliedEffect = AppliedEffect.create({
      effectBaseId: 'dano',
      grau: 10,
      custo: PowerCost.createZero(),
    });

    const effectsList = new PowerEffectList();
    effectsList.update([appliedEffect]);

    const power = Power.create({
      nome: 'Poder Peculiar',
      descricao: 'Poder com peculiaridade privada',
      dominio: Domain.create({
        name: DomainName.PECULIAR,
        peculiarId: peculiarity.id.toString(),
      }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
      userId,
      isPublic: false,
    });

    await powersRepository.create(power);

    const result = await sut.execute({
      powerId: power.id.toString(),
      userId,
      isPublic: true,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.power.isPublic).toBe(true);

      // Verificar que a peculiaridade foi publicada automaticamente
      const updatedPeculiarity = await peculiaritiesRepository.findById(peculiarity.id.toString());
      expect(updatedPeculiarity?.isPublic).toBe(true);
    }
  });

  it('should make power public if it references a public peculiarity', async () => {
    const peculiarity = Peculiarity.create({
      nome: 'Peculiaridade Pública',
      descricao: 'Uma peculiaridade pública',
      userId,
      espiritual: false,
      isPublic: true,
    });

    await peculiaritiesRepository.create(peculiarity);

    const effectBase = EffectBase.create({
      id: 'dano',
      nome: 'Dano',
      custoBase: 1,
      descricao: 'Causa dano',
      categorias: ['Ofensivo'],
    });

    await effectsRepository.create(effectBase);

    const appliedEffect = AppliedEffect.create({
      effectBaseId: 'dano',
      grau: 10,
      custo: PowerCost.createZero(),
    });

    const effectsList = new PowerEffectList();
    effectsList.update([appliedEffect]);

    const power = Power.create({
      nome: 'Poder Peculiar',
      descricao: 'Poder com peculiaridade pública',
      dominio: Domain.create({
        name: DomainName.PECULIAR,
        peculiarId: peculiarity.id.toString(),
      }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
      userId,
      isPublic: false,
    });

    await powersRepository.create(power);

    const result = await sut.execute({
      powerId: power.id.toString(),
      userId,
      isPublic: true,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.power.isPublic).toBe(true);
    }
  });
});
