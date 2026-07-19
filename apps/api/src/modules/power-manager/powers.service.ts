import { calculatePowerCost, DomainName, getUnarmedMasteryTotalPdaCost } from '@aetherium/rules-engine';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import {
  CreatePeculiarityBodySchema,
  CreatePowerArrayBodySchema,
  CreatePowerBodySchema,
  UpdatePeculiarityBodySchema,
  UpdatePowerArrayBodySchema,
  UpdatePowerBodySchema,
} from './dto/power.dto';
import {
  DependencyConflictError,
  InvalidVisibilityError,
  NotAllowedError,
  ResourceNotFoundError,
} from './errors/power-errors';

const POWER_INCLUDE = {
  appliedEffects: {
    include: {
      appliedModifications: true,
    },
    orderBy: {
      posicao: 'asc' as const,
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      roles: true,
    },
  },
  peculiarity: true,
};

const POWER_ARRAY_INCLUDE = {
  powerArrayPowers: {
    include: {
      power: {
        include: {
          appliedEffects: {
            include: {
              appliedModifications: true,
            },
            orderBy: {
              posicao: 'asc' as const,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          peculiarity: true,
        },
      },
    },
    orderBy: {
      posicao: 'asc' as const,
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      roles: true,
    },
  },
};

function canBeEditedBy(resource: { userId: string | null }, userId: string): boolean {
  if (!resource.userId) return false;
  return resource.userId === userId;
}

function canBeAccessedBy(
  resource: { userId: string | null; isPublic: boolean },
  userId?: string,
): boolean {
  if (!resource.userId) return true;
  if (resource.isPublic) return true;
  if (userId && resource.userId === userId) return true;
  return false;
}

@Injectable()
export class PowersService {
  private readonly logger = new Logger(PowersService.name);

  constructor(private prisma: PrismaService) {}

  // ==========================================
  // PECULIARITY MANAGEMENT
  // ==========================================

  async createPeculiarity(userId: string, body: CreatePeculiarityBodySchema) {
    return this.prisma.peculiarity.create({
      data: {
        userId,
        nome: body.nome,
        descricao: body.descricao,
        espiritual: body.espiritual,
        isPublic: body.isPublic ?? false,
        icone: body.icone,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  async updatePeculiarity(
    peculiarityId: string,
    userId: string,
    body: UpdatePeculiarityBodySchema,
    isAdmin = false,
  ) {
    const existing = await this.prisma.peculiarity.findUnique({
      where: { id: peculiarityId },
    });

    if (!existing) {
      throw new ResourceNotFoundError('Peculiaridade não encontrada');
    }

    if (!isAdmin && !canBeEditedBy(existing, userId)) {
      throw new NotAllowedError();
    }

    return this.prisma.peculiarity.update({
      where: { id: peculiarityId },
      data: {
        nome: body.nome,
        descricao: body.descricao,
        espiritual: body.espiritual,
        isPublic: body.isPublic,
        icone: body.icone,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  async deletePeculiarity(peculiarityId: string, userId: string, isAdmin = false) {
    const existing = await this.prisma.peculiarity.findUnique({
      where: { id: peculiarityId },
    });

    if (!existing) {
      throw new ResourceNotFoundError('Peculiaridade não encontrada');
    }

    if (!isAdmin && !canBeEditedBy(existing, userId)) {
      throw new NotAllowedError();
    }

    await this.prisma.peculiarity.delete({
      where: { id: peculiarityId },
    });
  }

  async copyPublicPeculiarity(peculiarityId: string, userId: string) {
    const original = await this.prisma.peculiarity.findUnique({
      where: { id: peculiarityId },
    });

    if (!original) {
      throw new ResourceNotFoundError('Peculiaridade não encontrada');
    }

    if (!canBeAccessedBy(original, userId)) {
      throw new NotAllowedError('Acesso negado à peculiaridade');
    }

    return this.prisma.peculiarity.create({
      data: {
        userId,
        nome: original.nome,
        descricao: original.descricao,
        espiritual: original.espiritual,
        isPublic: false,
        icone: original.icone,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  async getPeculiarityById(peculiarityId: string) {
    const peculiarity = await this.prisma.peculiarity.findUnique({
      where: { id: peculiarityId },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    if (!peculiarity) {
      throw new ResourceNotFoundError('Peculiaridade não encontrada');
    }

    return peculiarity;
  }

  async fetchPublicPeculiarities(page: number) {
    return this.prisma.peculiarity.findMany({
      where: { isPublic: true },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      skip: (page - 1) * 20,
    });
  }

  async fetchUserPeculiarities(userId: string, page: number) {
    return this.prisma.peculiarity.findMany({
      where: { userId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      skip: (page - 1) * 20,
    });
  }

  // ==========================================
  // POWER MANAGEMENT
  // ==========================================

  private async calculateCostHelper(
    effects: CreatePowerBodySchema['effects'],
    parametros: CreatePowerBodySchema['parametros'],
    globalModifications?: CreatePowerBodySchema['globalModifications'],
  ) {
    const effectBaseIds = new Set(effects.map((e) => e.effectBaseId));
    const modBaseIds = new Set<string>();

    for (const e of effects) {
      if (e.modifications) {
        for (const m of e.modifications) {
          modBaseIds.add(m.modificationBaseId);
        }
      }
    }
    if (globalModifications) {
      for (const m of globalModifications) {
        modBaseIds.add(m.modificationBaseId);
      }
    }

    const dbEffectBases = await this.prisma.effectBase.findMany({
      where: { id: { in: Array.from(effectBaseIds) } },
    });
    const dbModBases = await this.prisma.modificationBase.findMany({
      where: { id: { in: Array.from(modBaseIds) } },
    });

    const effectBasesMap: Record<string, any> = {};
    for (const base of dbEffectBases) {
      effectBasesMap[base.id] = {
        id: base.id,
        nome: base.nome,
        custoBase: base.custoBase,
        parametrosPadraoAcao: base.parametrosPadraoAcao,
        parametrosPadraoAlcance: base.parametrosPadraoAlcance,
        parametrosPadraoDuracao: base.parametrosPadraoDuracao,
        configuracoes: base.configuracoes,
      };
    }

    const modBasesMap: Record<string, any> = {};
    for (const base of dbModBases) {
      modBasesMap[base.id] = {
        id: base.id,
        nome: base.nome,
        tipo: base.tipo.toLowerCase(),
        custoFixo: base.custoFixo,
        custoPorGrau: base.custoPorGrau,
        configuracoes: base.configuracoes,
      };
    }

    for (const id of effectBaseIds) {
      if (!effectBasesMap[id]) {
        throw new ResourceNotFoundError(`Efeito base não encontrado: ${id}`);
      }
    }
    for (const id of modBaseIds) {
      if (!modBasesMap[id]) {
        throw new ResourceNotFoundError(`Modificação base não encontrada: ${id}`);
      }
    }

    const calcResult = calculatePowerCost({
      effects: effects.map((e, index) => ({
        id: `temp-effect-${index}`,
        effectBaseId: e.effectBaseId,
        grau: e.grau,
        configuracaoId: e.configuracaoId,
        inputValue: e.inputValue !== undefined ? String(e.inputValue) : undefined,
        modifications: (e.modifications || []).map((m) => ({
          modificationBaseId: m.modificationBaseId,
          grau: m.grau ?? 1,
          parametros: m.parametros,
        })),
      })),
      parametros: {
        acao: parametros.acao,
        alcance: parametros.alcance,
        duracao: parametros.duracao,
      },
      globalModifications: (globalModifications || []).map((m) => ({
        modificationBaseId: m.modificationBaseId,
        grau: m.grau ?? 1,
        parametros: m.parametros,
      })),
      effectBases: effectBasesMap,
      modificationBases: modBasesMap,
    });

    if (!calcResult.success || !calcResult.result) {
      throw new ResourceNotFoundError(calcResult.error ?? 'Falha no cálculo do custo do poder');
    }

    return calcResult.result;
  }

  async createPower(userId: string | null, body: CreatePowerBodySchema) {
    const {
      nome,
      descricao,
      dominio,
      parametros,
      effects,
      globalModifications,
      custoAlternativo,
      isPublic,
      notas,
      icone,
    } = body;

    // Calculate cost
    const costResult = await this.calculateCostHelper(effects, parametros, globalModifications);

    // Domain / Peculiarity validations
    if (dominio.name === 'peculiar' && dominio.peculiarId) {
      const peculiarity = await this.prisma.peculiarity.findUnique({
        where: { id: dominio.peculiarId },
      });

      if (!peculiarity) {
        if (isPublic) {
          throw new InvalidVisibilityError(
            'Não é possível criar poder público: peculiaridade referenciada não foi encontrada',
          );
        }

        // Ghost Peculiarity auto-restore
        this.logger.warn(
          `[Ghost Peculiarity] peculiarId "${dominio.peculiarId}" não encontrado — criando placeholder para o power "${nome}" (userId=${userId})`,
        );

        if (!userId) {
          throw new InvalidVisibilityError(
            'Não é possível criar poder oficial sem a peculiaridade associada existir no sistema',
          );
        }

        await this.prisma.peculiarity.create({
          data: {
            id: dominio.peculiarId,
            userId,
            nome: `[Restaurada] Peculiaridade ${dominio.peculiarId.slice(0, 8)}`,
            descricao:
              'Peculiaridade restaurada automaticamente durante importação. Edite com a descrição correta.',
            espiritual: false,
            isPublic: false,
          },
        });
      }
    }

    const domainNameUpper = dominio.name.toUpperCase().replace(/-/g, '_') as DomainName;

    // If public, and references a peculiarity, make that peculiarity public as well
    if (isPublic && dominio.name === 'peculiar' && dominio.peculiarId) {
      await this.prisma.peculiarity.updateMany({
        where: { id: dominio.peculiarId, isPublic: false },
        data: { isPublic: true },
      });
    }

    // Build appliedEffects payload
    const createAppliedEffects = effects.map((e, i) => {
      const localMods = (e.modifications || []).map((m, j) => ({
        modificationBaseId: m.modificationBaseId,
        scope: 'LOCAL' as const,
        grau: m.grau ?? 1,
        parametros: m.parametros ?? undefined,
        nota: m.nota ?? undefined,
        posicao: j,
      }));

      const globalMods =
        i === 0
          ? (globalModifications || []).map((m, j) => ({
              modificationBaseId: m.modificationBaseId,
              scope: 'GLOBAL' as const,
              grau: m.grau ?? 1,
              parametros: m.parametros ?? undefined,
              nota: m.nota ?? undefined,
              posicao: localMods.length + j,
            }))
          : [];

      const effectCost = costResult.custoPorEfeito[`temp-effect-${i}`] || {
        pda: 0,
        pe: 0,
        espacos: 0,
      };

      return {
        effectBaseId: e.effectBaseId,
        grau: e.grau,
        configuracaoId: e.configuracaoId,
        inputValue: e.inputValue !== undefined ? String(e.inputValue) : undefined,
        dadoModularizado: e.dadoModularizado,
        custoPda: effectCost.pda,
        custoPe: effectCost.pe,
        custoEspacos: effectCost.espacos,
        nota: e.nota,
        posicao: i,
        appliedModifications: {
          create: [...localMods, ...globalMods],
        },
      };
    });

    return this.prisma.power.create({
      data: {
        userId,
        nome,
        descricao,
        isPublic,
        icone,
        notas,
        domainName: domainNameUpper as any,
        domainAreaConhecimento: dominio.areaConhecimento,
        domainPeculiarId: dominio.peculiarId,
        parametrosAcao: parametros.acao,
        parametrosAlcance: parametros.alcance,
        parametrosDuracao: parametros.duracao,
        custoTotalPda: costResult.custoTotal.pda,
        custoTotalPe: costResult.custoTotal.pe,
        custoTotalEspacos: costResult.custoTotal.espacos,
        custoAlternativoTipo: custoAlternativo?.tipo.toUpperCase(),
        custoAlternativoQuantidade: custoAlternativo?.quantidade,
        custoAlternativoDescricao: custoAlternativo?.descricao,
        custoAlternativoAtributo: custoAlternativo?.atributo,
        custoAlternativoItemId: custoAlternativo?.itemId,
        appliedEffects: {
          create: createAppliedEffects as any,
        },
      },
      include: POWER_INCLUDE,
    });
  }

  async updatePower(
    powerId: string,
    userId: string,
    body: UpdatePowerBodySchema,
    isAdmin = false,
    options?: {
      tx?: Prisma.TransactionClient;
      skipOwnershipCheck?: boolean;
      allowItemDomainChange?: boolean;
    },
  ) {
    const db = options?.tx ?? this.prisma;
    const existing = await db.power.findUnique({
      where: { id: powerId },
      include: POWER_INCLUDE,
    });

    if (!existing) {
      throw new ResourceNotFoundError('Poder não encontrado');
    }

    if (!options?.skipOwnershipCheck && !isAdmin && !canBeEditedBy(existing, userId)) {
      throw new NotAllowedError();
    }

    const {
      nome,
      descricao,
      dominio,
      parametros,
      effects,
      globalModifications,
      custoAlternativo,
      isPublic,
      notas,
      icone,
    } = body;

    // Check domain dependencies
    if (dominio) {
      const newDomainUpper = dominio.name.toUpperCase().replace(/-/g, '_') as any;
      if (existing.domainName !== newDomainUpper) {
        const isLinkedToAnyItem = await db.itemPower.count({ where: { powerId } });
        if (isLinkedToAnyItem > 0 && !options?.allowItemDomainChange) {
          throw new DependencyConflictError(
            'Não é possível alterar o domínio deste poder enquanto ele estiver vinculado a itens',
          );
        }

        const linkedPowerArrays = await db.powerArray.findMany({
          where: {
            powerArrayPowers: {
              some: { powerId },
            },
          },
          include: {
            powerArrayPowers: {
              include: {
                power: true,
              },
            },
          },
        });

        for (const powerArray of linkedPowerArrays) {
          const breaksArrayDomain = powerArray.powerArrayPowers
            .filter((pap) => pap.powerId !== powerId)
            .some((pap) => pap.power.domainName !== newDomainUpper);

          if (breaksArrayDomain) {
            throw new DependencyConflictError(
              `Não é possível alterar o domínio deste poder enquanto ele estiver vinculado ao acervo "${powerArray.nome}" com poderes de outro domínio`,
            );
          }
        }
      }
    }

    // Cost recalculation if needed
    let finalPda = existing.custoTotalPda;
    let finalPe = existing.custoTotalPe;
    let finalEspacos = existing.custoTotalEspacos;
    let costResult: any = null;

    if (effects !== undefined || globalModifications !== undefined || parametros !== undefined) {
      // Map existing effects if input is not provided
      const resolvedEffects =
        effects ??
        existing.appliedEffects.map((ae) => {
          const mods = ae.appliedModifications
            .filter((m) => m.scope !== 'GLOBAL')
            .map((m) => ({
              modificationBaseId: m.modificationBaseId,
              scope: 'local' as const,
              grau: m.grau,
              parametros: (m.parametros as any) || undefined,
              nota: m.nota || undefined,
            }));

          return {
            effectBaseId: ae.effectBaseId,
            grau: ae.grau,
            configuracaoId: ae.configuracaoId || undefined,
            inputValue: ae.inputValue !== null ? ae.inputValue : undefined,
            dadoModularizado: ae.dadoModularizado || undefined,
            modifications: mods,
            nota: ae.nota || undefined,
          };
        });

      const resolvedParams = parametros ?? {
        acao: existing.parametrosAcao,
        alcance: existing.parametrosAlcance,
        duracao: existing.parametrosDuracao,
      };

      const resolvedGlobalMods =
        globalModifications ??
        existing.appliedEffects
          .flatMap((ae) => ae.appliedModifications)
          .filter((m) => m.scope === 'GLOBAL')
          .map((m) => ({
            modificationBaseId: m.modificationBaseId,
            scope: 'global' as const,
            grau: m.grau,
            parametros: (m.parametros as any) || undefined,
            nota: m.nota || undefined,
          }));

      costResult = await this.calculateCostHelper(
        resolvedEffects,
        resolvedParams,
        resolvedGlobalMods,
      );
      finalPda = costResult.custoTotal.pda;
      finalPe = costResult.custoTotal.pe;
      finalEspacos = costResult.custoTotal.espacos;
    }

    // Visibility / Peculiarity validation
    let resolvedIsPublic = existing.isPublic;
    if (isPublic !== undefined) {
      resolvedIsPublic = isPublic;
      if (isPublic) {
        const pecId = dominio?.peculiarId || existing.domainPeculiarId;
        if (pecId) {
          const peculiarity = await db.peculiarity.findUnique({ where: { id: pecId } });
          if (!peculiarity) {
            throw new InvalidVisibilityError(
              'Não é possível tornar o poder público pois a peculiaridade referenciada não foi encontrada',
            );
          }
          if (!peculiarity.isPublic) {
            await db.peculiarity.update({
              where: { id: pecId },
              data: { isPublic: true },
            });
          }
        }
      }
    }

    const domainNameUpper = dominio
      ? (dominio.name.toUpperCase().replace(/-/g, '_') as DomainName)
      : undefined;

    const performUpdate = async (tx: Prisma.TransactionClient) => {
      // Recreate applied effects & modifications if cost recalculation or effects update happened
      if (effects !== undefined || globalModifications !== undefined || parametros !== undefined) {
        await tx.appliedEffect.deleteMany({ where: { powerId } });

        const resolvedEffects =
          effects ??
          existing.appliedEffects.map((ae) => {
            const mods = ae.appliedModifications
              .filter((m) => m.scope !== 'GLOBAL')
              .map((m) => ({
                modificationBaseId: m.modificationBaseId,
                scope: 'local' as const,
                grau: m.grau,
                parametros: (m.parametros as any) || undefined,
                nota: m.nota || undefined,
              }));

            return {
              effectBaseId: ae.effectBaseId,
              grau: ae.grau,
              configuracaoId: ae.configuracaoId || undefined,
              inputValue: ae.inputValue !== null ? ae.inputValue : undefined,
              dadoModularizado: ae.dadoModularizado || undefined,
              modifications: mods,
              nota: ae.nota || undefined,
            };
          });

        const resolvedGlobalMods =
          globalModifications ??
          existing.appliedEffects
            .flatMap((ae) => ae.appliedModifications)
            .filter((m) => m.scope === 'GLOBAL')
            .map((m) => ({
              modificationBaseId: m.modificationBaseId,
              scope: 'global' as const,
              grau: m.grau,
              parametros: (m.parametros as any) || undefined,
              nota: m.nota || undefined,
            }));

        const createAppliedEffects = resolvedEffects.map((e, i) => {
          const localMods = (e.modifications || []).map((m, j) => ({
            modificationBaseId: m.modificationBaseId,
            scope: 'LOCAL' as const,
            grau: m.grau ?? 1,
            parametros: m.parametros ?? undefined,
            nota: m.nota ?? undefined,
            posicao: j,
          }));

          const globalMods =
            i === 0
              ? (resolvedGlobalMods || []).map((m, j) => ({
                  modificationBaseId: m.modificationBaseId,
                  scope: 'GLOBAL' as const,
                  grau: m.grau ?? 1,
                  parametros: m.parametros ?? undefined,
                  nota: m.nota ?? undefined,
                  posicao: localMods.length + j,
                }))
              : [];

          const effectCost = costResult.custoPorEfeito[`temp-effect-${i}`] || {
            pda: 0,
            pe: 0,
            espacos: 0,
          };

          return {
            effectBaseId: e.effectBaseId,
            grau: e.grau,
            configuracaoId: e.configuracaoId,
            inputValue: e.inputValue !== undefined ? String(e.inputValue) : undefined,
            dadoModularizado: e.dadoModularizado,
            custoPda: effectCost.pda,
            custoPe: effectCost.pe,
            custoEspacos: effectCost.espacos,
            nota: e.nota,
            posicao: i,
            appliedModifications: {
              create: [...localMods, ...globalMods],
            },
          };
        });

        // Write directly
        await tx.power.update({
          where: { id: powerId },
          data: {
            appliedEffects: {
              create: createAppliedEffects,
            },
          },
        });
      }

      // Update Power table
      const updated = await tx.power.update({
        where: { id: powerId },
        data: {
          nome,
          descricao,
          isPublic: resolvedIsPublic,
          icone: icone === null ? null : icone,
          notas,
          domainName: domainNameUpper as any,
          domainAreaConhecimento: dominio ? (dominio.areaConhecimento ?? null) : undefined,
          domainPeculiarId: dominio ? (dominio.peculiarId ?? null) : undefined,
          parametrosAcao: parametros ? parametros.acao : undefined,
          parametrosAlcance: parametros ? parametros.alcance : undefined,
          parametrosDuracao: parametros ? parametros.duracao : undefined,
          custoTotalPda: finalPda,
          custoTotalPe: finalPe,
          custoTotalEspacos: finalEspacos,
          custoAlternativoTipo: custoAlternativo ? custoAlternativo.tipo.toUpperCase() : undefined,
          custoAlternativoQuantidade: custoAlternativo ? custoAlternativo.quantidade : undefined,
          custoAlternativoDescricao: custoAlternativo
            ? (custoAlternativo.descricao ?? null)
            : undefined,
          custoAlternativoAtributo: custoAlternativo
            ? (custoAlternativo.atributo ?? null)
            : undefined,
          custoAlternativoItemId: custoAlternativo ? (custoAlternativo.itemId ?? null) : undefined,
        },
        include: POWER_INCLUDE,
      });

      // Recalculate linked character powers
      await tx.characterPower.updateMany({
        where: { powerId },
        data: {
          finalPdaCost: finalPda,
          slotCost: finalEspacos,
        },
      });

      // Recalculate linked power arrays
      const impactedArrayLinks = await tx.powerArrayPower.findMany({
        where: { powerId },
        select: { powerArrayId: true },
        distinct: ['powerArrayId'],
      });

      for (const { powerArrayId } of impactedArrayLinks) {
        const arrayPowers = await tx.powerArrayPower.findMany({
          where: { powerArrayId },
          select: {
            power: {
              select: {
                custoTotalPda: true,
                custoTotalPe: true,
                custoTotalEspacos: true,
              },
            },
          },
        });

        const highestPda = arrayPowers.length
          ? Math.max(...arrayPowers.map((entry) => entry.power.custoTotalPda))
          : 0;
        const additionalPowersCost = Math.max(0, arrayPowers.length - 1);
        const totalPe = arrayPowers.reduce((sum, entry) => sum + entry.power.custoTotalPe, 0);
        const totalEspacos = arrayPowers.reduce(
          (sum, entry) => sum + entry.power.custoTotalEspacos,
          0,
        );

        await tx.powerArray.update({
          where: { id: powerArrayId },
          data: {
            custoTotalPda: highestPda + additionalPowersCost,
            custoTotalPe: totalPe,
            custoTotalEspacos: totalEspacos,
          },
        });

        await tx.characterPowerArray.updateMany({
          where: { powerArrayId },
          data: {
            finalPdaCost: highestPda + additionalPowersCost,
            slotCost: totalEspacos,
          },
        });
      }

      // Recalculate spentPda for impacted characters
      const impactedCharactersFromPowers = await tx.characterPower.findMany({
        where: { powerId },
        select: { characterId: true },
        distinct: ['characterId'],
      });

      const impactedCharactersFromArrays = await tx.characterPowerArray.findMany({
        where: {
          powerArrayId: {
            in: impactedArrayLinks.map((link) => link.powerArrayId),
          },
        },
        select: { characterId: true },
        distinct: ['characterId'],
      });

      const impactedCharacterIds = Array.from(
        new Set([
          ...impactedCharactersFromPowers.map(({ characterId }) => characterId),
          ...impactedCharactersFromArrays.map(({ characterId }) => characterId),
        ]),
      );

      for (const characterId of impactedCharacterIds) {
        const [powersSum, arraysSum, benefitsSum, character] = await Promise.all([
          tx.characterPower.aggregate({
            where: { characterId },
            _sum: { finalPdaCost: true },
          }),
          tx.characterPowerArray.aggregate({
            where: { characterId },
            _sum: { finalPdaCost: true },
          }),
          tx.characterBenefit.aggregate({
            where: { characterId },
            _sum: { pdaCost: true },
          }),
          tx.character.findUnique({
            where: { id: characterId },
            select: { pdaState: true, unarmedMastery: true, spiritualPrinciple: true },
          }),
        ]);

        if (!character) continue;

        const currentPdaState = (character.pdaState ?? {}) as Record<string, unknown>;
        const unarmedMasteryCost = getUnarmedMasteryTotalPdaCost(character.unarmedMastery);
        const recalculatedSpent =
          (powersSum._sum.finalPdaCost ?? 0) +
          (arraysSum._sum.finalPdaCost ?? 0) +
          (benefitsSum._sum.pdaCost ?? 0) +
          unarmedMasteryCost;

        await tx.character.update({
          where: { id: characterId },
          data: {
            pdaState: {
              ...(currentPdaState as any),
              spentPda: recalculatedSpent,
            },
          },
        });
      }

      return updated;
    };

    return options?.tx
      ? performUpdate(options.tx)
      : this.prisma.$transaction((tx) => performUpdate(tx));
  }

  async deletePower(powerId: string, userId: string, isAdmin = false) {
    const existing = await this.prisma.power.findUnique({
      where: { id: powerId },
      include: POWER_INCLUDE,
    });

    if (!existing) {
      throw new ResourceNotFoundError('Poder não encontrado');
    }

    if (!isAdmin && !canBeEditedBy(existing, userId)) {
      throw new NotAllowedError();
    }

    // Check if any linked array would be orphaned (empty)
    const linkedPowerArrays = await this.prisma.powerArray.findMany({
      where: {
        powerArrayPowers: {
          some: { powerId },
        },
      },
      include: {
        powerArrayPowers: true,
      },
    });

    const orphaningArray = linkedPowerArrays.find((array) => array.powerArrayPowers.length <= 1);
    if (orphaningArray) {
      throw new DependencyConflictError(
        `Não é possível excluir o poder porque o acervo "${orphaningArray.nome}" ficaria sem poderes`,
      );
    }

    // Check item linkages
    const isLinkedToAnyItem = await this.prisma.itemPower.count({ where: { powerId } });
    if (isLinkedToAnyItem > 0) {
      throw new DependencyConflictError(
        'Não é possível excluir o poder porque ele está vinculado a pelo menos um item',
      );
    }

    await this.prisma.power.delete({
      where: { id: powerId },
    });
  }

  async copyPublicPower(powerId: string, userId: string) {
    const original = await this.prisma.power.findUnique({
      where: { id: powerId },
      include: POWER_INCLUDE,
    });

    if (!original) {
      throw new ResourceNotFoundError('Poder não encontrado');
    }

    if (!canBeAccessedBy(original, userId)) {
      throw new NotAllowedError('Acesso negado ao poder');
    }

    const domainNameUpper = original.domainName;

    const createAppliedEffects = original.appliedEffects.map((e, i) => {
      const localMods = e.appliedModifications
        .filter((m) => m.scope !== 'GLOBAL')
        .map((m, j) => ({
          modificationBaseId: m.modificationBaseId,
          scope: 'LOCAL' as const,
          grau: m.grau,
          parametros: (m.parametros as any) || undefined,
          nota: m.nota || undefined,
          posicao: j,
        }));

      const globalMods =
        i === 0
          ? e.appliedModifications
              .filter((m) => m.scope === 'GLOBAL')
              .map((m, j) => ({
                modificationBaseId: m.modificationBaseId,
                scope: 'GLOBAL' as const,
                grau: m.grau,
                parametros: (m.parametros as any) || undefined,
                nota: m.nota || undefined,
                posicao: localMods.length + j,
              }))
          : [];

      return {
        effectBaseId: e.effectBaseId,
        grau: e.grau,
        configuracaoId: e.configuracaoId || undefined,
        inputValue: e.inputValue !== null ? e.inputValue : undefined,
        custoPda: e.custoPda,
        custoPe: e.custoPe,
        custoEspacos: e.custoEspacos,
        nota: e.nota || undefined,
        posicao: i,
        appliedModifications: {
          create: [...localMods, ...globalMods],
        },
      };
    });

    return this.prisma.power.create({
      data: {
        userId,
        nome: original.nome,
        descricao: original.descricao,
        isPublic: false,
        icone: original.icone,
        notas: original.notas,
        domainName: domainNameUpper,
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
          create: createAppliedEffects,
        },
      },
      include: POWER_INCLUDE,
    });
  }

  async getPowerById(powerId: string) {
    const power = await this.prisma.power.findUnique({
      where: { id: powerId },
      include: POWER_INCLUDE,
    });

    if (!power) {
      throw new ResourceNotFoundError('Poder não encontrado');
    }

    return power;
  }

  async fetchPublicPowers(page: number) {
    return this.prisma.power.findMany({
      where: { isPublic: true },
      include: POWER_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 20,
      skip: (page - 1) * 20,
    });
  }

  async fetchUserPowers(userId: string, page: number) {
    const ownedLinks = await this.prisma.itemPower.findMany({
      where: { ownsPower: true },
      select: { powerId: true },
    });
    return this.prisma.power.findMany({
      where: {
        userId,
        characterId: null,
        id: { notIn: ownedLinks.map((link) => link.powerId) },
      },
      include: POWER_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 20,
      skip: (page - 1) * 20,
    });
  }

  async fetchCharacterPowers(characterId: string) {
    const characterPowers = await this.prisma.characterPower.findMany({
      where: { characterId },
      include: {
        power: {
          include: POWER_INCLUDE,
        },
      },
    });

    return characterPowers.map((cp) => cp.power);
  }

  // ==========================================
  // POWER ARRAY MANAGEMENT
  // ==========================================

  async createPowerArray(userId: string, body: CreatePowerArrayBodySchema) {
    const { nome, descricao, dominio, parametrosBase, powerIds, isPublic, notas, icone } = body;

    const domainNameUpper = dominio.name.toUpperCase().replace(/-/g, '_') as DomainName;

    // Check powers exist and access control
    const powers = await this.prisma.power.findMany({
      where: { id: { in: powerIds } },
    });

    if (powers.length !== powerIds.length) {
      throw new ResourceNotFoundError('Um ou mais poderes não foram encontrados');
    }

    for (const p of powers) {
      if (!canBeAccessedBy(p, userId)) {
        throw new NotAllowedError('Acesso negado a um dos poderes selecionados');
      }
    }

    // Calculate array cost: highest Pda cost + 1 for each additional power
    const highestPda = powers.length ? Math.max(...powers.map((p) => p.custoTotalPda)) : 0;
    const additionalPowersCost = Math.max(0, powers.length - 1);
    const totalPe = powers.reduce((sum, p) => sum + p.custoTotalPe, 0);
    const totalEspacos = powers.reduce((sum, p) => sum + p.custoTotalEspacos, 0);

    // If public, make sure all powers are public too
    if (isPublic) {
      await this.prisma.$transaction(async (tx) => {
        for (const p of powers) {
          if (!p.isPublic) {
            await tx.power.update({ where: { id: p.id }, data: { isPublic: true } });
            // If the power references a peculiarity, make that public too
            if (p.domainPeculiarId) {
              await tx.peculiarity.update({
                where: { id: p.domainPeculiarId },
                data: { isPublic: true },
              });
            }
          }
        }
      });
    }

    const powerArrayPowers = powerIds.map((powerId, index) => ({
      powerId,
      posicao: index,
    }));

    return this.prisma.powerArray.create({
      data: {
        userId,
        nome,
        descricao,
        isPublic,
        icone,
        notas,
        domainName: domainNameUpper as any,
        domainAreaConhecimento: dominio.areaConhecimento,
        domainPeculiarId: dominio.peculiarId,
        parametrosBaseAcao: parametrosBase?.acao,
        parametrosBaseAlcance: parametrosBase?.alcance,
        parametrosBaseDuracao: parametrosBase?.duracao,
        custoTotalPda: highestPda + additionalPowersCost,
        custoTotalPe: totalPe,
        custoTotalEspacos: totalEspacos,
        powerArrayPowers: {
          create: powerArrayPowers,
        },
      },
      include: POWER_ARRAY_INCLUDE,
    });
  }

  async updatePowerArray(powerArrayId: string, userId: string, body: UpdatePowerArrayBodySchema, isAdmin = false) {
    const existing = await this.prisma.powerArray.findUnique({
      where: { id: powerArrayId },
      include: POWER_ARRAY_INCLUDE,
    });

    if (!existing) {
      throw new ResourceNotFoundError('Acervo não encontrado');
    }

    if (!isAdmin && !canBeEditedBy(existing, userId)) {
      throw new NotAllowedError();
    }

    const { nome, descricao, dominio, parametrosBase, powerIds, isPublic, notas, icone } = body;

    const domainNameUpper = dominio
      ? (dominio.name.toUpperCase().replace(/-/g, '_') as DomainName)
      : undefined;

    // Check if linked to any item and we are changing domain
    if (dominio && domainNameUpper) {
      if (existing.domainName !== (domainNameUpper as any)) {
        const isLinkedToAnyItem = await this.prisma.itemPowerArray.count({
          where: { powerArrayId },
        });
        if (isLinkedToAnyItem > 0) {
          throw new DependencyConflictError(
            'Não é possível alterar o domínio do acervo porque ele está vinculado a pelo menos um item',
          );
        }
      }
    }

    // Resolve powers and calculate cost
    let finalPda = existing.custoTotalPda;
    let finalPe = existing.custoTotalPe;
    let finalEspacos = existing.custoTotalEspacos;
    let resolvedPowerIds = existing.powerArrayPowers.map((pap) => pap.powerId);

    if (powerIds !== undefined) {
      resolvedPowerIds = powerIds;
      const powers = await this.prisma.power.findMany({
        where: { id: { in: powerIds } },
      });

      if (powers.length !== powerIds.length) {
        throw new ResourceNotFoundError('Um ou mais poderes não foram encontrados');
      }

      for (const p of powers) {
        if (!isAdmin && !canBeAccessedBy(p, userId)) {
          throw new NotAllowedError('Acesso negado a um dos poderes selecionados');
        }
      }

      const highestPda = powers.length ? Math.max(...powers.map((p) => p.custoTotalPda)) : 0;
      const additionalPowersCost = Math.max(0, powers.length - 1);
      finalPe = powers.reduce((sum, p) => sum + p.custoTotalPe, 0);
      finalEspacos = powers.reduce((sum, p) => sum + p.custoTotalEspacos, 0);
      finalPda = highestPda + additionalPowersCost;
    }

    // Resolve visibility
    let resolvedIsPublic = existing.isPublic;
    if (isPublic !== undefined) {
      resolvedIsPublic = isPublic;
      if (isPublic) {
        // Make all powers public
        await this.prisma.$transaction(async (tx) => {
          const powerIdsToPublish = resolvedPowerIds;
          const powersToPublish = await tx.power.findMany({
            where: { id: { in: powerIdsToPublish } },
          });
          for (const p of powersToPublish) {
            if (!p.isPublic) {
              await tx.power.update({ where: { id: p.id }, data: { isPublic: true } });
              if (p.domainPeculiarId) {
                await tx.peculiarity.update({
                  where: { id: p.domainPeculiarId },
                  data: { isPublic: true },
                });
              }
            }
          }
        });
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (powerIds !== undefined) {
        // Recreate power array powers
        await tx.powerArrayPower.deleteMany({ where: { powerArrayId } });

        const powerArrayPowers = resolvedPowerIds.map((powerId, index) => ({
          powerId,
          posicao: index,
        }));

        await tx.powerArray.update({
          where: { id: powerArrayId },
          data: {
            powerArrayPowers: {
              create: powerArrayPowers,
            },
          },
        });
      }

      const updated = await tx.powerArray.update({
        where: { id: powerArrayId },
        data: {
          nome,
          descricao,
          isPublic: resolvedIsPublic,
          icone: icone === null ? null : icone,
          notas,
          domainName: domainNameUpper as any,
          domainAreaConhecimento: dominio ? (dominio.areaConhecimento ?? null) : undefined,
          domainPeculiarId: dominio ? (dominio.peculiarId ?? null) : undefined,
          parametrosBaseAcao: parametrosBase ? parametrosBase.acao : undefined,
          parametrosBaseAlcance: parametrosBase ? parametrosBase.alcance : undefined,
          parametrosBaseDuracao: parametrosBase ? parametrosBase.duracao : undefined,
          custoTotalPda: finalPda,
          custoTotalPe: finalPe,
          custoTotalEspacos: finalEspacos,
        },
        include: POWER_ARRAY_INCLUDE,
      });

      // Recalculate character links
      await tx.characterPowerArray.updateMany({
        where: { powerArrayId },
        data: {
          finalPdaCost: finalPda,
          slotCost: finalEspacos,
        },
      });

      // Recalculate spent pda for all impacted characters
      const impactedCharacters = await tx.characterPowerArray.findMany({
        where: { powerArrayId },
        select: { characterId: true },
        distinct: ['characterId'],
      });

      for (const { characterId } of impactedCharacters) {
        const [powersSum, arraysSum, benefitsSum, character] = await Promise.all([
          tx.characterPower.aggregate({
            where: { characterId },
            _sum: { finalPdaCost: true },
          }),
          tx.characterPowerArray.aggregate({
            where: { characterId },
            _sum: { finalPdaCost: true },
          }),
          tx.characterBenefit.aggregate({
            where: { characterId },
            _sum: { pdaCost: true },
          }),
          tx.character.findUnique({
            where: { id: characterId },
            select: { pdaState: true, unarmedMastery: true, spiritualPrinciple: true },
          }),
        ]);

        if (!character) continue;

        const currentPdaState = (character.pdaState ?? {}) as Record<string, unknown>;
        const unarmedMasteryCost = getUnarmedMasteryTotalPdaCost(character.unarmedMastery);
        const recalculatedSpent =
          (powersSum._sum.finalPdaCost ?? 0) +
          (arraysSum._sum.finalPdaCost ?? 0) +
          (benefitsSum._sum.pdaCost ?? 0) +
          unarmedMasteryCost;

        await tx.character.update({
          where: { id: characterId },
          data: {
            pdaState: {
              ...(currentPdaState as any),
              spentPda: recalculatedSpent,
            },
          },
        });
      }

      return updated;
    });
  }

  async deletePowerArray(powerArrayId: string, userId: string, isAdmin = false) {
    const existing = await this.prisma.powerArray.findUnique({
      where: { id: powerArrayId },
    });

    if (!existing) {
      throw new ResourceNotFoundError('Acervo não encontrado');
    }

    if (!isAdmin && !canBeEditedBy(existing, userId)) {
      throw new NotAllowedError();
    }

    const isLinkedToAnyItem = await this.prisma.itemPowerArray.count({ where: { powerArrayId } });
    if (isLinkedToAnyItem > 0) {
      throw new DependencyConflictError(
        'Não é possível excluir o acervo porque ele está vinculado a pelo menos um item',
      );
    }

    await this.prisma.powerArray.delete({
      where: { id: powerArrayId },
    });
  }

  async copyPublicPowerArray(powerArrayId: string, userId: string) {
    const original = await this.prisma.powerArray.findUnique({
      where: { id: powerArrayId },
      include: POWER_ARRAY_INCLUDE,
    });

    if (!original) {
      throw new ResourceNotFoundError('Acervo não encontrado');
    }

    if (!canBeAccessedBy(original, userId)) {
      throw new NotAllowedError('Acesso negado ao acervo');
    }

    // Copy every power of the power array
    const copiedPowerIds: string[] = [];

    for (const pap of original.powerArrayPowers) {
      const p = pap.power;

      const createAppliedEffects = p.appliedEffects.map((e, i) => {
        const localMods = e.appliedModifications
          .filter((m) => m.scope !== 'GLOBAL')
          .map((m, j) => ({
            modificationBaseId: m.modificationBaseId,
            scope: 'LOCAL' as const,
            grau: m.grau,
            parametros: (m.parametros as any) || undefined,
            nota: m.nota || undefined,
            posicao: j,
          }));

        const globalMods =
          i === 0
            ? e.appliedModifications
                .filter((m) => m.scope === 'GLOBAL')
                .map((m, j) => ({
                  modificationBaseId: m.modificationBaseId,
                  scope: 'GLOBAL' as const,
                  grau: m.grau,
                  parametros: (m.parametros as any) || undefined,
                  nota: m.nota || undefined,
                  posicao: localMods.length + j,
                }))
            : [];

        return {
          effectBaseId: e.effectBaseId,
          grau: e.grau,
          configuracaoId: e.configuracaoId || undefined,
          inputValue: e.inputValue !== null ? e.inputValue : undefined,
          custoPda: e.custoPda,
          custoPe: e.custoPe,
          custoEspacos: e.custoEspacos,
          nota: e.nota || undefined,
          posicao: i,
          appliedModifications: {
            create: [...localMods, ...globalMods],
          },
        };
      });

      const copiedPower = await this.prisma.power.create({
        data: {
          userId,
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
            create: createAppliedEffects,
          },
        },
      });

      copiedPowerIds.push(copiedPower.id);
    }

    const powerArrayPowers = copiedPowerIds.map((powerId, index) => ({
      powerId,
      posicao: index,
    }));

    return this.prisma.powerArray.create({
      data: {
        userId,
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
          create: powerArrayPowers,
        },
      },
      include: POWER_ARRAY_INCLUDE,
    });
  }

  async getPowerArrayById(powerArrayId: string) {
    const powerArray = await this.prisma.powerArray.findUnique({
      where: { id: powerArrayId },
      include: POWER_ARRAY_INCLUDE,
    });

    if (!powerArray) {
      throw new ResourceNotFoundError('Acervo não encontrado');
    }

    return powerArray;
  }

  async fetchPublicPowerArrays(page: number) {
    return this.prisma.powerArray.findMany({
      where: { isPublic: true },
      include: POWER_ARRAY_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 20,
      skip: (page - 1) * 20,
    });
  }

  async fetchUserPowerArrays(userId: string, page: number) {
    return this.prisma.powerArray.findMany({
      where: { userId, characterId: null },
      include: POWER_ARRAY_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 20,
      skip: (page - 1) * 20,
    });
  }

  async fetchCharacterPowerArrays(characterId: string) {
    const characterPowerArrays = await this.prisma.characterPowerArray.findMany({
      where: { characterId },
      include: {
        powerArray: {
          include: POWER_ARRAY_INCLUDE,
        },
      },
    });

    return characterPowerArrays.map((cpa) => cpa.powerArray);
  }

  async fetchEffects(category?: string) {
    return this.prisma.effectBase.findMany({
      where: category ? { categorias: { has: category } } : {},
      orderBy: { nome: 'asc' },
    });
  }

  async fetchModifications(type?: 'extra' | 'falha', category?: string) {
    const rawType = type === 'extra' ? 'EXTRA' : type === 'falha' ? 'FALHA' : undefined;
    return this.prisma.modificationBase.findMany({
      where: {
        ...(rawType ? { tipo: rawType as any } : {}),
        ...(category ? { categoria: category } : {}),
      },
      orderBy: { nome: 'asc' },
    });
  }

  async promotePower(powerId: string) {
    const existing = await this.prisma.power.findUnique({
      where: { id: powerId },
    });

    if (!existing) {
      throw new ResourceNotFoundError('Poder não encontrado');
    }

    return this.prisma.power.update({
      where: { id: powerId },
      data: {
        userId: null,
        isPublic: true,
      },
      include: POWER_INCLUDE,
    });
  }

  async fetchAllPowers() {
    const ownedPowerIds = new Set(
      (await this.prisma.itemPower.findMany({
        where: { ownsPower: true },
        select: { powerId: true },
      })).map((link) => link.powerId),
    );
    const powers = await this.prisma.power.findMany({
      include: POWER_INCLUDE,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return powers.filter(
      (power) => power.userId !== null
        && power.characterId === null
        && !ownedPowerIds.has(power.id)
        && !power.user?.roles?.includes('ADMIN'),
    );
  }

  async promotePowerArray(powerArrayId: string) {
    const existing = await this.prisma.powerArray.findUnique({
      where: { id: powerArrayId },
    });

    if (!existing) {
      throw new ResourceNotFoundError('Acervo não encontrado');
    }

    return this.prisma.powerArray.update({
      where: { id: powerArrayId },
      data: {
        userId: null,
        isPublic: true,
      },
      include: POWER_ARRAY_INCLUDE,
    });
  }

  async fetchAllPowerArrays() {
    const arrays = await this.prisma.powerArray.findMany({
      include: POWER_ARRAY_INCLUDE,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return arrays.filter(
      (array) => array.userId !== null && array.characterId === null && !array.user?.roles?.includes('ADMIN'),
    );
  }

  async promotePeculiarity(peculiarityId: string) {
    const existing = await this.prisma.peculiarity.findUnique({
      where: { id: peculiarityId },
    });

    if (!existing) {
      throw new ResourceNotFoundError('Peculiaridade não encontrada');
    }

    return this.prisma.peculiarity.update({
      where: { id: peculiarityId },
      data: {
        userId: null,
        isPublic: true,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  async fetchAllPeculiarities() {
    const peculiarities = await this.prisma.peculiarity.findMany({
      include: {
        user: { select: { id: true, name: true, roles: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return peculiarities.filter(
      (pec) => pec.userId !== null && !pec.user?.roles?.includes('ADMIN'),
    );
  }
}
