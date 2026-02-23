import { describe, it, expect, beforeEach } from 'vitest';
import { FetchPowersUseCase } from './fetch-powers';
import { InMemoryPowersRepository } from '../test/in-memory-powers-repository';
import { Power } from '../../enterprise/entities/power';
import { EffectBase } from '../../enterprise/entities/effect-base';
import { InMemoryEffectsRepository } from '../test/in-memory-effects-repository';
import { AppliedEffect } from '../../enterprise/entities/applied-effect';
import { PowerCost } from '../../enterprise/entities/value-objects/power-cost';
import { Domain, DomainName } from '../../enterprise/entities/value-objects/domain';
import { PowerParameters } from '../../enterprise/entities/value-objects/power-parameters';
import { PowerEffectList } from '../../enterprise/entities/watched-lists/power-effect-list';

describe('FetchPowersUseCase', () => {
  let sut: FetchPowersUseCase;
  let powersRepository: InMemoryPowersRepository;
  let effectsRepository: InMemoryEffectsRepository;

  beforeEach(() => {
    powersRepository = new InMemoryPowersRepository();
    effectsRepository = new InMemoryEffectsRepository();
    sut = new FetchPowersUseCase(powersRepository);
  });

  it('should fetch all powers', async () => {
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

    const result = await sut.execute({
      page: 1,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.powers).toHaveLength(2);
      expect(result.value.powers[0].nome).toBe('Rajada 1');
      expect(result.value.powers[1].nome).toBe('Rajada 2');
    }
  });

  it('should return empty array when no powers exist', async () => {
    const result = await sut.execute({
      page: 1,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.powers).toHaveLength(0);
    }
  });

  it('should paginate results (20 per page)', async () => {
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

    // Criar 25 poderes
    for (let i = 1; i <= 25; i++) {
      const effectsList = new PowerEffectList();
      effectsList.update([appliedEffect]);

      const power = Power.create({
        nome: `Poder ${i}`,
        descricao: `Descrição ${i}`,
        dominio: Domain.create({ name: DomainName.NATURAL }),
        parametros: PowerParameters.createDefault(),
        effects: effectsList,
        custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
      });

      await powersRepository.create(power);
    }

    // Página 1 deve ter 20 poderes
    const resultPage1 = await sut.execute({
      page: 1,
    });

    expect(resultPage1.isRight()).toBe(true);
    if (resultPage1.isRight()) {
      expect(resultPage1.value.powers).toHaveLength(20);
      expect(resultPage1.value.powers[0].nome).toBe('Poder 1');
    }

    // Página 2 deve ter 5 poderes
    const resultPage2 = await sut.execute({
      page: 2,
    });

    expect(resultPage2.isRight()).toBe(true);
    if (resultPage2.isRight()) {
      expect(resultPage2.value.powers).toHaveLength(5);
      expect(resultPage2.value.powers[0].nome).toBe('Poder 21');
    }
  });
});
