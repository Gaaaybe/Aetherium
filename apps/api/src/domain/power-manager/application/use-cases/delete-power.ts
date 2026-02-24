import { type Either, left, right } from '@/core/either';
import { NotAllowedError } from '@/core/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import type { PowersRepository } from '../repositories/powers-repository';

interface DeletePowerUseCaseRequest {
  powerId: string;
  userId: string;
}

type DeletePowerUseCaseResponse = Either<ResourceNotFoundError | NotAllowedError, null>;

export class DeletePowerUseCase {
  constructor(private powersRepository: PowersRepository) {}

  async execute({
    powerId,
    userId,
  }: DeletePowerUseCaseRequest): Promise<DeletePowerUseCaseResponse> {
    const existingPower = await this.powersRepository.findById(powerId);

    if (!existingPower) {
      return left(new ResourceNotFoundError());
    }

    if (!existingPower.canBeEditedBy(userId)) {
      return left(new NotAllowedError());
    }

    await this.powersRepository.delete(powerId);

    return right(null);
  }
}
