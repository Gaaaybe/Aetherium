import { type Either, left, right } from '@/core/either';
import { NotAllowedError } from '@/core/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import type { PeculiaritiesRepository } from '../repositories/peculiarities-repository';

interface DeletePeculiarityUseCaseRequest {
  peculiarityId: string;
  userId: string;
}

type DeletePeculiarityUseCaseResponse = Either<ResourceNotFoundError | NotAllowedError, null>;

export class DeletePeculiarityUseCase {
  constructor(private peculiaritiesRepository: PeculiaritiesRepository) {}

  async execute({
    peculiarityId,
    userId,
  }: DeletePeculiarityUseCaseRequest): Promise<DeletePeculiarityUseCaseResponse> {
    const peculiarity = await this.peculiaritiesRepository.findById(peculiarityId);

    if (!peculiarity) {
      return left(new ResourceNotFoundError());
    }

    if (!peculiarity.canBeEditedBy(userId)) {
      return left(new NotAllowedError());
    }

    await this.peculiaritiesRepository.delete(peculiarityId);

    return right(null);
  }
}
