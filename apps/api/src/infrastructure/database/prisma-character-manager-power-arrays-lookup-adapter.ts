import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';

const DOMAIN_NAME_TO_ID: Record<string, string> = {
  NATURAL: 'natural',
  SAGRADO: 'sagrado',
  SACRILEGIO: 'sacrilegio',
  PSIQUICO: 'psiquico',
  CIENTIFICO: 'cientifico',
  PECULIAR: 'peculiar',
  ARMA_BRANCA: 'arma-branca',
  ARMA_FOGO: 'arma-fogo',
  ARMA_TENSAO: 'arma-tensao',
  ARMA_EXPLOSIVA: 'arma-explosiva',
  ARMA_TECNOLOGICA: 'arma-tecnologica',
};

export interface PowerArrayInfo {
  id: string;
  nome: string;
  domainId: string;
  pdaCost: number;
  peCost: number;
  slotCost: number;
}

@Injectable()
export class PrismaCharacterManagerPowerArraysLookupAdapter {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<PowerArrayInfo | null> {
    const raw = await this.prisma.powerArray.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        domainName: true,
        domainPeculiarId: true,
        custoTotalPda: true,
        custoTotalPe: true,
        custoTotalEspacos: true,
      },
    });

    if (!raw) {
      return null;
    }

    return {
      id: raw.id,
      nome: raw.nome,
      domainId:
        raw.domainName === 'PECULIAR' && raw.domainPeculiarId
          ? raw.domainPeculiarId
          : DOMAIN_NAME_TO_ID[raw.domainName],
      pdaCost: raw.custoTotalPda,
      peCost: raw.custoTotalPe,
      slotCost: raw.custoTotalEspacos,
    };
  }

  async createCharacterInstance(
    powerArrayId: string,
    characterId: string,
    userId: string,
  ): Promise<string | null> {
    const original = await this.prisma.powerArray.findUnique({
      where: { id: powerArrayId },
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
    });

    if (!original) {
      return null;
    }

    const copy = await this.prisma.$transaction(async (tx) => {
      const clonedPowerIdsByPosition = [] as Array<{ posicao: number; powerId: string }>;

      for (const entry of original.powerArrayPowers) {
        const clonedPower = await tx.power.create({
          data: {
            userId,
            characterId,
            nome: entry.power.nome,
            descricao: entry.power.descricao,
            isPublic: false,
            icone: entry.power.icone,
            notas: entry.power.notas,
            domainName: entry.power.domainName,
            domainAreaConhecimento: entry.power.domainAreaConhecimento,
            domainPeculiarId: entry.power.domainPeculiarId,
            parametrosAcao: entry.power.parametrosAcao,
            parametrosAlcance: entry.power.parametrosAlcance,
            parametrosDuracao: entry.power.parametrosDuracao,
            custoTotalPda: entry.power.custoTotalPda,
            custoTotalPe: entry.power.custoTotalPe,
            custoTotalEspacos: entry.power.custoTotalEspacos,
            custoAlternativoTipo: entry.power.custoAlternativoTipo,
            custoAlternativoQuantidade: entry.power.custoAlternativoQuantidade,
            custoAlternativoDescricao: entry.power.custoAlternativoDescricao,
            custoAlternativoAtributo: entry.power.custoAlternativoAtributo,
            custoAlternativoItemId: entry.power.custoAlternativoItemId,
            appliedEffects: {
              create: entry.power.appliedEffects.map(
                (effect) =>
                  ({
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
                        parametros: modification.parametros,
                        nota: modification.nota,
                        posicao: modification.posicao,
                      })),
                    },
                  }) as Prisma.AppliedEffectUncheckedCreateWithoutPowerInput,
              ),
            },
          },
        });

        clonedPowerIdsByPosition.push({
          posicao: entry.posicao,
          powerId: clonedPower.id,
        });
      }

      return tx.powerArray.create({
        data: {
          userId,
          characterId,
          nome: original.nome,
          descricao: original.descricao,
          isPublic: false,
          icone: original.icone,
          notas: original.notas,
          domainName: original.domainName,
          domainAreaConhecimento: original.domainAreaConhecimento,
          domainPeculiarId: original.domainPeculiarId,
          parametrosBaseAcao: original.parametrosBaseAcao,
          parametrosBaseAlcance: original.parametrosBaseAlcance,
          parametrosBaseDuracao: original.parametrosBaseDuracao,
          custoTotalPda: original.custoTotalPda,
          custoTotalPe: original.custoTotalPe,
          custoTotalEspacos: original.custoTotalEspacos,
          powerArrayPowers: {
            create: clonedPowerIdsByPosition.map((entry) => ({
              powerId: entry.powerId,
              posicao: entry.posicao,
            })),
          },
        },
      });
    });

    return copy.id;
  }
}
