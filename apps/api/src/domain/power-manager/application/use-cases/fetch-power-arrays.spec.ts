import { describe, it, expect, beforeEach } from 'vitest';
import { FetchPowerArraysUseCase } from './fetch-power-arrays';
import { InMemoryPowerArraysRepository } from '../test/in-memory-power-arrays-repository';
import { InMemoryPowersRepository } from '../test/in-memory-powers-repository';
import { InMemoryEffectsRepository } from '../test/in-memory-effects-repository';
import { Power } from '../../enterprise/entities/power';
import { PowerArray } from '../../enterprise/entities/power-array';
import { EffectBase } from '../../enterprise/entities/effect-base';
import { AppliedEffect } from '../../enterprise/entities/applied-effect';
import { PowerCost } from '../../enterprise/entities/value-objects/power-cost';
import { Domain, DomainName } from '../../enterprise/entities/value-objects/domain';
import { PowerParameters } from '../../enterprise/entities/value-objects/power-parameters';
import { PowerEffectList } from '../../enterprise/entities/watched-lists/power-effect-list';
import { PowerArrayPowerList } from '../../enterprise/entities/watched-lists/power-array-power-list';

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
