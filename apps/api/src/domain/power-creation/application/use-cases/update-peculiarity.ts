import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { Peculiarity } from '../../enterprise/entities/peculiarity';
import { PeculiaritiesRepository } from '../repositories/peculiarities-repository';

interface UpdatePeculiarityUseCaseRequest {
  peculiarityId: string;
  nome?: string;
  descricao?: string;
  espiritual?: boolean;
}

interface UpdatePeculiarityUseCaseResponseData {
  peculiarity: Peculiarity;
}

type UpdatePeculiarityUseCaseResponse = Either<
  ResourceNotFoundError,
  UpdatePeculiarityUseCaseResponseData
>;

export class UpdatePeculiarityUseCase {
  constructor(private peculiaritiesRepository: PeculiaritiesRepository) {}

  async execute({
    peculiarityId,
    nome,
    descricao,
    espiritual,
  }: UpdatePeculiarityUseCaseRequest): Promise<UpdatePeculiarityUseCaseResponse> {
    const peculiarity = await this.peculiaritiesRepository.findById(peculiarityId);

    if (!peculiarity) {
      return left(new ResourceNotFoundError());
    }

    if (nome !== undefined) {
      peculiarity.nome = nome;
    }

    if (descricao !== undefined) {
      peculiarity.descricao = descricao;
    }

    if (espiritual !== undefined) {
      peculiarity.espiritual = espiritual;
    }

    await this.peculiaritiesRepository.update(peculiarity);

    return right({
      peculiarity,
    });
  }
}
