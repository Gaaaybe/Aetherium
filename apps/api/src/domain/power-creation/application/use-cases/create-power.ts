import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import type { PowersRepository } from '../repositories/powers-repository';
import type { CalculatePowerCostUseCase } from './calculate-power-cost';
import { Power } from '../../enterprise/entities/power';
import { Domain } from '../../enterprise/entities/value-objects/domain';
import { PowerParameters } from '../../enterprise/entities/value-objects/power-parameters';
import { PowerCost } from '../../enterprise/entities/value-objects/power-cost';
import { AlternativeCost } from '../../enterprise/entities/value-objects/alternative-cost';
import { AppliedEffect } from '../../enterprise/entities/applied-effect';
import { AppliedModification } from '../../enterprise/entities/value-objects/applied-modification';
import { PowerEffectList } from '../../enterprise/entities/watched-lists/power-effect-list';
import { PowerGlobalModificationList } from '../../enterprise/entities/watched-lists/power-global-modification-list';

interface CreatePowerUseCaseRequest {
  nome: string;
  descricao: string;
  dominio: Domain;
  parametros: PowerParameters;
  effects: AppliedEffect[];
  globalModifications?: AppliedModification[];
  custoAlternativo?: AlternativeCost;
  notas?: string;
}

interface CreatePowerUseCaseResponseData {
  power: Power;
}

type CreatePowerUseCaseResponse = Either<
  ResourceNotFoundError,
  CreatePowerUseCaseResponseData
>;

export class CreatePowerUseCase {
  constructor(
    private powersRepository: PowersRepository,
    private calculatePowerCostUseCase: CalculatePowerCostUseCase,
  ) {}

  async execute(request: CreatePowerUseCaseRequest): Promise<CreatePowerUseCaseResponse> {
    const {
      nome,
      descricao,
      dominio,
      parametros,
      effects,
      globalModifications = [],
      custoAlternativo,
      notas,
    } = request;

    const costResult = await this.calculatePowerCostUseCase.execute({
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

    const power = Power.create({
      nome,
      descricao,
      dominio,
      parametros,
      effects: effectsList,
      globalModifications: globalModificationsList,
      custoTotal,
      custoAlternativo,
      notas,
      custom: false,
    });

    await this.powersRepository.create(power);

    return right({
      power,
    });
  }
}
