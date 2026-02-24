import { type Either, left, right } from '@/core/either';
import type { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { DomainEvents } from '@/core/events/domain-events';
import type { AppliedEffect } from '../../enterprise/entities/applied-effect';
import { Power } from '../../enterprise/entities/power';
import type { AlternativeCost } from '../../enterprise/entities/value-objects/alternative-cost';
import type { AppliedModification } from '../../enterprise/entities/value-objects/applied-modification';
import type { Domain } from '../../enterprise/entities/value-objects/domain';
import type { PowerParameters } from '../../enterprise/entities/value-objects/power-parameters';
import { PowerEffectList } from '../../enterprise/entities/watched-lists/power-effect-list';
import { PowerGlobalModificationList } from '../../enterprise/entities/watched-lists/power-global-modification-list';
import { InvalidVisibilityError } from './errors/invalid-visibility-error';
import type { PowerCostCalculator } from '../../enterprise/services/power-cost-calculator';
import type { PeculiaritiesRepository } from '../repositories/peculiarities-repository';
import type { PowersRepository } from '../repositories/powers-repository';

interface CreatePowerUseCaseRequest {
  userId?: string;
  nome: string;
  descricao: string;
  dominio: Domain;
  parametros: PowerParameters;
  effects: AppliedEffect[];
  globalModifications?: AppliedModification[];
  custoAlternativo?: AlternativeCost;
  isPublic?: boolean;
  notas?: string;
}

interface CreatePowerUseCaseResponseData {
  power: Power;
}

type CreatePowerUseCaseResponse = Either<
  ResourceNotFoundError | InvalidVisibilityError,
  CreatePowerUseCaseResponseData
>;

export class CreatePowerUseCase {
  constructor(
    private powersRepository: PowersRepository,
    private powerCostCalculator: PowerCostCalculator,
    private peculiaritiesRepository: PeculiaritiesRepository,
  ) {}

  async execute({
    userId,
    nome,
    descricao,
    dominio,
    parametros,
    effects,
    globalModifications = [],
    custoAlternativo,
    isPublic,
    notas,
  }: CreatePowerUseCaseRequest): Promise<CreatePowerUseCaseResponse> {
    const costResult = await this.powerCostCalculator.calculate({
      effects,
      globalModifications,
    });

    if (costResult.isLeft()) {
      return left(costResult.value);
    }

    const { custoTotal } = costResult.value;

    const effectsList = new PowerEffectList();
    effectsList.update(effects);

    const globalModificationsList = new PowerGlobalModificationList();
    globalModificationsList.update(globalModifications);

    if (isPublic && dominio.isPeculiar()) {
      const peculiarityId = dominio.peculiarId;
      if (peculiarityId) {
        const peculiarity = await this.peculiaritiesRepository.findById(peculiarityId);
        if (!peculiarity) {
          return left(
            new InvalidVisibilityError(
              'Não é possível criar poder público: peculiaridade referenciada não foi encontrada',
            ),
          );
        }
      }
    }

    let power = Power.create({
      userId,
      nome,
      descricao,
      dominio,
      parametros,
      effects: effectsList,
      globalModifications: globalModificationsList,
      custoTotal,
      custoAlternativo,
      notas,
    });

    if (isPublic) {
      power = power.makePublic();
    }

    await this.powersRepository.create(power);
    await DomainEvents.dispatchEventsForAggregate(power.id);

    return right({
      power,
    });
  }
}
