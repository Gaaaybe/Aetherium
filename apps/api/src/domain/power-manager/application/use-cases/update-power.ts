import { type Either, left, right } from '@/core/either';
import { NotAllowedError } from '@/core/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { DomainEvents } from '@/core/events/domain-events';
import type { AppliedEffect } from '../../enterprise/entities/applied-effect';
import type { Power } from '../../enterprise/entities/power';
import type { AlternativeCost } from '../../enterprise/entities/value-objects/alternative-cost';
import type { AppliedModification } from '../../enterprise/entities/value-objects/applied-modification';
import type { Domain } from '../../enterprise/entities/value-objects/domain';
import type { PowerParameters } from '../../enterprise/entities/value-objects/power-parameters';
import type { PowerCostCalculator } from '../../enterprise/services/power-cost-calculator';
import type { PeculiaritiesRepository } from '../repositories/peculiarities-repository';
import type { PowersRepository } from '../repositories/powers-repository';
import { InvalidVisibilityError } from './errors/invalid-visibility-error';

interface UpdatePowerUseCaseRequest {
  powerId: string;
  userId: string;
  nome?: string;
  descricao?: string;
  dominio?: Domain;
  parametros?: PowerParameters;
  effects?: AppliedEffect[];
  globalModifications?: AppliedModification[];
  custoAlternativo?: AlternativeCost;
  isPublic?: boolean;
  notas?: string;
}

interface UpdatePowerUseCaseResponseData {
  power: Power;
}

type UpdatePowerUseCaseResponse = Either<
  ResourceNotFoundError | InvalidVisibilityError | NotAllowedError,
  UpdatePowerUseCaseResponseData
>;

export class UpdatePowerUseCase {
  constructor(
    private powersRepository: PowersRepository,
    private powerCostCalculator: PowerCostCalculator,
    private peculiaritiesRepository: PeculiaritiesRepository,
  ) {}

  async execute({
    powerId,
    userId,
    nome,
    descricao,
    dominio,
    parametros,
    effects,
    globalModifications,
    custoAlternativo,
    isPublic,
    notas,
  }: UpdatePowerUseCaseRequest): Promise<UpdatePowerUseCaseResponse> {
    const existingPower = await this.powersRepository.findById(powerId);

    if (!existingPower) {
      return left(new ResourceNotFoundError());
    }

    if (!existingPower.canBeEditedBy(userId)) {
      return left(new NotAllowedError());
    }

    let newCustoTotal:
      | undefined
      | import('../../enterprise/entities/value-objects/power-cost').PowerCost;

    if (effects !== undefined || globalModifications !== undefined) {
      const costResult = await this.powerCostCalculator.calculate({
        effects: effects ?? existingPower.effects.getItems(),
        globalModifications: globalModifications ?? existingPower.globalModifications.getItems(),
      });

      if (costResult.isLeft()) {
        return left(costResult.value);
      }

      newCustoTotal = costResult.value.custoTotal;
    }

    let updatedPower = existingPower.update({
      nome,
      descricao,
      dominio,
      parametros,
      effects,
      globalModifications,
      custoTotal: newCustoTotal,
      custoAlternativo,
      notas,
    });

    if (isPublic !== undefined && isPublic !== existingPower.isPublic) {
      try {
        if (isPublic) {
          const peculiarityId = updatedPower.getReferencedPeculiarityId();
          if (peculiarityId) {
            const peculiarity = await this.peculiaritiesRepository.findById(peculiarityId);
            if (!peculiarity) {
              return left(
                new InvalidVisibilityError(
                  'Não é possível tornar o poder público pois a peculiaridade referenciada não foi encontrada',
                ),
              );
            }
          }
          updatedPower = updatedPower.makePublic();
        } else {
          updatedPower = updatedPower.makePrivate();
        }
      } catch (error) {
        if (error instanceof Error) {
          return left(new InvalidVisibilityError(error.message));
        }
        throw error;
      }
    }

    await this.powersRepository.update(updatedPower);
    await DomainEvents.dispatchEventsForAggregate(updatedPower.id);

    return right({
      power: updatedPower,
    });
  }
}
