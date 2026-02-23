import { describe, it, expect, beforeEach } from 'vitest';
import { CreatePeculiarityUseCase } from './create-peculiarity';
import { InMemoryPeculiaritiesRepository } from '../test/in-memory-peculiarities-repository';

describe('CreatePeculiarityUseCase', () => {
  let sut: CreatePeculiarityUseCase;
  let peculiaritiesRepository: InMemoryPeculiaritiesRepository;

  beforeEach(() => {
    peculiaritiesRepository = new InMemoryPeculiaritiesRepository();
    sut = new CreatePeculiarityUseCase(peculiaritiesRepository);
  });

  it('should create a peculiarity', async () => {
    const result = await sut.execute({
      userId: 'user-1',
      nome: 'Controle de Gravidade',
      descricao: 'Poder único de manipular a força gravitacional ao redor',
      espiritual: true,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.peculiarity.nome).toBe('Controle de Gravidade');
      expect(result.value.peculiarity.espiritual).toBe(true);
      expect(peculiaritiesRepository.items).toHaveLength(1);
    }
  });

  it('should create a non-spiritual peculiarity', async () => {
    const result = await sut.execute({
      userId: 'user-1',
      nome: 'Tecnomancia',
      descricao: 'Habilidade de controlar dispositivos eletrônicos com a mente',
      espiritual: false,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.peculiarity.espiritual).toBe(false);
    }
  });

  it('should fail if name is too short', async () => {
    await expect(() => {
      return sut.execute({
        userId: 'user-1',
        nome: 'Ab',
        descricao: 'Descrição válida com mais de dez caracteres',
        espiritual: true,
      });
    }).rejects.toThrow('Nome da peculiaridade deve ter no mínimo 3 caracteres');
  });

  it('should fail if description is too short', async () => {
    await expect(() => {
      return sut.execute({
        userId: 'user-1',
        nome: 'Nome Válido',
        descricao: 'Curta',
        espiritual: true,
      });
    }).rejects.toThrow('Descrição da peculiaridade deve ter no mínimo 10 caracteres');
  });
});
