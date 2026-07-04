import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class PrismaCharacterManagerItemsLookupAdapter {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<any | null> {
    return this.prisma.item.findUnique({
      where: { id },
      select: {
        id: true,
        tipo: true,
        characterId: true,
        maxStack: true,
        upgradeLevelValue: true,
        upgradeLevelMax: true,
        materialMaxUpgradeLimit: true,
      },
    });
  }

  async createCharacterInstance(
    itemId: string,
    characterId: string,
    userId: string,
  ): Promise<string | null> {
    const original = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: {
        itemDamages: { orderBy: { posicao: 'asc' } },
        itemPowers: { orderBy: { posicao: 'asc' } },
        itemPowerArrays: {
          orderBy: { posicao: 'asc' },
          include: {
            powerArray: {
              include: {
                powerArrayPowers: {
                  orderBy: { posicao: 'asc' },
                  include: {
                    power: {
                      include: {
                        appliedEffects: {
                          include: {
                            appliedModifications: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!original) {
      return null;
    }

    const powerIds = original.itemPowers.map((ip) => ip.powerId);
    const originalPowers = await this.prisma.power.findMany({
      where: { id: { in: powerIds } },
      include: {
        appliedEffects: {
          include: {
            appliedModifications: true,
          },
        },
      },
    });
    const originalPowersMap = new Map(originalPowers.map((p) => [p.id, p]));

    const copy = await this.prisma.$transaction(async (tx) => {
      // 1. Clone all Item Powers
      const clonedPowerIdsByPosition: { posicao: number; powerId: string }[] = [];
      for (const ip of original.itemPowers) {
        const p = originalPowersMap.get(ip.powerId);
        if (!p) continue;
        const clonedPower = await tx.power.create({
          data: {
            userId,
            characterId,
            nome: p.nome,
            descricao: p.descricao,
            isPublic: false,
            icone: p.icone,
            notas: p.notas,
            domainName: p.domainName,
            domainAreaConhecimento: p.domainAreaConhecimento,
            domainPeculiarId: p.domainPeculiarId,
            parametrosAcao: p.parametrosAcao,
            parametrosAlcance: p.parametrosAlcance,
            parametrosDuracao: p.parametrosDuracao,
            custoTotalPda: p.custoTotalPda,
            custoTotalPe: p.custoTotalPe,
            custoTotalEspacos: p.custoTotalEspacos,
            custoAlternativoTipo: p.custoAlternativoTipo,
            custoAlternativoQuantidade: p.custoAlternativoQuantidade,
            custoAlternativoDescricao: p.custoAlternativoDescricao,
            custoAlternativoAtributo: p.custoAlternativoAtributo,
            custoAlternativoItemId: p.custoAlternativoItemId,
            appliedEffects: {
              create: p.appliedEffects.map((effect) => ({
                effectBaseId: effect.effectBaseId,
                grau: effect.grau,
                configuracaoId: effect.configuracaoId,
                inputValue: effect.inputValue,
                nota: effect.nota,
                posicao: effect.posicao,
                custoPda: effect.custoPda,
                custoPe: effect.custoPe,
                custoEspacos: effect.custoEspacos,
                appliedModifications: {
                  create: effect.appliedModifications.map((modification) => ({
                    modificationBaseId: modification.modificationBaseId,
                    scope: modification.scope,
                    grau: modification.grau,
                    parametros: (modification.parametros as any) || undefined,
                    nota: modification.nota,
                    posicao: modification.posicao,
                  })),
                },
              })),
            },
          },
        });
        clonedPowerIdsByPosition.push({
          posicao: ip.posicao,
          powerId: clonedPower.id,
        });
      }

      // 2. Clone all Item Power Arrays (and their nested powers)
      const clonedPowerArrayIdsByPosition: { posicao: number; powerArrayId: string }[] = [];
      for (const ipa of original.itemPowerArrays) {
        if (!ipa.powerArray) continue;
        const pa = ipa.powerArray;
        const nestedPowerIdsByPosition: { posicao: number; powerId: string }[] = [];

        for (const entry of pa.powerArrayPowers) {
          if (!entry.power) continue;
          const p = entry.power;
          const clonedPower = await tx.power.create({
            data: {
              userId,
              characterId,
              nome: p.nome,
              descricao: p.descricao,
              isPublic: false,
              icone: p.icone,
              notas: p.notas,
              domainName: p.domainName,
              domainAreaConhecimento: p.domainAreaConhecimento,
              domainPeculiarId: p.domainPeculiarId,
              parametrosAcao: p.parametrosAcao,
              parametrosAlcance: p.parametrosAlcance,
              parametrosDuracao: p.parametrosDuracao,
              custoTotalPda: p.custoTotalPda,
              custoTotalPe: p.custoTotalPe,
              custoTotalEspacos: p.custoTotalEspacos,
              custoAlternativoTipo: p.custoAlternativoTipo,
              custoAlternativoQuantidade: p.custoAlternativoQuantidade,
              custoAlternativoDescricao: p.custoAlternativoDescricao,
              custoAlternativoAtributo: p.custoAlternativoAtributo,
              custoAlternativoItemId: p.custoAlternativoItemId,
              appliedEffects: {
                create: p.appliedEffects.map((effect) => ({
                  effectBaseId: effect.effectBaseId,
                  grau: effect.grau,
                  configuracaoId: effect.configuracaoId,
                  inputValue: effect.inputValue,
                  nota: effect.nota,
                  posicao: effect.posicao,
                  custoPda: effect.custoPda,
                  custoPe: effect.custoPe,
                  custoEspacos: effect.custoEspacos,
                  appliedModifications: {
                    create: effect.appliedModifications.map((modification) => ({
                      modificationBaseId: modification.modificationBaseId,
                      scope: modification.scope,
                      grau: modification.grau,
                      parametros: (modification.parametros as any) || undefined,
                      nota: modification.nota,
                      posicao: modification.posicao,
                    })),
                  },
                })),
              },
            },
          });
          nestedPowerIdsByPosition.push({
            posicao: entry.posicao,
            powerId: clonedPower.id,
          });
        }

        const clonedPowerArray = await tx.powerArray.create({
          data: {
            userId,
            characterId,
            nome: pa.nome,
            descricao: pa.descricao,
            isPublic: false,
            icone: pa.icone,
            notas: pa.notas,
            domainName: pa.domainName,
            domainAreaConhecimento: pa.domainAreaConhecimento,
            domainPeculiarId: pa.domainPeculiarId,
            parametrosBaseAcao: pa.parametrosBaseAcao,
            parametrosBaseAlcance: pa.parametrosBaseAlcance,
            parametrosBaseDuracao: pa.parametrosBaseDuracao,
            custoTotalPda: pa.custoTotalPda,
            custoTotalPe: pa.custoTotalPe,
            custoTotalEspacos: pa.custoTotalEspacos,
            powerArrayPowers: {
              create: nestedPowerIdsByPosition.map((entry) => ({
                powerId: entry.powerId,
                posicao: entry.posicao,
              })),
            },
          },
        });

        clonedPowerArrayIdsByPosition.push({
          posicao: ipa.posicao,
          powerArrayId: clonedPowerArray.id,
        });
      }

      // 3. Create the cloned Item referencing the new power/array instances
      return tx.item.create({
        data: {
          userId,
          characterId,
          tipo: original.tipo,
          nome: original.nome,
          descricao: original.descricao,
          isPublic: false,
          icone: original.icone,
          notas: original.notas,
          durabilidade: original.durabilidade,
          canStack: original.canStack,
          maxStack: original.maxStack,
          domains: original.domains,
          domainAreaConhecimento: original.domainAreaConhecimento,
          domainPeculiarIds: original.domainPeculiarIds,
          custoBase: original.custoBase,
          nivelItem: original.nivelItem,
          critMargin: original.critMargin,
          critMultiplier: original.critMultiplier,
          alcance: original.alcance,
          alcanceExtraMetrosMetades: original.alcanceExtraMetrosMetades,
          atributoEscalonamento: original.atributoEscalonamento,
          upgradeLevelValue: original.upgradeLevelValue,
          upgradeLevelMax: original.upgradeLevelMax,
          tipoEquipamento: original.tipoEquipamento,
          baseRD: original.baseRD,
          descritorEfeito: original.descritorEfeito,
          qtdDoses: original.qtdDoses,
          isRefeicao: original.isRefeicao,
          spoilageState: original.spoilageState,
          isAttuned: original.isAttuned,
          materialTier: original.materialTier,
          materialMaxUpgradeLimit: original.materialMaxUpgradeLimit,
          itemDamages: {
            create: original.itemDamages.map((entry) => ({
              dado: entry.dado,
              base: entry.base,
              espiritual: entry.espiritual,
              posicao: entry.posicao,
            })),
          },
          itemPowers: {
            create: clonedPowerIdsByPosition.map((entry) => ({
              powerId: entry.powerId,
              posicao: entry.posicao,
            })),
          },
          itemPowerArrays: {
            create: clonedPowerArrayIdsByPosition.map((entry) => ({
              powerArrayId: entry.powerArrayId,
              posicao: entry.posicao,
            })),
          },
        },
      });
    });

    return copy.id;
  }

  async upgradeItem(itemId: string): Promise<void> {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        tipo: true,
        upgradeLevelValue: true,
        upgradeLevelMax: true,
      },
    });

    if (!item) {
      return;
    }

    if (item.tipo !== 'WEAPON' && item.tipo !== 'DEFENSIVE_EQUIPMENT') {
      return;
    }

    const current = item.upgradeLevelValue ?? 0;
    const max = item.upgradeLevelMax ?? 0;

    if (current >= max) {
      return;
    }

    await this.prisma.item.update({
      where: { id: itemId },
      data: { upgradeLevelValue: current + 1 },
    });
  }
}
