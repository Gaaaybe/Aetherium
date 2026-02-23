import { type Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import type { PowerArraysRepository } from '../repositories/power-arrays-repository';

interface DeletePowerArrayUseCaseRequest {
  powerArrayId: string;
}

type DeletePowerArrayUseCaseResponse = Either<ResourceNotFoundError, Record<string, never>>;

export class DeletePowerArrayUseCase {
  constructor(private powerArraysRepository: PowerArraysRepository) {}

  async execute({
    powerArrayId,
  }: DeletePowerArrayUseCaseRequest): Promise<DeletePowerArrayUseCaseResponse> {
    const powerArray = await this.powerArraysRepository.findById(powerArrayId);

    if (!powerArray) {
      return left(new ResourceNotFoundError());
    }

    await this.powerArraysRepository.delete(powerArrayId);

    return right({});
  }
}
