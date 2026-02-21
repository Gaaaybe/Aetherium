import { describe, it, expect, beforeEach } from 'vitest';
import { DeletePowerArrayUseCase } from './delete-power-array';
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

describe('DeletePowerArrayUseCase', () => {
  let sut: DeletePowerArrayUseCase;
  let powerArraysRepository: InMemoryPowerArraysRepository;
  let powersRepository: InMemoryPowersRepository;
  let effectsRepository: InMemoryEffectsRepository;

  beforeEach(() => {
    powerArraysRepository = new InMemoryPowerArraysRepository();
    powersRepository = new InMemoryPowersRepository();
    effectsRepository = new InMemoryEffectsRepository();
    sut = new DeletePowerArrayUseCase(powerArraysRepository);
  });

  it('should delete a power array', async () => {
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
    });

    expect(result.isRight()).toBe(true);
    expect(await powerArraysRepository.findById(powerArray.id.toString())).toBeNull();
  });

  it('should return error if power array not found', async () => {
    const result = await sut.execute({
      powerArrayId: 'acervo-inexistente',
    });

    expect(result.isLeft()).toBe(true);
  });
});
