import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { PowerArray } from '../../enterprise/entities/power-array';
import { PowerArraysRepository } from '../repositories/power-arrays-repository';

interface GetPowerArrayByIdUseCaseRequest {
  powerArrayId: string;
}

interface GetPowerArrayByIdUseCaseResponseData {
  powerArray: PowerArray;
}

type GetPowerArrayByIdUseCaseResponse = Either<
  ResourceNotFoundError,
  GetPowerArrayByIdUseCaseResponseData
>;

export class GetPowerArrayByIdUseCase {
  constructor(private powerArraysRepository: PowerArraysRepository) {}

  async execute({
    powerArrayId,
  }: GetPowerArrayByIdUseCaseRequest): Promise<GetPowerArrayByIdUseCaseResponse> {
    const powerArray = await this.powerArraysRepository.findById(powerArrayId);

    if (!powerArray) {
      return left(new ResourceNotFoundError());
    }

    return right({
      powerArray,
    });
  }
}
