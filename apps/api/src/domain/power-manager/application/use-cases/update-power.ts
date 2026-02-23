import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import type { PowersRepository } from '../repositories/powers-repository';
import type { CalculatePowerCostUseCase } from './calculate-power-cost';
import { Power } from '../../enterprise/entities/power';
import { Domain } from '../../enterprise/entities/value-objects/domain';
import { PowerParameters } from '../../enterprise/entities/value-objects/power-parameters';
import { AlternativeCost } from '../../enterprise/entities/value-objects/alternative-cost';
import { AppliedEffect } from '../../enterprise/entities/applied-effect';
import { AppliedModification } from '../../enterprise/entities/value-objects/applied-modification';
import { PowerEffectList } from '../../enterprise/entities/watched-lists/power-effect-list';
import { PowerGlobalModificationList } from '../../enterprise/entities/watched-lists/power-global-modification-list';

interface UpdatePowerUseCaseRequest {
  powerId: string;
  nome?: string;
  descricao?: string;
  dominio?: Domain;
  parametros?: PowerParameters;
  effects?: AppliedEffect[];
  globalModifications?: AppliedModification[];
  custoAlternativo?: AlternativeCost;
  notas?: string;
}

interface UpdatePowerUseCaseResponseData {
  power: Power;
}

type UpdatePowerUseCaseResponse = Either<
  ResourceNotFoundError,
  UpdatePowerUseCaseResponseData
>;

export class UpdatePowerUseCase {
  constructor(
    private powersRepository: PowersRepository,
    private calculatePowerCostUseCase: CalculatePowerCostUseCase,
  ) {}

  async execute(request: UpdatePowerUseCaseRequest): Promise<UpdatePowerUseCaseResponse> {
    const {
      powerId,
      nome,
      descricao,
      dominio,
      parametros,
      effects,
      globalModifications,
      custoAlternativo,
      notas,
    } = request;

    const existingPower = await this.powersRepository.findById(powerId);

    if (!existingPower) {
      return left(new ResourceNotFoundError());
    }

    const needsRecalculation = effects !== undefined || globalModifications !== undefined;

    let newCustoTotal = existingPower.custoTotal;
    let newEffectsList = existingPower.effects;
    let newGlobalModsList = existingPower.globalModifications;

    if (needsRecalculation) {
      const finalEffects = effects ?? existingPower.effects.getItems();
      const finalGlobalMods = globalModifications ?? existingPower.globalModifications.getItems();

      const costResult = await this.calculatePowerCostUseCase.execute({
        effects: finalEffects,
        globalModifications: finalGlobalMods,
      });

      if (costResult.isLeft()) {
        return left(costResult.value);
      }

      newCustoTotal = costResult.value.custoTotal;

      if (effects !== undefined) {
        newEffectsList = new PowerEffectList();
        newEffectsList.update(effects);
      }

      if (globalModifications !== undefined) {
        newGlobalModsList = new PowerGlobalModificationList();
        newGlobalModsList.update(globalModifications);
      }
    }

    const updatedPower = Power.create(
      {
        nome: nome ?? existingPower.nome,
        descricao: descricao ?? existingPower.descricao,
        dominio: dominio ?? existingPower.dominio,
        parametros: parametros ?? existingPower.parametros,
        effects: newEffectsList,
        globalModifications: newGlobalModsList,
        custoTotal: newCustoTotal,
        custoAlternativo: custoAlternativo ?? existingPower.custoAlternativo,
        notas: notas ?? existingPower.notas,
        custom: existingPower.custom,
        createdAt: existingPower.createdAt,
        updatedAt: new Date(),
      },
      existingPower.id,
    );

    await this.powersRepository.update(updatedPower);

    return right({
      power: updatedPower,
    });
  }
}