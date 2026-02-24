import { type Either, left, right } from '@/core/either';
import { NotAllowedError } from '@/core/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import type { Peculiarity } from '../../enterprise/entities/peculiarity';
import type { PeculiaritiesRepository } from '../repositories/peculiarities-repository';

interface UpdatePeculiarityUseCaseRequest {
  peculiarityId: string;
  userId: string;
  nome?: string;
  descricao?: string;
  espiritual?: boolean;
  isPublic?: boolean;
}

interface UpdatePeculiarityUseCaseResponseData {
  peculiarity: Peculiarity;
}

type UpdatePeculiarityUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  UpdatePeculiarityUseCaseResponseData
>;

export class UpdatePeculiarityUseCase {
  constructor(private peculiaritiesRepository: PeculiaritiesRepository) {}

  async execute({
    peculiarityId,
    userId,
    nome,
    descricao,
    espiritual,
    isPublic,
  }: UpdatePeculiarityUseCaseRequest): Promise<UpdatePeculiarityUseCaseResponse> {
    const peculiarity = await this.peculiaritiesRepository.findById(peculiarityId);

    if (!peculiarity) {
      return left(new ResourceNotFoundError());
    }

    if (!peculiarity.canBeEditedBy(userId)) {
      return left(new NotAllowedError());
    }

    let updated = peculiarity.update({
      ...(nome !== undefined && { nome }),
      ...(descricao !== undefined && { descricao }),
      ...(espiritual !== undefined && { espiritual }),
    });

    if (isPublic !== undefined && isPublic !== peculiarity.isPublic) {
      updated = isPublic ? updated.makePublic() : updated.makePrivate();
    }

    await this.peculiaritiesRepository.update(updated);

    return right({
      peculiarity: updated,
    });
  }
}
