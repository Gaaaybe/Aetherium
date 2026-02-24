import { InMemoryPeculiaritiesRepository } from '@test/repositories/in-memory-peculiarities-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { Peculiarity } from '../../enterprise/entities/peculiarity';
import { GetPeculiarityByIdUseCase } from './get-peculiarity-by-id';

describe('GetPeculiarityByIdUseCase', () => {
  let sut: GetPeculiarityByIdUseCase;
  let peculiaritiesRepository: InMemoryPeculiaritiesRepository;

  beforeEach(() => {
    peculiaritiesRepository = new InMemoryPeculiaritiesRepository();
    sut = new GetPeculiarityByIdUseCase(peculiaritiesRepository);
  });

  it('should get peculiarity by id', async () => {
    const peculiarity = Peculiarity.create({
      userId: 'user-1',
      nome: 'Controle de Gravidade',
      descricao: 'Poder único de manipular gravidade',
      espiritual: true,
    });

    await peculiaritiesRepository.create(peculiarity);

    const result = await sut.execute({
      peculiarityId: peculiarity.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.peculiarity.nome).toBe('Controle de Gravidade');
    }
  });

  it('should return error if peculiarity not found', async () => {
    const result = await sut.execute({
      peculiarityId: 'inexistente',
    });

    expect(result.isLeft()).toBe(true);
  });
});
