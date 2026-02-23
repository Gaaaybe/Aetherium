import { Either, right } from '@/core/either';
import { ModificationBase } from '../../enterprise/entities/modification-base';
import { ModificationsRepository } from '../repositories/modifications-repository';

interface FetchModificationsUseCaseRequest {
  type?: 'extra' | 'falha';
  category?: string;
}

interface FetchModificationsUseCaseResponseData {
  modifications: ModificationBase[];
}

type FetchModificationsUseCaseResponse = Either<
  null,
  FetchModificationsUseCaseResponseData
>;

export class FetchModificationsUseCase {
  constructor(private modificationsRepository: ModificationsRepository) {}

  async execute({
    type,
    category,
  }: FetchModificationsUseCaseRequest): Promise<FetchModificationsUseCaseResponse> {
    let modifications: ModificationBase[];

    if (type) {
      modifications = await this.modificationsRepository.findByType(type);
    } else if (category) {
      modifications = await this.modificationsRepository.findByCategory(category);
    } else {
      modifications = await this.modificationsRepository.findAll();
    }

    return right({
      modifications,
    });
  }
}
