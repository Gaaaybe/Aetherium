import { describe, it, expect, beforeEach } from 'vitest';
import { UpdatePowerArrayUseCase } from './update-power-array';
import { InMemoryPowerArraysRepository } from '../test/in-memory-power-arrays-repository';
import { InMemoryPowersRepository } from '../test/in-memory-powers-repository';
import { InMemoryEffectsRepository } from '../test/in-memory-effects-repository';
import { Power } from '../../enterprise/entities/power';
import { PowerArray, PowerArrayType } from '../../enterprise/entities/power-array';
import { EffectBase } from '../../enterprise/entities/effect-base';
import { AppliedEffect } from '../../enterprise/entities/applied-effect';
import { PowerCost } from '../../enterprise/entities/value-objects/power-cost';
import { Domain, DomainName } from '../../enterprise/entities/value-objects/domain';
import { PowerParameters } from '../../enterprise/entities/value-objects/power-parameters';
import { PowerEffectList } from '../../enterprise/entities/watched-lists/power-effect-list';
import { PowerArrayPowerList } from '../../enterprise/entities/watched-lists/power-array-power-list';

describe('UpdatePowerArrayUseCase', () => {
  let sut: UpdatePowerArrayUseCase;
  let powerArraysRepository: InMemoryPowerArraysRepository;
  let powersRepository: InMemoryPowersRepository;
  let effectsRepository: InMemoryEffectsRepository;

  beforeEach(() => {
    powerArraysRepository = new InMemoryPowerArraysRepository();
    powersRepository = new InMemoryPowersRepository();
    effectsRepository = new InMemoryEffectsRepository();
    sut = new UpdatePowerArrayUseCase(powerArraysRepository, powersRepository);
  });

  it('should update power array name', async () => {
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

    const powersList = new PowerArrayPowerList();
    powersList.update([power]);

    const powerArray = PowerArray.create({
      nome: 'Acervo Original',
      descricao: 'Descrição',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      powers: powersList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
    });

    await powerArraysRepository.create(powerArray);

    const result = await sut.execute({
      powerArrayId: powerArray.id.toString(),
      nome: 'Acervo Atualizado',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.powerArray.nome).toBe('Acervo Atualizado');
      expect(result.value.powerArray.descricao).toBe('Descrição');
    }
  });

  it('should update power array description and type', async () => {
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

    const powersList = new PowerArrayPowerList();
    powersList.update([power]);

    const powerArray = PowerArray.create({
      nome: 'Acervo',
      descricao: 'Descrição antiga',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      powers: powersList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
      tipo: PowerArrayType.NORMAL,
    });

    await powerArraysRepository.create(powerArray);

    const result = await sut.execute({
      powerArrayId: powerArray.id.toString(),
      descricao: 'Descrição atualizada',
      tipo: PowerArrayType.ALTERNADO,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.powerArray.descricao).toBe('Descrição atualizada');
      expect(result.value.powerArray.tipo).toBe(PowerArrayType.ALTERNADO);
      expect(result.value.powerArray.isAlternado()).toBe(true);
    }
  });

  it('should update powers and recalculate cost', async () => {
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
      custoTotal: PowerCost.create({ pda: 20, pe: 0, espacos: 20 }),
    });

    await powersRepository.create(power1);
    await powersRepository.create(power2);

    const powersList = new PowerArrayPowerList();
    powersList.update([power1]);

    const powerArray = PowerArray.create({
      nome: 'Acervo',
      descricao: 'Descrição',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      powers: powersList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
    });

    await powerArraysRepository.create(powerArray);

    const result = await sut.execute({
      powerArrayId: powerArray.id.toString(),
      powerIds: [power1.id.toString(), power2.id.toString()],
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.powerArray.powers.getItems()).toHaveLength(2);
      expect(result.value.powerArray.custoTotal.pda).toBe(30);
      expect(result.value.powerArray.custoTotal.espacos).toBe(30);
    }
  });

  it('should update base parameters', async () => {
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

    const powersList = new PowerArrayPowerList();
    powersList.update([power]);

    const powerArray = PowerArray.create({
      nome: 'Acervo',
      descricao: 'Descrição',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      powers: powersList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
    });

    await powerArraysRepository.create(powerArray);

    const newParams = PowerParameters.create({ acao: 1, alcance: 2, duracao: 3 });

    const result = await sut.execute({
      powerArrayId: powerArray.id.toString(),
      parametrosBase: newParams,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.powerArray.parametrosBase).toBeDefined();
      expect(result.value.powerArray.parametrosBase?.acao).toBe(1);
      expect(result.value.powerArray.parametrosBase?.alcance).toBe(2);
      expect(result.value.powerArray.parametrosBase?.duracao).toBe(3);
    }
  });

  it('should return error if power array not found', async () => {
    const result = await sut.execute({
      powerArrayId: 'acervo-inexistente',
      nome: 'Novo Nome',
    });

    expect(result.isLeft()).toBe(true);
  });

  it('should return error if power not found when updating powers', async () => {
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

    const powersList = new PowerArrayPowerList();
    powersList.update([power]);

    const powerArray = PowerArray.create({
      nome: 'Acervo',
      descricao: 'Descrição',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      powers: powersList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
    });

    await powerArraysRepository.create(powerArray);

    const result = await sut.execute({
      powerArrayId: powerArray.id.toString(),
      powerIds: ['poder-inexistente'],
    });

    expect(result.isLeft()).toBe(true);
  });
});
