import { InMemoryEffectsRepository } from '@test/repositories/in-memory-effects-repository';
import { InMemoryModificationsRepository } from '@test/repositories/in-memory-modifications-repository';
import { InMemoryPeculiaritiesRepository } from '@test/repositories/in-memory-peculiarities-repository';
import { InMemoryPowersRepository } from '@test/repositories/in-memory-powers-repository';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DomainEvents } from '@/core/events/domain-events';
import { AppliedEffect } from '../../enterprise/entities/applied-effect';
import { EffectBase } from '../../enterprise/entities/effect-base';
import { ModificationBase, ModificationType } from '../../enterprise/entities/modification-base';
import {
  AlternativeCost,
  AlternativeCostType,
} from '../../enterprise/entities/value-objects/alternative-cost';
import { AppliedModification } from '../../enterprise/entities/value-objects/applied-modification';
import { Domain, DomainName } from '../../enterprise/entities/value-objects/domain';
import { PowerCost } from '../../enterprise/entities/value-objects/power-cost';
import { PowerParameters } from '../../enterprise/entities/value-objects/power-parameters';
import { PowerCostCalculator } from '../../enterprise/services/power-cost-calculator';
import { OnPowerMadePublic } from '../subscribers/on-power-made-public';
import { CreatePowerUseCase } from './create-power';

describe('CreatePowerUseCase', () => {
  let sut: CreatePowerUseCase;
  let powersRepository: InMemoryPowersRepository;
  let effectsRepository: InMemoryEffectsRepository;
  let modificationsRepository: InMemoryModificationsRepository;
  let peculiaritiesRepository: InMemoryPeculiaritiesRepository;
  let powerCostCalculator: PowerCostCalculator;

  beforeEach(() => {
    powersRepository = new InMemoryPowersRepository();
    effectsRepository = new InMemoryEffectsRepository();
    modificationsRepository = new InMemoryModificationsRepository();
    peculiaritiesRepository = new InMemoryPeculiaritiesRepository();
    powerCostCalculator = new PowerCostCalculator(effectsRepository, modificationsRepository);

    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
    new OnPowerMadePublic(peculiaritiesRepository);

    sut = new CreatePowerUseCase(powersRepository, powerCostCalculator, peculiaritiesRepository);
  });

  afterEach(() => {
    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
  });

  it('should create a simple power without modifications', async () => {
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

    const result = await sut.execute({
      nome: 'Rajada de Energia',
      descricao: 'Dispara uma rajada de energia',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: [appliedEffect],
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.power.nome).toBe('Rajada de Energia');
      expect(result.value.power.custoTotal.pda).toBe(10);
      expect(result.value.power.isOfficial()).toBe(true);
      expect(result.value.power.userId).toBeUndefined();
      expect(powersRepository.items).toHaveLength(1);
    }
  });

  it('should create a power with global modifications', async () => {
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

    const globalModification = AppliedModification.createGlobal('sutil', 1);

    const result = await sut.execute({
      nome: 'Rajada Sutil',
      descricao: 'Dispara uma rajada sutil',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: [appliedEffect],
      globalModifications: [globalModification],
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.power.hasGlobalModifications()).toBe(true);
      expect(result.value.power.globalModifications.getItems()).toHaveLength(1);
      expect(result.value.power.custoTotal.pda).toBe(20);
    }
  });

  it('should create a power with alternative cost', async () => {
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
      grau: 5,
      custo: PowerCost.createZero(),
    });

    const alternativeCost = AlternativeCost.createPE(10);

    const result = await sut.execute({
      nome: 'Rajada de PE',
      descricao: 'Dispara usando PE',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: [appliedEffect],
      custoAlternativo: alternativeCost,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.power.custoAlternativo).toBeDefined();
      expect(result.value.power.custoAlternativo?.tipo).toBe(AlternativeCostType.PE);
      expect(result.value.power.custoAlternativo?.quantidade).toBe(10);
    }
  });

  it('should return error if effect base not found', async () => {
    const appliedEffect = AppliedEffect.create({
      effectBaseId: 'inexistente',
      grau: 10,
      custo: PowerCost.createZero(),
    });

    const result = await sut.execute({
      nome: 'Poder Inválido',
      descricao: 'Não deve ser criado',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: [appliedEffect],
    });

    expect(result.isLeft()).toBe(true);
    expect(powersRepository.items).toHaveLength(0);
  });

  it('should return error if modification base not found', async () => {
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

    const globalModification = AppliedModification.createGlobal('inexistente', 1);

    const result = await sut.execute({
      nome: 'Poder Inválido',
      descricao: 'Não deve ser criado',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: [appliedEffect],
      globalModifications: [globalModification],
    });

    expect(result.isLeft()).toBe(true);
    expect(powersRepository.items).toHaveLength(0);
  });
});
