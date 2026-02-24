import { beforeEach, describe, expect, it } from 'vitest';
import { ModificationBase, ModificationType } from '../../enterprise/entities/modification-base';
import { InMemoryModificationsRepository } from '@test/repositories/in-memory-modifications-repository';
import { FetchModificationsUseCase } from './fetch-modifications';

describe('FetchModificationsUseCase', () => {
  let sut: FetchModificationsUseCase;
  let modificationsRepository: InMemoryModificationsRepository;

  beforeEach(() => {
    modificationsRepository = new InMemoryModificationsRepository();
    sut = new FetchModificationsUseCase(modificationsRepository);
  });

  it('should fetch all modifications', async () => {
    const mod1 = ModificationBase.create({
      id: 'preciso',
      nome: 'Preciso',
      tipo: ModificationType.EXTRA,
      custoFixo: 0,
      custoPorGrau: 1,
      descricao: 'Aumenta precisão',
      categoria: 'Ataque',
    });

    const mod2 = ModificationBase.create({
      id: 'impreciso',
      nome: 'Impreciso',
      tipo: ModificationType.FALHA,
      custoFixo: 0,
      custoPorGrau: -1,
      descricao: 'Reduz precisão',
      categoria: 'Ataque',
    });

    await modificationsRepository.create(mod1);
    await modificationsRepository.create(mod2);

    const result = await sut.execute({});

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.modifications).toHaveLength(2);
      expect(result.value.modifications[0].nome).toBe('Preciso');
      expect(result.value.modifications[1].nome).toBe('Impreciso');
    }
  });

  it('should fetch modifications by type', async () => {
    const mod1 = ModificationBase.create({
      id: 'preciso',
      nome: 'Preciso',
      tipo: ModificationType.EXTRA,
      custoFixo: 0,
      custoPorGrau: 1,
      descricao: 'Aumenta precisão',
      categoria: 'Ataque',
    });

    const mod2 = ModificationBase.create({
      id: 'impreciso',
      nome: 'Impreciso',
      tipo: ModificationType.FALHA,
      custoFixo: 0,
      custoPorGrau: -1,
      descricao: 'Reduz precisão',
      categoria: 'Ataque',
    });

    const mod3 = ModificationBase.create({
      id: 'poderoso',
      nome: 'Poderoso',
      tipo: ModificationType.EXTRA,
      custoFixo: 0,
      custoPorGrau: 1,
      descricao: 'Aumenta poder',
      categoria: 'Ataque',
    });

    await modificationsRepository.create(mod1);
    await modificationsRepository.create(mod2);
    await modificationsRepository.create(mod3);

    const result = await sut.execute({ type: 'extra' });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.modifications).toHaveLength(2);
      expect(result.value.modifications[0].nome).toBe('Preciso');
      expect(result.value.modifications[1].nome).toBe('Poderoso');
    }
  });

  it('should fetch modifications by category', async () => {
    const mod1 = ModificationBase.create({
      id: 'preciso',
      nome: 'Preciso',
      tipo: ModificationType.EXTRA,
      custoFixo: 0,
      custoPorGrau: 1,
      descricao: 'Aumenta precisão',
      categoria: 'Ataque',
    });

    const mod2 = ModificationBase.create({
      id: 'rapido',
      nome: 'Rápido',
      tipo: ModificationType.EXTRA,
      custoFixo: 0,
      custoPorGrau: 1,
      descricao: 'Aumenta velocidade',
      categoria: 'Movimento',
    });

    await modificationsRepository.create(mod1);
    await modificationsRepository.create(mod2);

    const result = await sut.execute({ category: 'Ataque' });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.modifications).toHaveLength(1);
      expect(result.value.modifications[0].nome).toBe('Preciso');
    }
  });

  it('should return empty array when no modifications exist', async () => {
    const result = await sut.execute({});

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.modifications).toHaveLength(0);
    }
  });
});
