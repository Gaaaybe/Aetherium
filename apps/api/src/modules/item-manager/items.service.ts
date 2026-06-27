import { ItemType, WeaponRange } from '@aetherium/rules-engine';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { PowersService } from '@/modules/power-manager/powers.service';
import { CreateItemBodySchema, ImportItemBodySchema, UpdateItemBodySchema } from './dto/item.dto';
import {
  InvalidItemDomainError,
  NotAllowedError,
  ResourceNotFoundError,
} from './errors/item-errors';

const INCLUDE = {
  itemDamages: true,
  itemPowers: true,
  itemPowerArrays: true,
  user: { select: { id: true, name: true } },
} as const;

const EXPORT_INCLUDE = {
  itemDamages: true,
  itemPowers: true,
  itemPowerArrays: {
    include: {
      powerArray: {
        include: {
          powerArrayPowers: {
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
} as const;

const DOMAIN_MAP: Record<string, string> = {
  natural: 'NATURAL',
  sagrado: 'SAGRADO',
  sacrilegio: 'SACRILEGIO',
  psiquico: 'PSIQUICO',
  cientifico: 'CIENTIFICO',
  peculiar: 'PECULIAR',
  'arma-branca': 'ARMA_BRANCA',
  'arma-fogo': 'ARMA_FOGO',
  'arma-tensao': 'ARMA_TENSAO',
  'arma-explosiva': 'ARMA_EXPLOSIVA',
  'arma-tecnologica': 'ARMA_TECNOLOGICA',
  desarmado: 'DESARMADO',
};

const ITEM_TYPE_MAP: Record<string, string> = {
  [ItemType.WEAPON]: 'WEAPON',
  [ItemType.DEFENSIVE_EQUIPMENT]: 'DEFENSIVE_EQUIPMENT',
  [ItemType.CONSUMABLE]: 'CONSUMABLE',
  [ItemType.ARTIFACT]: 'ARTIFACT',
  [ItemType.ACCESSORY]: 'ACCESSORY',
  [ItemType.GENERAL]: 'GENERAL',
  [ItemType.UPGRADE_MATERIAL]: 'UPGRADE_MATERIAL',
};

@Injectable()
export class ItemsService {
  constructor(
    private prisma: PrismaService,
    private powersService: PowersService,
  ) {}

  private async calculateItemLevel(
    domainName: string,
    powerIds?: string[],
    powerArrayIds?: string[],
  ): Promise<number> {
    let totalContribution = 0;
    const targetPrismaDomain = DOMAIN_MAP[domainName];

    if (powerIds && powerIds.length > 0) {
      for (const powerId of powerIds) {
        const power = await this.prisma.power.findUnique({
          where: { id: powerId },
          select: {
            nome: true,
            domainName: true,
            appliedEffects: { select: { grau: true } },
          },
        });

        if (!power) {
          throw new ResourceNotFoundError(`Poder com ID ${powerId} não encontrado`);
        }

        if (power.domainName !== targetPrismaDomain) {
          throw new InvalidItemDomainError(
            `Poder "${power.nome}" é do domínio "${power.domainName.toLowerCase().replace(/_/g, '-')}", mas o item é do domínio "${domainName}"`,
          );
        }

        totalContribution += power.appliedEffects.reduce((sum, effect) => sum + effect.grau, 0);
      }
    }

    if (powerArrayIds && powerArrayIds.length > 0) {
      for (const powerArrayId of powerArrayIds) {
        const powerArray = await this.prisma.powerArray.findUnique({
          where: { id: powerArrayId },
          select: {
            nome: true,
            domainName: true,
            powerArrayPowers: {
              select: {
                power: {
                  select: {
                    appliedEffects: { select: { grau: true } },
                  },
                },
              },
            },
          },
        });

        if (!powerArray) {
          throw new ResourceNotFoundError(`Acervo com ID ${powerArrayId} não encontrado`);
        }

        if (powerArray.domainName !== targetPrismaDomain) {
          throw new InvalidItemDomainError(
            `Acervo "${powerArray.nome}" é do domínio "${powerArray.domainName.toLowerCase().replace(/_/g, '-')}", mas o item é do domínio "${domainName}"`,
          );
        }

        const contribution = powerArray.powerArrayPowers.reduce(
          (total, link) =>
            total + link.power.appliedEffects.reduce((sum, effect) => sum + effect.grau, 0),
          0,
        );

        totalContribution += contribution;
      }
    }

    return Math.max(1, totalContribution);
  }

  async create(userId: string, body: CreateItemBodySchema) {
    const computedLevel = await this.calculateItemLevel(
      body.dominio.name,
      body.powerIds,
      body.powerArrayIds,
    );

    const isOfficial = !userId;
    const isPublic = body.isPublic ?? false;

    const baseData: any = {
      userId: userId || null,
      tipo: ITEM_TYPE_MAP[body.tipo] as any,
      nome: body.nome,
      descricao: body.descricao,
      isPublic,
      icone: body.icone,
      notas: body.notas,
      canStack: body.canStack ?? false,
      maxStack: body.maxStack ?? 2,
      domainName: DOMAIN_MAP[body.dominio.name] as any,
      domainAreaConhecimento: body.dominio.areaConhecimento || null,
      domainPeculiarId: body.dominio.peculiarId || null,
      custoBase: body.custoBase,
      nivelItem: computedLevel,
    };

    if (body.tipo === ItemType.WEAPON) {
      baseData.critMargin = body.critMargin;
      baseData.critMultiplier = body.critMultiplier;
      baseData.alcance = body.alcance.toUpperCase() as any;
      baseData.alcanceExtraMetrosMetades = body.alcanceExtraMetros
        ? body.alcanceExtraMetros * 2
        : 0;
      baseData.atributoEscalonamento = body.atributoEscalonamento || null;
      baseData.upgradeLevelValue = body.upgradeLevel ?? 0;
      baseData.upgradeLevelMax = 7;
      baseData.itemDamages = {
        create: body.danos.map((d, index) => ({
          dado: d.dado.toLowerCase(),
          base: d.base.toLowerCase(),
          espiritual: d.espiritual,
          posicao: index,
        })),
      };
    } else if (body.tipo === ItemType.DEFENSIVE_EQUIPMENT) {
      baseData.tipoEquipamento = body.tipoEquipamento.toUpperCase() as any;
      baseData.baseRD = body.baseRD ?? 2;
      baseData.upgradeLevelValue = body.upgradeLevel ?? 0;
      baseData.upgradeLevelMax = 9;
      baseData.atributoEscalonamento = body.atributoEscalonamento || null;
    } else if (body.tipo === ItemType.CONSUMABLE) {
      baseData.descritorEfeito = body.descritorEfeito;
      baseData.qtdDoses = body.qtdDoses;
      baseData.isRefeicao = body.isRefeicao;
    } else if (body.tipo === ItemType.UPGRADE_MATERIAL) {
      baseData.materialTier = body.tier;
      baseData.materialMaxUpgradeLimit = body.maxUpgradeLimit;
    }

    if (body.powerIds && body.powerIds.length > 0) {
      baseData.itemPowers = {
        create: body.powerIds.map((pid, index) => ({
          powerId: pid,
          posicao: index,
        })),
      };
    }

    if (body.powerArrayIds && body.powerArrayIds.length > 0) {
      baseData.itemPowerArrays = {
        create: body.powerArrayIds.map((paid, index) => ({
          powerArrayId: paid,
          posicao: index,
        })),
      };
    }

    const created = await this.prisma.item.create({
      data: baseData,
      include: INCLUDE,
    });

    return created;
  }

  async update(itemId: string, userId: string, body: UpdateItemBodySchema) {
    const existing = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: INCLUDE,
    });

    if (!existing) {
      throw new ResourceNotFoundError();
    }

    const isOwned = existing.userId === userId;
    const isOfficial = !existing.userId;
    if (isOfficial || !isOwned) {
      throw new NotAllowedError();
    }

    const targetDomainName =
      body.dominio?.name ?? existing.domainName.toLowerCase().replace(/_/g, '-');

    let currentPowerIds = existing.itemPowers.map((ip) => ip.powerId);
    if (body.powerIds !== undefined) {
      currentPowerIds = body.powerIds;
    }

    let currentPowerArrayIds = existing.itemPowerArrays.map((ipa) => ipa.powerArrayId);
    if (body.powerArrayIds !== undefined) {
      currentPowerArrayIds = body.powerArrayIds;
    }

    const computedLevel = await this.calculateItemLevel(
      targetDomainName,
      currentPowerIds,
      currentPowerArrayIds,
    );

    const baseData: any = {
      nome: body.nome !== undefined ? body.nome : existing.nome,
      descricao: body.descricao !== undefined ? body.descricao : existing.descricao,
      isPublic: body.isPublic !== undefined ? body.isPublic : existing.isPublic,
      icone: body.icone !== undefined ? body.icone : existing.icone,
      notas: body.notas !== undefined ? body.notas : existing.notas,
      canStack: body.canStack !== undefined ? body.canStack : existing.canStack,
      maxStack: body.maxStack !== undefined ? body.maxStack : existing.maxStack,
      custoBase: body.custoBase !== undefined ? body.custoBase : existing.custoBase,
      nivelItem: computedLevel,
    };

    if (body.dominio) {
      baseData.domainName = DOMAIN_MAP[body.dominio.name] as any;
      baseData.domainAreaConhecimento = body.dominio.areaConhecimento || null;
      baseData.domainPeculiarId = body.dominio.peculiarId || null;
    }

    const updates: any[] = [];

    if (body.tipo === ItemType.WEAPON) {
      baseData.critMargin = body.critMargin !== undefined ? body.critMargin : existing.critMargin;
      baseData.critMultiplier =
        body.critMultiplier !== undefined ? body.critMultiplier : existing.critMultiplier;
      baseData.alcance =
        body.alcance !== undefined ? (body.alcance.toUpperCase() as any) : existing.alcance;
      baseData.alcanceExtraMetrosMetades =
        body.alcanceExtraMetros !== undefined
          ? body.alcanceExtraMetros * 2
          : existing.alcanceExtraMetrosMetades;
      baseData.atributoEscalonamento =
        body.atributoEscalonamento !== undefined
          ? body.atributoEscalonamento
          : existing.atributoEscalonamento;

      if (body.danos) {
        updates.push(this.prisma.itemDamage.deleteMany({ where: { itemId } }));
        baseData.itemDamages = {
          create: body.danos.map((d, index) => ({
            dado: d.dado.toLowerCase(),
            base: d.base.toLowerCase(),
            espiritual: d.espiritual,
            posicao: index,
          })),
        };
      }
    } else if (body.tipo === ItemType.DEFENSIVE_EQUIPMENT) {
      baseData.tipoEquipamento =
        body.tipoEquipamento !== undefined
          ? (body.tipoEquipamento.toUpperCase() as any)
          : existing.tipoEquipamento;
      baseData.baseRD = body.baseRD !== undefined ? body.baseRD : existing.baseRD;
      baseData.atributoEscalonamento =
        body.atributoEscalonamento !== undefined
          ? body.atributoEscalonamento
          : existing.atributoEscalonamento;
    } else if (body.tipo === ItemType.CONSUMABLE) {
      baseData.descritorEfeito =
        body.descritorEfeito !== undefined ? body.descritorEfeito : existing.descritorEfeito;
      baseData.qtdDoses = body.qtdDoses !== undefined ? body.qtdDoses : existing.qtdDoses;
    } else if (body.tipo === ItemType.UPGRADE_MATERIAL) {
      baseData.materialTier = body.tier !== undefined ? body.tier : existing.materialTier;
      baseData.materialMaxUpgradeLimit =
        body.maxUpgradeLimit !== undefined
          ? body.maxUpgradeLimit
          : existing.materialMaxUpgradeLimit;
    }

    if (body.powerIds !== undefined) {
      updates.push(this.prisma.itemPower.deleteMany({ where: { itemId } }));
      baseData.itemPowers = {
        create: body.powerIds.map((pid, index) => ({
          powerId: pid,
          posicao: index,
        })),
      };
    }

    if (body.powerArrayIds !== undefined) {
      updates.push(this.prisma.itemPowerArray.deleteMany({ where: { itemId } }));
      baseData.itemPowerArrays = {
        create: body.powerArrayIds.map((paid, index) => ({
          powerArrayId: paid,
          posicao: index,
        })),
      };
    }

    updates.push(
      this.prisma.item.update({
        where: { id: itemId },
        data: baseData,
      }),
    );

    await this.prisma.$transaction(updates);

    const updated = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: INCLUDE,
    });

    return updated!;
  }

  async delete(itemId: string, userId: string) {
    const existing = await this.prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!existing) {
      throw new ResourceNotFoundError();
    }

    const isOwned = existing.userId === userId;
    const isOfficial = !existing.userId;
    if (isOfficial || !isOwned) {
      throw new NotAllowedError();
    }

    await this.prisma.item.delete({
      where: { id: itemId },
    });
  }

  async copyPublic(itemId: string, userId: string) {
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
      throw new ResourceNotFoundError();
    }

    const isOfficial = !original.userId;
    const isOwned = original.userId === userId;
    const isPublic = original.isPublic;

    if (!isOfficial && !isOwned && !isPublic) {
      throw new NotAllowedError();
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
            characterId: null,
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
              characterId: null,
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
            characterId: null,
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
          characterId: null,
          tipo: original.tipo,
          nome: original.nome,
          descricao: original.descricao,
          isPublic: false,
          icone: original.icone,
          notas: original.notas,
          durabilidade: original.durabilidade,
          canStack: original.canStack,
          maxStack: original.maxStack,
          domainName: original.domainName,
          domainAreaConhecimento: original.domainAreaConhecimento,
          domainPeculiarId: original.domainPeculiarId,
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
        include: INCLUDE,
      });
    });

    return copy;
  }

  async getById(itemId: string) {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: INCLUDE,
    });

    if (!item) {
      throw new ResourceNotFoundError();
    }

    return item;
  }

  async fetchPublic(page: number, tipo?: ItemType) {
    const rawTipo = tipo ? ITEM_TYPE_MAP[tipo] : undefined;

    const items = await this.prisma.item.findMany({
      where: {
        characterId: null,
        OR: [{ userId: null }, { isPublic: true }],
        ...(rawTipo ? { tipo: rawTipo as any } : {}),
      },
      include: INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 20,
      skip: (page - 1) * 20,
    });

    return items;
  }

  async fetchUser(userId: string, page: number, tipo?: ItemType) {
    const rawTipo = tipo ? ITEM_TYPE_MAP[tipo] : undefined;

    const items = await this.prisma.item.findMany({
      where: {
        userId,
        characterId: null,
        ...(rawTipo ? { tipo: rawTipo as any } : {}),
      },
      include: INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 20,
      skip: (page - 1) * 20,
    });

    return items;
  }

  async fetchCharacter(characterId: string) {
    const items = await this.prisma.item.findMany({
      where: { characterId },
      include: INCLUDE,
    });

    return items;
  }

  private sanitizePower(power: any) {
    const appliedEffects = power.appliedEffects ? power.appliedEffects : [];
    const globalModifications: any[] = [];
    const resolvedEffects = appliedEffects.map((ae: any) => {
      const modifications = (ae.appliedModifications || [])
        .filter((am: any) => am.scope !== 'GLOBAL')
        .map((am: any) => ({
          modificationBaseId: am.modificationBaseId,
          grau: am.grau,
          parametros: am.parametros ?? undefined,
          nota: am.nota ?? undefined,
        }));

      for (const am of ae.appliedModifications || []) {
        if (am.scope === 'GLOBAL') {
          globalModifications.push({
            modificationBaseId: am.modificationBaseId,
            grau: am.grau,
            parametros: am.parametros ?? undefined,
            nota: am.nota ?? undefined,
          });
        }
      }

      return {
        effectBaseId: ae.effectBaseId,
        grau: ae.grau,
        configuracaoId: ae.configuracaoId ?? undefined,
        inputValue: ae.inputValue ?? undefined,
        nota: ae.nota ?? undefined,
        modifications,
      };
    });

    return {
      nome: power.nome,
      descricao: power.descricao,
      dominio: {
        name: power.domainName.toLowerCase().replace(/_/g, '-'),
        areaConhecimento: power.domainAreaConhecimento ?? undefined,
        peculiarId: power.domainPeculiarId ?? undefined,
      },
      parametros: {
        acao: power.parametrosAcao,
        alcance: power.parametrosAlcance,
        duracao: power.parametrosDuracao,
      },
      effects: resolvedEffects,
      globalModifications,
      custoAlternativo: power.custoAlternativoTipo
        ? {
            tipo: power.custoAlternativoTipo.toLowerCase(),
            quantidade: power.custoAlternativoQuantidade,
            descricao: power.custoAlternativoDescricao ?? undefined,
            atributo: power.custoAlternativoAtributo ?? undefined,
            itemId: power.custoAlternativoItemId ?? undefined,
          }
        : undefined,
      isPublic: false,
      notas: power.notas ?? undefined,
      icone: power.icone ?? undefined,
    };
  }

  private sanitizePowerArray(powerArray: any) {
    const pb =
      powerArray.parametrosBaseAcao !== null &&
      powerArray.parametrosBaseAlcance !== null &&
      powerArray.parametrosBaseDuracao !== null
        ? {
            acao: powerArray.parametrosBaseAcao,
            alcance: powerArray.parametrosBaseAlcance,
            duracao: powerArray.parametrosBaseDuracao,
          }
        : undefined;

    const powers = powerArray.powerArrayPowers
      ? powerArray.powerArrayPowers.map((pap: any) => this.sanitizePower(pap.power))
      : [];

    return {
      nome: powerArray.nome,
      descricao: powerArray.descricao,
      dominio: {
        name: powerArray.domainName.toLowerCase().replace(/_/g, '-'),
        areaConhecimento: powerArray.domainAreaConhecimento ?? undefined,
        peculiarId: powerArray.domainPeculiarId ?? undefined,
      },
      parametrosBase: pb,
      powers,
      isPublic: false,
      notas: powerArray.notas ?? undefined,
      icone: powerArray.icone ?? undefined,
    };
  }

  async exportItem(itemId: string, userId: string) {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: EXPORT_INCLUDE,
    });

    if (!item) {
      throw new ResourceNotFoundError('Item não encontrado');
    }

    if (item.userId && item.userId !== userId && !item.isPublic) {
      throw new NotAllowedError();
    }

    const powerIds = item.itemPowers.map((ip) => ip.powerId);
    const powers = await this.prisma.power.findMany({
      where: { id: { in: powerIds } },
      include: {
        appliedEffects: {
          include: {
            appliedModifications: true,
          },
        },
      },
    });

    // Keep the ordering of powers matching item.itemPowers
    const orderedPowers = item.itemPowers
      .map((ip) => powers.find((p) => p.id === ip.powerId))
      .filter((p): p is NonNullable<typeof p> => !!p);

    const base: any = {
      tipo: item.tipo.toLowerCase().replace(/_/g, '-'),
      nome: item.nome,
      descricao: item.descricao,
      isPublic: false,
      icone: item.icone ?? undefined,
      notas: item.notas ?? undefined,
      canStack: item.canStack,
      maxStack: item.maxStack,
      dominio: {
        name: item.domainName.toLowerCase().replace(/_/g, '-'),
        areaConhecimento: item.domainAreaConhecimento ?? undefined,
        peculiarId: item.domainPeculiarId ?? undefined,
      },
      custoBase: item.custoBase,
      powers: orderedPowers.map((p) => this.sanitizePower(p)),
      powerArrays: item.itemPowerArrays.map((ipa: any) => this.sanitizePowerArray(ipa.powerArray)),
    };

    if (item.tipo === 'WEAPON') {
      base.critMargin = item.critMargin;
      base.critMultiplier = item.critMultiplier;
      base.alcance = item.alcance?.toLowerCase() ?? undefined;
      base.alcanceExtraMetros = item.alcanceExtraMetrosMetades
        ? item.alcanceExtraMetrosMetades / 2
        : 0;
      base.atributoEscalonamento = item.atributoEscalonamento ?? undefined;
      base.upgradeLevel = item.upgradeLevelValue ?? 0;
      base.danos = item.itemDamages.map((d: any) => ({
        dado: d.dado,
        base: d.base,
        espiritual: d.espiritual,
      }));
    } else if (item.tipo === 'DEFENSIVE_EQUIPMENT') {
      base.tipoEquipamento = item.tipoEquipamento?.toLowerCase() ?? undefined;
      base.baseRD = item.baseRD;
      base.atributoEscalonamento = item.atributoEscalonamento ?? undefined;
      base.upgradeLevel = item.upgradeLevelValue ?? 0;
    } else if (item.tipo === 'CONSUMABLE') {
      base.descritorEfeito = item.descritorEfeito;
      base.qtdDoses = item.qtdDoses;
      base.isRefeicao = item.isRefeicao;
    } else if (item.tipo === 'UPGRADE_MATERIAL') {
      base.tier = item.materialTier;
      base.maxUpgradeLimit = item.materialMaxUpgradeLimit;
    }

    return base;
  }

  async importItem(userId: string, body: ImportItemBodySchema) {
    const createdPowerIds: string[] = [];
    const createdPowerArrayIds: string[] = [];

    // Create powers
    if (body.powers && body.powers.length > 0) {
      for (const powerBody of body.powers) {
        const createdPower = await this.powersService.createPower(userId, powerBody);
        createdPowerIds.push(createdPower.id);
      }
    }

    // Create power arrays
    if (body.powerArrays && body.powerArrays.length > 0) {
      for (const arrayBody of body.powerArrays) {
        const nestedPowerIds: string[] = [];
        for (const nestedPowerBody of arrayBody.powers) {
          const createdPower = await this.powersService.createPower(userId, nestedPowerBody);
          nestedPowerIds.push(createdPower.id);
        }

        const createdArray = await this.powersService.createPowerArray(userId, {
          nome: arrayBody.nome,
          descricao: arrayBody.descricao,
          dominio: arrayBody.dominio,
          parametrosBase: arrayBody.parametrosBase,
          powerIds: nestedPowerIds,
          isPublic: arrayBody.isPublic,
          notas: arrayBody.notas,
          icone: arrayBody.icone,
        });

        createdPowerArrayIds.push(createdArray.id);
      }
    }

    // Prepare item creation payload
    const createItemBody: CreateItemBodySchema = {
      tipo: body.tipo,
      nome: body.nome,
      descricao: body.descricao,
      dominio: body.dominio,
      custoBase: body.custoBase,
      isPublic: body.isPublic,
      notas: body.notas,
      icone: body.icone ?? undefined,
      canStack: body.canStack,
      maxStack: body.maxStack,
      powerIds: createdPowerIds,
      powerArrayIds: createdPowerArrayIds,
      // Weapon specific
      ...(body.tipo === ItemType.WEAPON
        ? {
            danos: body.danos,
            critMargin: body.critMargin,
            critMultiplier: body.critMultiplier,
            alcance: body.alcance,
            alcanceExtraMetros: body.alcanceExtraMetros,
            atributoEscalonamento: body.atributoEscalonamento,
            upgradeLevel: body.upgradeLevel,
          }
        : {}),
      // Defensive specific
      ...(body.tipo === ItemType.DEFENSIVE_EQUIPMENT
        ? {
            tipoEquipamento: body.tipoEquipamento,
            baseRD: body.baseRD,
            atributoEscalonamento: body.atributoEscalonamento,
            upgradeLevel: body.upgradeLevel,
          }
        : {}),
      // Consumable specific
      ...(body.tipo === ItemType.CONSUMABLE
        ? {
            descritorEfeito: body.descritorEfeito,
            qtdDoses: body.qtdDoses,
            isRefeicao: body.isRefeicao,
          }
        : {}),
      // Upgrade material specific
      ...(body.tipo === ItemType.UPGRADE_MATERIAL
        ? {
            tier: body.tier,
            maxUpgradeLimit: body.maxUpgradeLimit,
          }
        : {}),
    } as any;

    return this.create(userId, createItemBody);
  }
}
