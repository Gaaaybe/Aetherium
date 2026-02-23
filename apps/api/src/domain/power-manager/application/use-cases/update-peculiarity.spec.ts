import { beforeEach, describe, expect, it } from 'vitest';
import { Peculiarity } from '../../enterprise/entities/peculiarity';
import { InMemoryPeculiaritiesRepository } from '../test/in-memory-peculiarities-repository';
import { UpdatePeculiarityUseCase } from './update-peculiarity';

describe('UpdatePeculiarityUseCase', () => {
  let sut: UpdatePeculiarityUseCase;
  let peculiaritiesRepository: InMemoryPeculiaritiesRepository;

  beforeEach(() => {
    peculiaritiesRepository = new InMemoryPeculiaritiesRepository();
    sut = new UpdatePeculiarityUseCase(peculiaritiesRepository);
  });

  it('should update peculiarity name', async () => {
    const peculiarity = Peculiarity.create({
      userId: 'user-1',
      nome: 'Nome Antigo',
      descricao: 'Descrição antiga com mais de dez caracteres',
      espiritual: true,
    });

    await peculiaritiesRepository.create(peculiarity);

    const result = await sut.execute({
      peculiarityId: peculiarity.id.toString(),
      nome: 'Nome Atualizado',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.peculiarity.nome).toBe('Nome Atualizado');
      expect(result.value.peculiarity.updatedAt).toBeDefined();
    }
  });

  it('should update peculiarity espiritual status', async () => {
    const peculiarity = Peculiarity.create({
      userId: 'user-1',
      nome: 'Peculiaridade',
      descricao: 'Descrição com mais de dez caracteres',
      espiritual: true,
    });

    await peculiaritiesRepository.create(peculiarity);

    const result = await sut.execute({
      peculiarityId: peculiarity.id.toString(),
      espiritual: false,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.peculiarity.espiritual).toBe(false);
    }
  });

  it('should return error if peculiarity not found', async () => {
    const result = await sut.execute({
      peculiarityId: 'inexistente',
      nome: 'Novo Nome',
    });

    expect(result.isLeft()).toBe(true);
  });
});
