import { type Either, left, right } from '@/core/either';
import { NotAllowedError } from '@/core/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import type { PowerArraysRepository } from '../repositories/power-arrays-repository';

interface DeletePowerArrayUseCaseRequest {
  powerArrayId: string;
  userId: string;
}

type DeletePowerArrayUseCaseResponse = Either<ResourceNotFoundError | NotAllowedError, null>;

export class DeletePowerArrayUseCase {
  constructor(private powerArraysRepository: PowerArraysRepository) {}

  async execute({
    powerArrayId,
    userId,
  }: DeletePowerArrayUseCaseRequest): Promise<DeletePowerArrayUseCaseResponse> {
    const powerArray = await this.powerArraysRepository.findById(powerArrayId);

    if (!powerArray) {
      return left(new ResourceNotFoundError());
    }

    if (!powerArray.canBeEditedBy(userId)) {
      return left(new NotAllowedError());
    }

    await this.powerArraysRepository.delete(powerArrayId);

    return right(null);
  }
}
