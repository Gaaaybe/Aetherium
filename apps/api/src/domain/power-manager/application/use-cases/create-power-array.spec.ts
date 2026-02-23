import { describe, it, expect, beforeEach } from 'vitest';
import { CreatePowerArrayUseCase } from './create-power-array';
import { InMemoryPowerArraysRepository } from '../test/in-memory-power-arrays-repository';
import { InMemoryPowersRepository } from '../test/in-memory-powers-repository';
import { InMemoryEffectsRepository } from '../test/in-memory-effects-repository';
import { Power } from '../../enterprise/entities/power';
import { PowerArrayType } from '../../enterprise/entities/power-array';
import { EffectBase } from '../../enterprise/entities/effect-base';
import { AppliedEffect } from '../../enterprise/entities/applied-effect';
import { PowerCost } from '../../enterprise/entities/value-objects/power-cost';
import { Domain, DomainName } from '../../enterprise/entities/value-objects/domain';
import { PowerParameters } from '../../enterprise/entities/value-objects/power-parameters';
import { PowerEffectList } from '../../enterprise/entities/watched-lists/power-effect-list';

describe('CreatePowerArrayUseCase', () => {
  let sut: CreatePowerArrayUseCase;
  let powerArraysRepository: InMemoryPowerArraysRepository;
  let powersRepository: InMemoryPowersRepository;
  let effectsRepository: InMemoryEffectsRepository;

  beforeEach(() => {
    powerArraysRepository = new InMemoryPowerArraysRepository();
    powersRepository = new InMemoryPowersRepository();
    effectsRepository = new InMemoryEffectsRepository();
    sut = new CreatePowerArrayUseCase(powerArraysRepository, powersRepository);
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
      nome: 'Acervo Alternado',
      descricao: 'Poderes alternados',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      powerIds: [power.id.toString()],
      tipo: PowerArrayType.ALTERNADO,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.powerArray.tipo).toBe(PowerArrayType.ALTERNADO);
      expect(result.value.powerArray.isAlternado()).toBe(true);
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
});
