import { describe, it, expect, beforeEach } from 'vitest';
import { DeletePeculiarityUseCase } from './delete-peculiarity';
import { InMemoryPeculiaritiesRepository } from '../test/in-memory-peculiarities-repository';
import { Peculiarity } from '../../enterprise/entities/peculiarity';

describe('DeletePeculiarityUseCase', () => {
  let sut: DeletePeculiarityUseCase;
  let peculiaritiesRepository: InMemoryPeculiaritiesRepository;

  beforeEach(() => {
    peculiaritiesRepository = new InMemoryPeculiaritiesRepository();
    sut = new DeletePeculiarityUseCase(peculiaritiesRepository);
  });

  it('should delete a peculiarity', async () => {
    const peculiarity = Peculiarity.create({
      userId: 'user-1',
      nome: 'Peculiaridade',
      descricao: 'Descrição com mais de dez caracteres',
      espiritual: true,
    });

    await peculiaritiesRepository.create(peculiarity);

    const result = await sut.execute({
      peculiarityId: peculiarity.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    expect(await peculiaritiesRepository.findById(peculiarity.id.toString())).toBeNull();
  });

  it('should return error if peculiarity not found', async () => {
    const result = await sut.execute({
      peculiarityId: 'inexistente',
    });

    expect(result.isLeft()).toBe(true);
  });
});
