import { right, type Either } from '@/core/either';
import type { PowersRepository } from '../repositories/powers-repository';
import type { Power } from '../../enterprise/entities/power';

interface FetchPowersUseCaseRequest {
  page: number;
}

interface FetchPowersUseCaseResponseData {
  powers: Power[];
}

type FetchPowersUseCaseResponse = Either<null, FetchPowersUseCaseResponseData>;

export class FetchPowersUseCase {
  constructor(private powersRepository: PowersRepository) {}

  async execute(request: FetchPowersUseCaseRequest): Promise<FetchPowersUseCaseResponse> {
    const { page } = request;

    const powers = await this.powersRepository.findMany({ page });

    return right({
      powers,
    });
  }
}
