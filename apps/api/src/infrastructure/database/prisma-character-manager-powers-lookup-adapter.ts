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

export interface PowerInfo {
  id: string;
  nome: string;
  domainId: string;
  pdaCost: number;
  peCost: number;
  slotCost: number;
}

@Injectable()
export class PrismaCharacterManagerPowersLookupAdapter {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<PowerInfo | null> {
    const raw = await this.prisma.power.findUnique({
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
    powerId: string,
    characterId: string,
    userId: string,
  ): Promise<string | null> {
    const original = await this.prisma.power.findUnique({
      where: { id: powerId },
      include: {
        appliedEffects: {
          include: {
            appliedModifications: true,
          },
        },
      },
    });

    if (!original) {
      return null;
    }

    const copy = await this.prisma.power.create({
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
        parametrosAcao: original.parametrosAcao,
        parametrosAlcance: original.parametrosAlcance,
        parametrosDuracao: original.parametrosDuracao,
        custoTotalPda: original.custoTotalPda,
        custoTotalPe: original.custoTotalPe,
        custoTotalEspacos: original.custoTotalEspacos,
        custoAlternativoTipo: original.custoAlternativoTipo,
        custoAlternativoQuantidade: original.custoAlternativoQuantidade,
        custoAlternativoDescricao: original.custoAlternativoDescricao,
        custoAlternativoAtributo: original.custoAlternativoAtributo,
        custoAlternativoItemId: original.custoAlternativoItemId,
        appliedEffects: {
          create: original.appliedEffects.map(
            (effect) =>
              ({
                effectBaseId: effect.effectBaseId,
                grau: effect.grau,
                configuracaoId: effect.configuracaoId,
                inputValue: effect.inputValue,
                dadoModularizado: effect.dadoModularizado,
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

    return copy.id;
  }
}
