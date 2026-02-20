import { describe, it, expect, beforeEach } from 'vitest';
import { CalculatePowerCostUseCase } from './calculate-power-cost';
import { InMemoryEffectsRepository } from '../test/in-memory-effects-repository';
import { InMemoryModificationsRepository } from '../test/in-memory-modifications-repository';
import { EffectBase } from '../../enterprise/entities/effect-base';
import { ModificationBase, ModificationType } from '../../enterprise/entities/modification-base';
import { AppliedEffect } from '../../enterprise/entities/applied-effect';
import { PowerCost } from '../../enterprise/entities/value-objects/power-cost';
import {
  AppliedModification,
  ModificationScope,
} from '../../enterprise/entities/value-objects/applied-modification';

describe('CalculatePowerCostUseCase', () => {
  let sut: CalculatePowerCostUseCase;
  let effectsRepository: InMemoryEffectsRepository;
  let modificationsRepository: InMemoryModificationsRepository;

  beforeEach(() => {
    effectsRepository = new InMemoryEffectsRepository();
    modificationsRepository = new InMemoryModificationsRepository();
    sut = new CalculatePowerCostUseCase(effectsRepository, modificationsRepository);
  });

  it('should calculate cost for a simple effect without modifications', async () => {
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

    const result = await sut.execute({
      effects: [appliedEffect],
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.custoTotal.pda).toBe(10);
      expect(result.value.custoTotal.espacos).toBe(10);
    }
  });

  it('should calculate cost with extra modification', async () => {
    const effectBase = EffectBase.create({
      id: 'dano',
      nome: 'Dano',
      custoBase: 1,
      
      descricao: 'Causa dano',
      categorias: ['Ofensivo'],
    });

    const modificationBase = ModificationBase.create({
      id: 'area',
      nome: 'Área',
      tipo: ModificationType.EXTRA,
      custoFixo: 0,
      custoPorGrau: 1,
      descricao: 'Afeta uma área',
      categoria: 'Alcance e Área',
    });

    await effectsRepository.create(effectBase);
    await modificationsRepository.create(modificationBase);

    const appliedModification = AppliedModification.create({
      modificationBaseId: 'area',
      scope: ModificationScope.LOCAL,
      grau: 5,
    });

    const appliedEffect = AppliedEffect.create({
      effectBaseId: 'dano',
      grau: 10,
      modifications: [appliedModification],
      custo: PowerCost.createZero(),
    });

    const result = await sut.execute({
      effects: [appliedEffect],
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.custoTotal.pda).toBe(60);
    }
  });

  it('should calculate cost with falha modification (reducing cost)', async () => {
    const effectBase = EffectBase.create({
      id: 'dano',
      nome: 'Dano',
      custoBase: 1,
      
      descricao: 'Causa dano',
      categorias: ['Ofensivo'],
    });

    const modificationBase = ModificationBase.create({
      id: 'alcance-limitado',
      nome: 'Alcance Limitado',
      tipo: ModificationType.FALHA,
      custoFixo: 0,
      custoPorGrau: -1,
      descricao: 'Alcance reduzido',
      categoria: 'Alcance e Área',
    });

    await effectsRepository.create(effectBase);
    await modificationsRepository.create(modificationBase);

    const appliedModification = AppliedModification.create({
      modificationBaseId: 'alcance-limitado',
      scope: ModificationScope.LOCAL,
      grau: 1,
    });

    const appliedEffect = AppliedEffect.create({
      effectBaseId: 'dano',
      grau: 10,
      modifications: [appliedModification],
      custo: PowerCost.createZero(),
    });

    const result = await sut.execute({
      effects: [appliedEffect],
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.custoTotal.pda).toBe(0);
    }
  });

  it('should calculate cost for multiple effects', async () => {
    const danoBase = EffectBase.create({
      id: 'dano',
      nome: 'Dano',
      custoBase: 1,
      
      descricao: 'Causa dano',
      categorias: ['Ofensivo'],
    });

    const protecaoBase = EffectBase.create({
      id: 'protecao',
      nome: 'Proteção',
      custoBase: 1,
      
      descricao: 'Concede proteção',
      categorias: ['Defensivo'],
    });

    await effectsRepository.create(danoBase);
    await effectsRepository.create(protecaoBase);

    const danoEffect = AppliedEffect.create({
      effectBaseId: 'dano',
      grau: 8,
      custo: PowerCost.createZero(),
    });

    const protecaoEffect = AppliedEffect.create({
      effectBaseId: 'protecao',
      grau: 5,
      custo: PowerCost.createZero(),
    });

    const result = await sut.execute({
      effects: [danoEffect, protecaoEffect],
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.custoTotal.pda).toBe(13);
      expect(result.value.custoTotal.espacos).toBe(13);
      expect(result.value.custoPorEfeito.size).toBe(2);
    }
  });

  it('should return error if effect base not found', async () => {
    const appliedEffect = AppliedEffect.create({
      effectBaseId: 'inexistente',
      grau: 10,
      custo: PowerCost.createZero(),
    });

    const result = await sut.execute({
      effects: [appliedEffect],
    });

    expect(result.isLeft()).toBe(true);
  });

  it('should return error if modification base not found', async () => {
    const effectBase = EffectBase.create({
      id: 'dano',
      nome: 'Dano',
      custoBase: 1,
      
      descricao: 'Causa dano',
      categorias: ['Ofensivo'],
    });

    await effectsRepository.create(effectBase);

    const appliedModification = AppliedModification.create({
      modificationBaseId: 'inexistente',
      scope: ModificationScope.LOCAL,
    });

    const appliedEffect = AppliedEffect.create({
      effectBaseId: 'dano',
      grau: 10,
      modifications: [appliedModification],
      custo: PowerCost.createZero(),
    });

    const result = await sut.execute({
      effects: [appliedEffect],
    });

    expect(result.isLeft()).toBe(true);
  });

  it('should calculate cost with global modifications', async () => {
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

    const globalModification = AppliedModification.createGlobal(
      'sutil',
      1,
    );

    const result = await sut.execute({
      effects: [appliedEffect],
      globalModifications: [globalModification],
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      // Custo base: 10 PdA
      // Modificação global: (custoFixo=0 + custoPorGrau=1 * grau=1) * custoBase = 1 * 10 = 10
      // Total: 10 + 10 = 20
      expect(result.value.custoTotal.pda).toBe(20);
    }
  });
});
