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

interface UpdatePowerArrayUseCaseRequest {
  powerArrayId: string;
  nome?: string;
  descricao?: string;
  dominio?: Domain;
  parametrosBase?: PowerParameters;
  powerIds?: string[];
  tipo?: PowerArrayType;
  notas?: string;
}

interface UpdatePowerArrayUseCaseResponseData {
  powerArray: PowerArray;
}

type UpdatePowerArrayUseCaseResponse = Either<
  ResourceNotFoundError,
  UpdatePowerArrayUseCaseResponseData
>;

export class UpdatePowerArrayUseCase {
  constructor(
    private powerArraysRepository: PowerArraysRepository,
    private powersRepository: PowersRepository,
  ) {}

  async execute(
    request: UpdatePowerArrayUseCaseRequest,
  ): Promise<UpdatePowerArrayUseCaseResponse> {
    const { powerArrayId, nome, descricao, dominio, parametrosBase, powerIds, tipo, notas } =
      request;

    const existingPowerArray = await this.powerArraysRepository.findById(powerArrayId);

    if (!existingPowerArray) {
      return left(new ResourceNotFoundError());
    }

    let newPowersList = existingPowerArray.powers;
    let newCustoTotal = existingPowerArray.custoTotal;

    if (powerIds !== undefined) {
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

      newCustoTotal = PowerCost.create({
        pda: totalPdA,
        pe: totalPE,
        espacos: totalEspacos,
      });

      newPowersList = new PowerArrayPowerList();
      newPowersList.update(powers);
    }

    const updatedPowerArray = PowerArray.create(
      {
        nome: nome ?? existingPowerArray.nome,
        descricao: descricao ?? existingPowerArray.descricao,
        dominio: dominio ?? existingPowerArray.dominio,
        parametrosBase: parametrosBase ?? existingPowerArray.parametrosBase,
        powers: newPowersList,
        custoTotal: newCustoTotal,
        tipo: tipo ?? existingPowerArray.tipo,
        notas: notas ?? existingPowerArray.notas,
        createdAt: existingPowerArray.createdAt,
        updatedAt: new Date(),
      },
      existingPowerArray.id,
    );

    await this.powerArraysRepository.update(updatedPowerArray);

    return right({
      powerArray: updatedPowerArray,
    });
  }
}
