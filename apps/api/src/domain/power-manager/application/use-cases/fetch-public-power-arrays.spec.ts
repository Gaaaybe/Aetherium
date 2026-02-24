import { InMemoryEffectsRepository } from '@test/repositories/in-memory-effects-repository';
import { InMemoryPowerArraysRepository } from '@test/repositories/in-memory-power-arrays-repository';
import { InMemoryPowersRepository } from '@test/repositories/in-memory-powers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppliedEffect } from '../../enterprise/entities/applied-effect';
import { EffectBase } from '../../enterprise/entities/effect-base';
import { Power } from '../../enterprise/entities/power';
import { PowerArray } from '../../enterprise/entities/power-array';
import { Domain, DomainName } from '../../enterprise/entities/value-objects/domain';
import { PowerCost } from '../../enterprise/entities/value-objects/power-cost';
import { PowerParameters } from '../../enterprise/entities/value-objects/power-parameters';
import { PowerArrayPowerList } from '../../enterprise/entities/watched-lists/power-array-power-list';
import { PowerEffectList } from '../../enterprise/entities/watched-lists/power-effect-list';
import { FetchPowerArraysUseCase } from './fetch-public-power-arrays';

describe('FetchPowerArraysUseCase', () => {
  let sut: FetchPowerArraysUseCase;
  let powerArraysRepository: InMemoryPowerArraysRepository;
  let powersRepository: InMemoryPowersRepository;
  let effectsRepository: InMemoryEffectsRepository;

  beforeEach(() => {
    powerArraysRepository = new InMemoryPowerArraysRepository();
    powersRepository = new InMemoryPowersRepository();
    effectsRepository = new InMemoryEffectsRepository();
    sut = new FetchPowerArraysUseCase(powerArraysRepository);
  });

  it('should fetch power arrays', async () => {
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

    const powerArray1 = PowerArray.create({
      nome: 'Acervo 1',
      descricao: 'Primeiro acervo',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      powers: powersList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
    });

    const powerArray2 = PowerArray.create({
      nome: 'Acervo 2',
      descricao: 'Segundo acervo',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      powers: powersList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
    });

    await powerArraysRepository.create(powerArray1);
    await powerArraysRepository.create(powerArray2);

    const result = await sut.execute({ page: 1 });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.powerArrays).toHaveLength(2);
      expect(result.value.powerArrays[0].nome).toBe('Acervo 1');
      expect(result.value.powerArrays[1].nome).toBe('Acervo 2');
    }
  });

  it('should paginate power arrays', async () => {
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

    // Create 22 power arrays
    for (let i = 1; i <= 22; i++) {
      const powerArray = PowerArray.create({
        nome: `Acervo ${i}`,
        descricao: `Acervo número ${i}`,
        dominio: Domain.create({ name: DomainName.NATURAL }),
        powers: powersList,
        custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
      });
      await powerArraysRepository.create(powerArray);
    }

    const resultPage1 = await sut.execute({ page: 1 });
    const resultPage2 = await sut.execute({ page: 2 });

    expect(resultPage1.isRight()).toBe(true);
    expect(resultPage2.isRight()).toBe(true);

    if (resultPage1.isRight() && resultPage2.isRight()) {
      expect(resultPage1.value.powerArrays).toHaveLength(20);
      expect(resultPage2.value.powerArrays).toHaveLength(2);
    }
  });
});
