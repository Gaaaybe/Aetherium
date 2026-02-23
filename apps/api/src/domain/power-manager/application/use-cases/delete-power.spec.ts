import { describe, it, expect, beforeEach } from 'vitest';
import { DeletePowerUseCase } from './delete-power';
import { InMemoryPowersRepository } from '../test/in-memory-powers-repository';
import { Power } from '../../enterprise/entities/power';
import { EffectBase } from '../../enterprise/entities/effect-base';
import { InMemoryEffectsRepository } from '../test/in-memory-effects-repository';
import { AppliedEffect } from '../../enterprise/entities/applied-effect';
import { PowerCost } from '../../enterprise/entities/value-objects/power-cost';
import { Domain, DomainName } from '../../enterprise/entities/value-objects/domain';
import { PowerParameters } from '../../enterprise/entities/value-objects/power-parameters';
import { PowerEffectList } from '../../enterprise/entities/watched-lists/power-effect-list';

describe('DeletePowerUseCase', () => {
  let sut: DeletePowerUseCase;
  let powersRepository: InMemoryPowersRepository;
  let effectsRepository: InMemoryEffectsRepository;

  beforeEach(() => {
    powersRepository = new InMemoryPowersRepository();
    effectsRepository = new InMemoryEffectsRepository();
    sut = new DeletePowerUseCase(powersRepository);
  });

  it('should delete an existing power', async () => {
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
      nome: 'Rajada de Energia',
      descricao: 'Dispara uma rajada de energia',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
    });

    await powersRepository.create(power);

    expect(powersRepository.items).toHaveLength(1);

    const result = await sut.execute({
      powerId: power.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    expect(powersRepository.items).toHaveLength(0);
  });

  it('should return error if power does not exist', async () => {
    const result = await sut.execute({
      powerId: 'poder-inexistente',
    });

    expect(result.isLeft()).toBe(true);
  });

  it('should not affect other powers when deleting', async () => {
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
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
    });

    await powersRepository.create(power1);
    await powersRepository.create(power2);

    expect(powersRepository.items).toHaveLength(2);

    await sut.execute({
      powerId: power1.id.toString(),
    });

    expect(powersRepository.items).toHaveLength(1);
    expect(powersRepository.items[0].id.equals(power2.id)).toBe(true);
  });
});
