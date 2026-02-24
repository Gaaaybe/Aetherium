import { type Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import { DomainEvents } from '@/core/events/domain-events';
import type { Power } from '../../enterprise/entities/power';
import { PowerArray } from '../../enterprise/entities/power-array';
import type { Domain } from '../../enterprise/entities/value-objects/domain';
import { PowerCost } from '../../enterprise/entities/value-objects/power-cost';
import type { PowerParameters } from '../../enterprise/entities/value-objects/power-parameters';
import { PowerArrayPowerList } from '../../enterprise/entities/watched-lists/power-array-power-list';
import { InvalidVisibilityError } from './errors/invalid-visibility-error';
import type { PowerArraysRepository } from '../repositories/power-arrays-repository';
import type { PowersRepository } from '../repositories/powers-repository';

interface CreatePowerArrayUseCaseRequest {
  nome: string;
  descricao: string;
  dominio: Domain;
  parametrosBase?: PowerParameters;
  powerIds: string[];
  notas?: string;
  userId?: string;
  isPublic?: boolean;
}

interface CreatePowerArrayUseCaseResponseData {
  powerArray: PowerArray;
}

type CreatePowerArrayUseCaseResponse = Either<
  ResourceNotFoundError | InvalidVisibilityError,
  CreatePowerArrayUseCaseResponseData
>;

export class CreatePowerArrayUseCase {
  constructor(
    private powerArraysRepository: PowerArraysRepository,
    private powersRepository: PowersRepository,
  ) {}

  async execute({
    nome,
    descricao,
    dominio,
    parametrosBase,
    powerIds,
    notas,
    userId,
    isPublic,
  }: CreatePowerArrayUseCaseRequest): Promise<CreatePowerArrayUseCaseResponse> {
    const powers: Power[] = [];
    for (const powerId of powerIds) {
      const power = await this.powersRepository.findById(powerId);
      if (!power) {
        return left(new ResourceNotFoundError());
      }
      powers.push(power);
    }

    const custoTotal = PowerCost.sum(powers.map((p) => p.custoTotal));

    const powersList = new PowerArrayPowerList();
    powersList.update(powers);

    try {
      let powerArray = PowerArray.create({
        nome,
        descricao,
        dominio,
        parametrosBase,
        powers: powersList,
        custoTotal,
        notas,
        userId,
      });

      if (isPublic) {
        powerArray = powerArray.makePublic();
      }

      await this.powerArraysRepository.create(powerArray);
      await DomainEvents.dispatchEventsForAggregate(powerArray.id);

      return right({
        powerArray,
      });
    } catch (error) {
      if (error instanceof InvalidVisibilityError) {
        return left(error);
      }
      throw error;
    }
  }
}
