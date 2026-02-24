import { type Either, right } from '@/core/either';
import type { Power } from '../../enterprise/entities/power';
import type { PowersRepository } from '../repositories/powers-repository';

interface FetchPowersUseCaseRequest {
  page: number;
}

interface FetchPowersUseCaseResponseData {
  powers: Power[];
}

type FetchPowersUseCaseResponse = Either<null, FetchPowersUseCaseResponseData>;

export class FetchPowersUseCase {
  constructor(private powersRepository: PowersRepository) {}

  async execute({ page }: FetchPowersUseCaseRequest): Promise<FetchPowersUseCaseResponse> {
    const powers = await this.powersRepository.findPublic({ page });

    return right({
      powers,
    });
  }
}
