import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error';
import type { EffectsRepository } from '../repositories/effects-repository';
import type { ModificationsRepository } from '../repositories/modifications-repository';
import { PowerCost } from '../../enterprise/entities/value-objects/power-cost';
import type { AppliedEffect } from '../../enterprise/entities/applied-effect';
import type { AppliedModification } from '../../enterprise/entities/value-objects/applied-modification';

interface CalculatePowerCostUseCaseRequest {
  effects: AppliedEffect[];
  globalModifications?: AppliedModification[];
}

interface CalculatePowerCostUseCaseResponseData {
  custoTotal: PowerCost;
  custoPorEfeito: Map<string, PowerCost>;
}

type CalculatePowerCostUseCaseResponse = Either<
  ResourceNotFoundError,
  CalculatePowerCostUseCaseResponseData
>;

export class CalculatePowerCostUseCase {
  constructor(
    private effectsRepository: EffectsRepository,
    private modificationsRepository: ModificationsRepository,
  ) {}

  async execute(
    request: CalculatePowerCostUseCaseRequest,
  ): Promise<CalculatePowerCostUseCaseResponse> {
    const { effects, globalModifications = [] } = request;

    const custoPorEfeito = new Map<string, PowerCost>();
    let totalPdA = 0;
    let totalPE = 0;
    let totalEspacos = 0;

    for (const appliedEffect of effects) {
      const effectBase = await this.effectsRepository.findById(appliedEffect.effectBaseId);

      if (!effectBase) {
        return left(new ResourceNotFoundError());
      }

      let pdaEfeito = effectBase.custoBase * appliedEffect.grau;
      let peEfeito = 0;
      let espacosEfeito = effectBase.custoBase * appliedEffect.grau;

      if (appliedEffect.configuracaoId && effectBase.hasConfiguracoes()) {
        const config = effectBase.getConfiguracao(appliedEffect.configuracaoId);
        if (config?.modificadorCusto) {
          pdaEfeito += config.modificadorCusto * appliedEffect.grau;
        }
      }

      for (const modification of appliedEffect.modifications) {
        const modBase = await this.modificationsRepository.findById(
          modification.modificationBaseId,
        );

        if (!modBase) {
          return left(new ResourceNotFoundError());
        }

        const grauMod = modification.grau ?? 1;
        const custoMod = modBase.custoFixo + modBase.custoPorGrau * grauMod;
        pdaEfeito += custoMod * appliedEffect.grau;
      }

      pdaEfeito = Math.max(0, pdaEfeito);
      espacosEfeito = Math.max(0, espacosEfeito);

      const custoEfeito = PowerCost.create({
        pda: pdaEfeito,
        pe: peEfeito,
        espacos: espacosEfeito,
      });

      custoPorEfeito.set(appliedEffect.id.toString(), custoEfeito);

      totalPdA += pdaEfeito;
      totalPE += peEfeito;
      totalEspacos += espacosEfeito;
    }
    for (const globalMod of globalModifications) {
      const modBase = await this.modificationsRepository.findById(
        globalMod.modificationBaseId,
      );

      if (!modBase) {
        return left(new ResourceNotFoundError());
      }

      const grauMod = globalMod.grau ?? 1;
      const custoMod = modBase.custoFixo + modBase.custoPorGrau * grauMod;
      
      totalPdA += custoMod * totalPdA;
    }

    totalPdA = Math.max(0, totalPdA);
    totalEspacos = Math.max(0, totalEspacos);

    const custoTotal = PowerCost.create({
      pda: totalPdA,
      pe: totalPE,
      espacos: totalEspacos,
    });

    return right({
      custoTotal,
      custoPorEfeito,
    });
  }
}
