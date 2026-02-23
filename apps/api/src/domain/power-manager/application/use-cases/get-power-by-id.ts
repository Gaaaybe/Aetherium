import { type Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import type { Power } from '../../enterprise/entities/power';
import type { PowersRepository } from '../repositories/powers-repository';

interface GetPowerByIdUseCaseRequest {
  powerId: string;
}

interface GetPowerByIdUseCaseResponseData {
  power: Power;
}

type GetPowerByIdUseCaseResponse = Either<ResourceNotFoundError, GetPowerByIdUseCaseResponseData>;

export class GetPowerByIdUseCase {
  constructor(private powersRepository: PowersRepository) {}

  async execute(request: GetPowerByIdUseCaseRequest): Promise<GetPowerByIdUseCaseResponse> {
    const { powerId } = request;

    const power = await this.powersRepository.findById(powerId);

    if (!power) {
      return left(new ResourceNotFoundError());
    }

    return right({
      power,
    });
  }
}
