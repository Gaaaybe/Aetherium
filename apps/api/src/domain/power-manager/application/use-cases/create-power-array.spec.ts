import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppliedEffect } from '../../enterprise/entities/applied-effect';
import { EffectBase } from '../../enterprise/entities/effect-base';
import { Power } from '../../enterprise/entities/power';
import { Domain, DomainName } from '../../enterprise/entities/value-objects/domain';
import { PowerCost } from '../../enterprise/entities/value-objects/power-cost';
import { PowerParameters } from '../../enterprise/entities/value-objects/power-parameters';
import { PowerEffectList } from '../../enterprise/entities/watched-lists/power-effect-list';
import { InMemoryEffectsRepository } from '@test/repositories/in-memory-effects-repository';
import { InMemoryPeculiaritiesRepository } from '@test/repositories/in-memory-peculiarities-repository';
import { InMemoryPowerArraysRepository } from '@test/repositories/in-memory-power-arrays-repository';
import { InMemoryPowersRepository } from '@test/repositories/in-memory-powers-repository';
import { DomainEvents } from '@/core/events/domain-events';
import { OnPowerArrayMadePublic } from '../subscribers/on-power-array-made-public';
import { OnPowerMadePublic } from '../subscribers/on-power-made-public';
import { CreatePowerArrayUseCase } from './create-power-array';

describe('CreatePowerArrayUseCase', () => {
  let sut: CreatePowerArrayUseCase;
  let powerArraysRepository: InMemoryPowerArraysRepository;
  let powersRepository: InMemoryPowersRepository;
  let effectsRepository: InMemoryEffectsRepository;
  let peculiaritiesRepository: InMemoryPeculiaritiesRepository;

  beforeEach(() => {
    powerArraysRepository = new InMemoryPowerArraysRepository();
    powersRepository = new InMemoryPowersRepository();
    effectsRepository = new InMemoryEffectsRepository();
    peculiaritiesRepository = new InMemoryPeculiaritiesRepository();

    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
    new OnPowerArrayMadePublic(powersRepository);
    new OnPowerMadePublic(peculiaritiesRepository);

    sut = new CreatePowerArrayUseCase(
      powerArraysRepository,
      powersRepository,
    );
  });

  afterEach(() => {
    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
  });

  it('should create a power array with multiple powers', async () => {
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

    const effectsList1 = new PowerEffectList();
    effectsList1.update([appliedEffect]);

    const power1 = Power.create({
      nome: 'Rajada 1',
      descricao: 'Primeiro poder',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList1,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
    });

    const effectsList2 = new PowerEffectList();
    effectsList2.update([appliedEffect]);

    const power2 = Power.create({
      nome: 'Rajada 2',
      descricao: 'Segundo poder',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList2,
      custoTotal: PowerCost.create({ pda: 15, pe: 0, espacos: 15 }),
    });

    await powersRepository.create(power1);
    await powersRepository.create(power2);

    const result = await sut.execute({
      nome: 'Acervo de Rajadas',
      descricao: 'Conjunto de poderes de rajada',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      powerIds: [power1.id.toString(), power2.id.toString()],
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.powerArray.nome).toBe('Acervo de Rajadas');
      expect(result.value.powerArray.powers.getItems()).toHaveLength(2);
      expect(result.value.powerArray.custoTotal.pda).toBe(25);
      expect(result.value.powerArray.custoTotal.espacos).toBe(25);
      expect(powerArraysRepository.items).toHaveLength(1);
    }
  });

  it('should create a power array with specific type', async () => {
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
      descricao: 'Poder de rajada',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
    });

    await powersRepository.create(power);

    const result = await sut.execute({
      nome: 'Meu Acervo de Poderes',
      descricao: 'Conjunto de poderes naturais',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      powerIds: [power.id.toString()],
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.powerArray.nome).toBe('Meu Acervo de Poderes');
      expect(result.value.powerArray.powers.getItems()).toHaveLength(1);
    }
  });

  it('should create a power array with base parameters', async () => {
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
      descricao: 'Poder de rajada',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
    });

    await powersRepository.create(power);

    const parametrosBase = PowerParameters.create({ acao: 1, alcance: 2, duracao: 3 });

    const result = await sut.execute({
      nome: 'Acervo com Parâmetros',
      descricao: 'Acervo com parâmetros base',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      powerIds: [power.id.toString()],
      parametrosBase,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.powerArray.parametrosBase).toBeDefined();
      expect(result.value.powerArray.parametrosBase?.acao).toBe(1);
      expect(result.value.powerArray.parametrosBase?.alcance).toBe(2);
      expect(result.value.powerArray.parametrosBase?.duracao).toBe(3);
    }
  });

  it('should return error if power not found', async () => {
    const result = await sut.execute({
      nome: 'Acervo Inválido',
      descricao: 'Não deve ser criado',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      powerIds: ['poder-inexistente'],
    });

    expect(result.isLeft()).toBe(true);
    expect(powerArraysRepository.items).toHaveLength(0);
  });

  it('should return error if any power in the list is not found', async () => {
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
      descricao: 'Poder de rajada',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
    });

    await powersRepository.create(power);

    const result = await sut.execute({
      nome: 'Acervo Parcialmente Inválido',
      descricao: 'Não deve ser criado',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      powerIds: [power.id.toString(), 'poder-inexistente'],
    });

    expect(result.isLeft()).toBe(true);
    expect(powerArraysRepository.items).toHaveLength(0);
  });

  it('should create a public power array and automatically publish private powers', async () => {
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

    const effectsList1 = new PowerEffectList();
    effectsList1.update([appliedEffect]);

    // Poder privado
    const privatePower = Power.create({
      nome: 'Poder Privado',
      descricao: 'Um poder privado',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList1,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
      userId: 'user-1',
      isPublic: false,
    });

    await powersRepository.create(privatePower);

    const result = await sut.execute({
      nome: 'Acervo Público',
      descricao: 'Acervo público - poder privado será publicado automaticamente',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      powerIds: [privatePower.id.toString()],
      userId: 'user-1',
      isPublic: true,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.powerArray.isPublic).toBe(true);
      expect(powerArraysRepository.items).toHaveLength(1);

      // Verificar que o poder privado foi publicado automaticamente
      const updatedPower = await powersRepository.findById(privatePower.id.toString());
      expect(updatedPower?.isPublic).toBe(true);
    }
  });

  it('should create a public power array with public and official powers', async () => {
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

    const effectsList1 = new PowerEffectList();
    effectsList1.update([appliedEffect]);

    const effectsList2 = new PowerEffectList();
    effectsList2.update([appliedEffect]);

    // Poder oficial
    const officialPower = Power.create({
      nome: 'Poder Oficial',
      descricao: 'Um poder oficial',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList1,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
    });

    // Poder público
    const publicPower = Power.create({
      nome: 'Poder Público',
      descricao: 'Um poder público',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList2,
      custoTotal: PowerCost.create({ pda: 15, pe: 0, espacos: 15 }),
      userId: 'user-2',
      isPublic: true,
    });

    await powersRepository.create(officialPower);
    await powersRepository.create(publicPower);

    const result = await sut.execute({
      nome: 'Acervo Público Válido',
      descricao: 'Acervo público com poderes acessíveis',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      powerIds: [officialPower.id.toString(), publicPower.id.toString()],
      userId: 'user-1',
      isPublic: true,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.powerArray.isPublic).toBe(true);
      expect(result.value.powerArray.powers.getItems()).toHaveLength(2);
      expect(powerArraysRepository.items).toHaveLength(1);
    }
  });
});
