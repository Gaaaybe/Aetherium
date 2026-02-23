import { Either, right } from '@/core/either';
import { EffectBase } from '../../enterprise/entities/effect-base';
import { EffectsRepository } from '../repositories/effects-repository';

interface FetchEffectsUseCaseRequest {
  category?: string;
}

interface FetchEffectsUseCaseResponseData {
  effects: EffectBase[];
}

type FetchEffectsUseCaseResponse = Either<
  null,
  FetchEffectsUseCaseResponseData
>;

export class FetchEffectsUseCase {
  constructor(private effectsRepository: EffectsRepository) {}

  async execute({
    category,
  }: FetchEffectsUseCaseRequest): Promise<FetchEffectsUseCaseResponse> {
    const effects = category
      ? await this.effectsRepository.findByCategory(category)
      : await this.effectsRepository.findAll();

    return right({
      effects,
    });
  }
}
