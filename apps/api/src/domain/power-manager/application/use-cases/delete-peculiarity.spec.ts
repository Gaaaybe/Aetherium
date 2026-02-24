import { InMemoryPeculiaritiesRepository } from '@test/repositories/in-memory-peculiarities-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { Peculiarity } from '../../enterprise/entities/peculiarity';
import { DeletePeculiarityUseCase } from './delete-peculiarity';

describe('DeletePeculiarityUseCase', () => {
  let sut: DeletePeculiarityUseCase;
  let peculiaritiesRepository: InMemoryPeculiaritiesRepository;
  const userId = 'user-1';

  beforeEach(() => {
    peculiaritiesRepository = new InMemoryPeculiaritiesRepository();
    sut = new DeletePeculiarityUseCase(peculiaritiesRepository);
  });

  it('should delete a peculiarity', async () => {
    const peculiarity = Peculiarity.create({
      userId,
      nome: 'Peculiaridade',
      descricao: 'Descrição com mais de dez caracteres',
      espiritual: true,
    });

    await peculiaritiesRepository.create(peculiarity);

    const result = await sut.execute({
      peculiarityId: peculiarity.id.toString(),
      userId,
    });

    expect(result.isRight()).toBe(true);
    expect(await peculiaritiesRepository.findById(peculiarity.id.toString())).toBeNull();
  });

  it('should return error if peculiarity not found', async () => {
    const result = await sut.execute({
      peculiarityId: 'inexistente',
      userId,
    });

    expect(result.isLeft()).toBe(true);
  });
});
