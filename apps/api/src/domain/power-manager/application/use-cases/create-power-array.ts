import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import type { PowerArraysRepository } from '../repositories/power-arrays-repository';
import type { PowersRepository } from '../repositories/powers-repository';
import { PowerArray, PowerArrayType } from '../../enterprise/entities/power-array';
import { Domain } from '../../enterprise/entities/value-objects/domain';
import { PowerParameters } from '../../enterprise/entities/value-objects/power-parameters';
import { PowerCost } from '../../enterprise/entities/value-objects/power-cost';
import type { Power } from '../../enterprise/entities/power';
import { PowerArrayPowerList } from '../../enterprise/entities/watched-lists/power-array-power-list';

interface CreatePowerArrayUseCaseRequest {
  nome: string;
  descricao: string;
  dominio: Domain;
  parametrosBase?: PowerParameters;
  powerIds: string[];
  tipo?: PowerArrayType;
  notas?: string;
}

interface CreatePowerArrayUseCaseResponseData {
  powerArray: PowerArray;
}

type CreatePowerArrayUseCaseResponse = Either<
  ResourceNotFoundError,
  CreatePowerArrayUseCaseResponseData
>;

export class CreatePowerArrayUseCase {
  constructor(
    private powerArraysRepository: PowerArraysRepository,
    private powersRepository: PowersRepository,
  ) {}

  async execute(
    request: CreatePowerArrayUseCaseRequest,
  ): Promise<CreatePowerArrayUseCaseResponse> {
    const { nome, descricao, dominio, parametrosBase, powerIds, tipo, notas } = request;

    const powers: Power[] = [];
    for (const powerId of powerIds) {
      const power = await this.powersRepository.findById(powerId);
      if (!power) {
        return left(new ResourceNotFoundError());
      }
      powers.push(power);
    }

    let totalPdA = 0;
    let totalPE = 0;
    let totalEspacos = 0;

    for (const power of powers) {
      totalPdA += power.custoTotal.pda;
      totalPE += power.custoTotal.pe;
      totalEspacos += power.custoTotal.espacos;
    }

    const custoTotal = PowerCost.create({
      pda: totalPdA,
      pe: totalPE,
      espacos: totalEspacos,
    });

    const powersList = new PowerArrayPowerList();
    powersList.update(powers);

    const powerArray = PowerArray.create({
      nome,
      descricao,
      dominio,
      parametrosBase,
      powers: powersList,
      custoTotal,
      tipo,
      notas,
    });

    await this.powerArraysRepository.create(powerArray);

    return right({
      powerArray,
    });
  }
}
