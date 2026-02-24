import { type Either, right } from '@/core/either';
import type { PowerArray } from '../../enterprise/entities/power-array';
import type { PowerArraysRepository } from '../repositories/power-arrays-repository';

interface FetchPowerArraysUseCaseRequest {
  page: number;
}

interface FetchPowerArraysUseCaseResponseData {
  powerArrays: PowerArray[];
}

type FetchPowerArraysUseCaseResponse = Either<null, FetchPowerArraysUseCaseResponseData>;

export class FetchPowerArraysUseCase {
  constructor(private powerArraysRepository: PowerArraysRepository) {}

  async execute({
    page,
  }: FetchPowerArraysUseCaseRequest): Promise<FetchPowerArraysUseCaseResponse> {
    const powerArrays = await this.powerArraysRepository.findPublic({
      page,
    });

    return right({
      powerArrays,
    });
  }
}
