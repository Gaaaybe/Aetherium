import { type Either, right } from '@/core/either';
import { Peculiarity } from '../../enterprise/entities/peculiarity';
import type { PeculiaritiesRepository } from '../repositories/peculiarities-repository';

interface CreatePeculiarityUseCaseRequest {
  userId: string;
  nome: string;
  descricao: string;
  espiritual: boolean;
  isPublic?: boolean;
}

interface CreatePeculiarityUseCaseResponseData {
  peculiarity: Peculiarity;
}

type CreatePeculiarityUseCaseResponse = Either<null, CreatePeculiarityUseCaseResponseData>;

export class CreatePeculiarityUseCase {
  constructor(private peculiaritiesRepository: PeculiaritiesRepository) {}

  async execute({
    userId,
    nome,
    descricao,
    espiritual,
    isPublic,
  }: CreatePeculiarityUseCaseRequest): Promise<CreatePeculiarityUseCaseResponse> {
    const peculiarity = Peculiarity.create({
      userId,
      nome,
      descricao,
      espiritual,
      isPublic,
    });

    await this.peculiaritiesRepository.create(peculiarity);

    return right({
      peculiarity,
    });
  }
}
