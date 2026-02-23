import { describe, it, expect, beforeEach } from 'vitest';
import { UpdatePowerUseCase } from './update-power';
import { CalculatePowerCostUseCase } from './calculate-power-cost';
import { InMemoryPowersRepository } from '../test/in-memory-powers-repository';
import { InMemoryEffectsRepository } from '../test/in-memory-effects-repository';
import { InMemoryModificationsRepository } from '../test/in-memory-modifications-repository';
import { Power } from '../../enterprise/entities/power';
import { EffectBase } from '../../enterprise/entities/effect-base';
import { ModificationBase, ModificationType } from '../../enterprise/entities/modification-base';
import { AppliedEffect } from '../../enterprise/entities/applied-effect';
import { PowerCost } from '../../enterprise/entities/value-objects/power-cost';
import { Domain, DomainName } from '../../enterprise/entities/value-objects/domain';
import { PowerParameters } from '../../enterprise/entities/value-objects/power-parameters';
import { AppliedModification } from '../../enterprise/entities/value-objects/applied-modification';
import { PowerEffectList } from '../../enterprise/entities/watched-lists/power-effect-list';
import { PowerGlobalModificationList } from '../../enterprise/entities/watched-lists/power-global-modification-list';
import { AlternativeCost } from '../../enterprise/entities/value-objects/alternative-cost';

describe('UpdatePowerUseCase', () => {
  let sut: UpdatePowerUseCase;
  let powersRepository: InMemoryPowersRepository;
  let effectsRepository: InMemoryEffectsRepository;
  let modificationsRepository: InMemoryModificationsRepository;
  let calculatePowerCostUseCase: CalculatePowerCostUseCase;

  beforeEach(() => {
    powersRepository = new InMemoryPowersRepository();
    effectsRepository = new InMemoryEffectsRepository();
    modificationsRepository = new InMemoryModificationsRepository();
    calculatePowerCostUseCase = new CalculatePowerCostUseCase(
      effectsRepository,
      modificationsRepository,
    );
    sut = new UpdatePowerUseCase(powersRepository, calculatePowerCostUseCase);
  });

  it('should update power name', async () => {
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
      nome: 'Rajada Original',
      descricao: 'Descrição',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
    });

    await powersRepository.create(power);

    const result = await sut.execute({
      powerId: power.id.toString(),
      nome: 'Rajada Atualizada',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.power.nome).toBe('Rajada Atualizada');
      expect(result.value.power.descricao).toBe('Descrição');
    }
  });

  it('should update power description and parameters', async () => {
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
      descricao: 'Descrição antiga',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
    });

    await powersRepository.create(power);

    const newParams = PowerParameters.create({ acao: 1, alcance: 2, duracao: 3 });

    const result = await sut.execute({
      powerId: power.id.toString(),
      descricao: 'Descrição atualizada',
      parametros: newParams,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.power.descricao).toBe('Descrição atualizada');
      expect(result.value.power.parametros.acao).toBe(1);
      expect(result.value.power.parametros.alcance).toBe(2);
      expect(result.value.power.parametros.duracao).toBe(3);
    }
  });

  it('should update effects and recalculate cost', async () => {
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
      descricao: 'Descrição',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
    });

    await powersRepository.create(power);

    const newEffect = AppliedEffect.create({
      effectBaseId: 'dano',
      grau: 20,
      custo: PowerCost.createZero(),
    });

    const result = await sut.execute({
      powerId: power.id.toString(),
      effects: [newEffect],
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.power.effects.getItems()).toHaveLength(1);
      expect(result.value.power.effects.getItems()[0].grau).toBe(20);
      expect(result.value.power.custoTotal.pda).toBe(20);
    }
  });

  it('should update global modifications and recalculate cost', async () => {
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

    const effectsList = new PowerEffectList();
    effectsList.update([appliedEffect]);

    const power = Power.create({
      nome: 'Rajada',
      descricao: 'Descrição',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
    });

    await powersRepository.create(power);

    const globalModification = AppliedModification.createGlobal('sutil', 1);

    const result = await sut.execute({
      powerId: power.id.toString(),
      globalModifications: [globalModification],
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.power.globalModifications.getItems()).toHaveLength(1);
      expect(result.value.power.custoTotal.pda).toBe(20);
    }
  });

  it('should update alternative cost', async () => {
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
      descricao: 'Descrição',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
    });

    await powersRepository.create(power);

    const alternativeCost = AlternativeCost.createPE(15);

    const result = await sut.execute({
      powerId: power.id.toString(),
      custoAlternativo: alternativeCost,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.power.custoAlternativo).toBeDefined();
      expect(result.value.power.custoAlternativo?.quantidade).toBe(15);
    }
  });

  it('should return error if power not found', async () => {
    const result = await sut.execute({
      powerId: 'poder-inexistente',
      nome: 'Novo Nome',
    });

    expect(result.isLeft()).toBe(true);
  });

  it('should return error if effect base not found when updating effects', async () => {
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
      descricao: 'Descrição',
      dominio: Domain.create({ name: DomainName.NATURAL }),
      parametros: PowerParameters.createDefault(),
      effects: effectsList,
      custoTotal: PowerCost.create({ pda: 10, pe: 0, espacos: 10 }),
    });

    await powersRepository.create(power);

    const invalidEffect = AppliedEffect.create({
      effectBaseId: 'inexistente',
      grau: 10,
      custo: PowerCost.createZero(),
    });

    const result = await sut.execute({
      powerId: power.id.toString(),
      effects: [invalidEffect],
    });

    expect(result.isLeft()).toBe(true);
  });
});
