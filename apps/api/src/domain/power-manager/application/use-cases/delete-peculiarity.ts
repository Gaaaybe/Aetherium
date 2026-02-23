import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { PeculiaritiesRepository } from '../repositories/peculiarities-repository';

interface DeletePeculiarityUseCaseRequest {
  peculiarityId: string;
}

type DeletePeculiarityUseCaseResponse = Either<
  ResourceNotFoundError,
  Record<string, never>
>;

export class DeletePeculiarityUseCase {
  constructor(private peculiaritiesRepository: PeculiaritiesRepository) {}

  async execute({
    peculiarityId,
  }: DeletePeculiarityUseCaseRequest): Promise<DeletePeculiarityUseCaseResponse> {
    const peculiarity = await this.peculiaritiesRepository.findById(peculiarityId);

    if (!peculiarity) {
      return left(new ResourceNotFoundError());
    }

    await this.peculiaritiesRepository.delete(peculiarityId);

    return right({});
  }
}
