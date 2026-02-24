import { InMemoryEffectsRepository } from '@test/repositories/in-memory-effects-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { EffectBase } from '../../enterprise/entities/effect-base';
import { FetchEffectsUseCase } from './fetch-effects';

describe('FetchEffectsUseCase', () => {
  let sut: FetchEffectsUseCase;
  let effectsRepository: InMemoryEffectsRepository;

  beforeEach(() => {
    effectsRepository = new InMemoryEffectsRepository();
    sut = new FetchEffectsUseCase(effectsRepository);
  });

  it('should fetch all effects', async () => {
    const effect1 = EffectBase.create({
      id: 'dano',
      nome: 'Dano',
      custoBase: 1,
      descricao: 'Causa dano',
      categorias: ['Ofensivo'],
    });

    const effect2 = EffectBase.create({
      id: 'protecao',
      nome: 'Proteção',
      custoBase: 1,
      descricao: 'Fornece proteção',
      categorias: ['Defensivo'],
    });

    await effectsRepository.create(effect1);
    await effectsRepository.create(effect2);

    const result = await sut.execute({});

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.effects).toHaveLength(2);
      expect(result.value.effects[0].nome).toBe('Dano');
      expect(result.value.effects[1].nome).toBe('Proteção');
    }
  });

  it('should fetch effects by category', async () => {
    const effect1 = EffectBase.create({
      id: 'dano',
      nome: 'Dano',
      custoBase: 1,
      descricao: 'Causa dano',
      categorias: ['Ofensivo'],
    });

    const effect2 = EffectBase.create({
      id: 'protecao',
      nome: 'Proteção',
      custoBase: 1,
      descricao: 'Fornece proteção',
      categorias: ['Defensivo'],
    });

    const effect3 = EffectBase.create({
      id: 'explosao',
      nome: 'Explosão',
      custoBase: 2,
      descricao: 'Causa dano em área',
      categorias: ['Ofensivo'],
    });

    await effectsRepository.create(effect1);
    await effectsRepository.create(effect2);
    await effectsRepository.create(effect3);

    const result = await sut.execute({ category: 'Ofensivo' });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.effects).toHaveLength(2);
      expect(result.value.effects[0].nome).toBe('Dano');
      expect(result.value.effects[1].nome).toBe('Explosão');
    }
  });

  it('should return empty array when no effects exist', async () => {
    const result = await sut.execute({});

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.effects).toHaveLength(0);
    }
  });
});
