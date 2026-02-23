import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import type { PowersRepository } from '../repositories/powers-repository';

interface DeletePowerUseCaseRequest {
  powerId: string;
}

type DeletePowerUseCaseResponse = Either<ResourceNotFoundError, null>;

export class DeletePowerUseCase {
  constructor(private powersRepository: PowersRepository) {}

  async execute(request: DeletePowerUseCaseRequest): Promise<DeletePowerUseCaseResponse> {
    const { powerId } = request;

    const existingPower = await this.powersRepository.findById(powerId);

    if (!existingPower) {
      return left(new ResourceNotFoundError());
    }

    await this.powersRepository.delete(powerId);

    return right(null);
  }
}
