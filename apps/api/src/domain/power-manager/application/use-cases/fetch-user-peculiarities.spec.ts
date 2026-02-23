import { describe, it, expect, beforeEach } from 'vitest';
import { FetchUserPeculiaritiesUseCase } from './fetch-user-peculiarities';
import { InMemoryPeculiaritiesRepository } from '../test/in-memory-peculiarities-repository';
import { Peculiarity } from '../../enterprise/entities/peculiarity';

describe('FetchUserPeculiaritiesUseCase', () => {
  let sut: FetchUserPeculiaritiesUseCase;
  let peculiaritiesRepository: InMemoryPeculiaritiesRepository;

  beforeEach(() => {
    peculiaritiesRepository = new InMemoryPeculiaritiesRepository();
    sut = new FetchUserPeculiaritiesUseCase(peculiaritiesRepository);
  });

  it('should fetch user peculiarities', async () => {
    const peculiarity1 = Peculiarity.create({
      userId: 'user-1',
      nome: 'Peculiaridade 1',
      descricao: 'Primeira peculiaridade do usuário',
      espiritual: true,
    });

    const peculiarity2 = Peculiarity.create({
      userId: 'user-1',
      nome: 'Peculiaridade 2',
      descricao: 'Segunda peculiaridade do usuário',
      espiritual: false,
    });

    const peculiarity3 = Peculiarity.create({
      userId: 'user-2',
      nome: 'Peculiaridade de Outro',
      descricao: 'Peculiaridade de outro usuário',
      espiritual: true,
    });

    await peculiaritiesRepository.create(peculiarity1);
    await peculiaritiesRepository.create(peculiarity2);
    await peculiaritiesRepository.create(peculiarity3);

    const result = await sut.execute({ userId: 'user-1', page: 1 });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.peculiarities).toHaveLength(2);
      expect(result.value.peculiarities[0].userId).toBe('user-1');
      expect(result.value.peculiarities[1].userId).toBe('user-1');
    }
  });

  it('should return empty array when user has no peculiarities', async () => {
    const result = await sut.execute({ userId: 'user-without-peculiarities', page: 1 });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.peculiarities).toHaveLength(0);
    }
  });

  it('should paginate peculiarities', async () => {
    // Create 25 peculiarities for user-1
    for (let i = 1; i <= 25; i++) {
      const peculiarity = Peculiarity.create({
        userId: 'user-1',
        nome: `Peculiaridade ${i}`,
        descricao: `Descrição da peculiaridade número ${i}`,
        espiritual: i % 2 === 0,
      });
      await peculiaritiesRepository.create(peculiarity);
    }

    const resultPage1 = await sut.execute({ userId: 'user-1', page: 1 });
    const resultPage2 = await sut.execute({ userId: 'user-1', page: 2 });

    expect(resultPage1.isRight()).toBe(true);
    expect(resultPage2.isRight()).toBe(true);

    if (resultPage1.isRight() && resultPage2.isRight()) {
      expect(resultPage1.value.peculiarities).toHaveLength(20);
      expect(resultPage2.value.peculiarities).toHaveLength(5);
    }
  });
});
