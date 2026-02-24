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
import { InMemoryEffectsRepository } from '@test/repositories/in-memory-effects-repository';
import { InMemoryPowerArraysRepository } from '@test/repositories/in-memory-power-arrays-repository';
import { InMemoryPowersRepository } from '@test/repositories/in-memory-powers-repository';
import { GetPowerArrayByIdUseCase } from './get-power-array-by-id';

describe('GetPowerArrayByIdUseCase', () => {
  let sut: GetPowerArrayByIdUseCase;
  let powerArraysRepository: InMemoryPowerArraysRepository;
  let powersRepository: InMemoryPowersRepository;
  let effectsRepository: InMemoryEffectsRepository;

  beforeEach(() => {
    powerArraysRepository = new InMemoryPowerArraysRepository();
    powersRepository = new InMemoryPowersRepository();
    effectsRepository = new InMemoryEffectsRepository();
    sut = new GetPowerArrayByIdUseCase(powerArraysRepository);
  });

  it('should get power array by id', async () => {
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
      nome: 'Acervo de Teste',
      descricao: 'Descrição do acervo',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      powers: powersList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
    });

    await powerArraysRepository.create(powerArray);

    const result = await sut.execute({
      powerArrayId: powerArray.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.powerArray.id.toString()).toBe(powerArray.id.toString());
      expect(result.value.powerArray.nome).toBe('Acervo de Teste');
    }
  });

  it('should return error if power array not found', async () => {
    const result = await sut.execute({
      powerArrayId: 'acervo-inexistente',
    });

    expect(result.isLeft()).toBe(true);
  });
});
