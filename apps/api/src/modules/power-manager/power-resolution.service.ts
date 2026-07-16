import { Injectable } from '@nestjs/common';
import {
  parseBehavior,
  parseModificationAutomation,
  resolvePowerUse,
  resolvePassiveModifiers,
  getResolutionMode,
  applyDamage,
  applyHeal,
  applyRecoverEnergy,
  applyConsumeEnergy,
  applyCondition,
  applyAddTemporaryPV,
  applyAddTemporaryPE,
} from '@aetherium/rules-engine';
import type {
  ResolvedPower,
  ResolvedEffect,
  ResolvedModification,
  GameMutation,
  PassiveModifier,
  PowerUseContext,
  PassiveContext,
} from '@aetherium/rules-engine';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { ResourceNotFoundError } from './errors/power-errors.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

function rollFormula(formula: string): number {
  const clean = formula.trim();
  const regex = /^(\d+)d(\d+)(?:([+-])(\d+))?$/i;
  const match = clean.match(regex);
  if (!match) {
    const val = Number.parseInt(clean, 10);
    return Number.isNaN(val) ? 0 : val;
  }

  const qtd = Number.parseInt(match[1], 10);
  const lados = Number.parseInt(match[2], 10);
  const sinal = match[3];
  const mod = match[4] ? Number.parseInt(match[4], 10) : 0;

  let total = 0;
  for (let i = 0; i < qtd; i++) {
    total += Math.floor(Math.random() * lados) + 1;
  }

  if (sinal === '+') total += mod;
  if (sinal === '-') total -= mod;

  return total;
}

// ─── DTOs de entrada ──────────────────────────────────────────────────────────

export interface ResolvePowerUseInput {
  powerId: string;
  context: PowerUseContext;
  /** IDs escolhidos explicitamente pelo jogador (para modificações SELETIVO) */
  selectedTargetIds?: string[];
}

export interface ResolvePowerUseResult {
  mutations: GameMutation[];
  /** Modo de resolução do poder — narrativo implica sem automação */
  resolutionMode: 'ON_USE' | 'PASSIVE' | 'NARRATIVE';
  isDanoAcoplado?: boolean;
  isRecuperacaoAcoplada?: boolean;
}

export interface ResolvePassiveInput {
  characterId: string;
  /** IDs dos poderes passivos equipados (acao=5 com behavior mecânico) */
  equippedPassivePowerIds: string[];
  activeConditions: string[];
  /** IDs dos benefícios ativos */
  activeBenefitIds: string[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class PowerResolutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Resolve o uso de um poder ON_USE.
   *
   * Hidrata o poder do banco (incluindo behavior dos efeitos e campos de
   * automação das modificações), busca os marcadores de cena ativos e
   * chama o motor puro `resolvePowerUse()`.
   *
   * O motor não aplica nada — devolve GameMutation[] para o chamador
   * decidir como persistir (diretamente, ou aguardando confirmação do narrador).
   */
  async resolvePower(input: ResolvePowerUseInput): Promise<ResolvePowerUseResult> {
    const { powerId, context, selectedTargetIds } = input;

    // 1. Busca o poder com efeitos, modificações e catalog entries
    const power = await this.prisma.power.findUnique({
      where: { id: powerId },
      include: {
        peculiarity: { select: { espiritual: true } },
        appliedEffects: {
          include: {
            effectBase: { select: { id: true, behavior: true } },
            appliedModifications: {
              include: {
                modificationBase: {
                  select: {
                    id: true,
                    targetingEffect: true,
                    casterEffect: true,
                    markerCondition: true,
                  },
                },
              },
              orderBy: { posicao: 'asc' },
            },
          },
          orderBy: { posicao: 'asc' },
        },
      },
    });

    if (!power) {
      throw new ResourceNotFoundError('Poder não encontrado');
    }

    const parametros = {
      acao: power.parametrosAcao,
      alcance: power.parametrosAlcance,
      duracao: power.parametrosDuracao,
    };

    // 2. Determina modo de resolução pelo primeiro efeito com behavior mecânico
    const firstMechanicalBehavior = power.appliedEffects
      .map((ae) => parseBehavior(ae.effectBase.behavior))
      .find((b) => b !== null && b.kind !== 'NARRATIVO');

    const resolutionMode = getResolutionMode(parametros, firstMechanicalBehavior !== undefined);

    // Passivos e narrativos não produzem GameMutation via este endpoint
    if (resolutionMode.mode !== 'ON_USE') {
      return { mutations: [], resolutionMode: resolutionMode.mode, isDanoAcoplado: false, isRecuperacaoAcoplada: false };
    }

    // 3. Busca marcadores de cena ativos para o contexto
    const sceneMarkers = await this.prisma.sceneEffectInstance.findMany({
      where: {
        sceneId: context.sceneId,
        kind: 'MARCADOR',
      },
    });

    const activeMarkers = sceneMarkers.map((m) => {
      const payload = m.payload as { markerId: string };
      return {
        markerId: payload.markerId,
        sourceId: m.sourceCharacterId,
        targetId: m.targetCharacterId ?? '',
      };
    });

    // 4. Hidrata o ResolvedPower para o motor
    const resolvedEffects: ResolvedEffect[] = power.appliedEffects.map((ae) => {
      let behavior = parseBehavior(ae.effectBase.behavior);
      if (behavior && behavior.kind === 'FORTALECER') {
        const configId = ae.configuracaoId;
        let targetAlvo: 'PV_TEMP' | 'PE_TEMP' | 'DANO_BONUS' | 'RECUPERACAO_BONUS' | 'RD_BONUS' | 'ACOES' = 'PV_TEMP';
        if (configId === 'pe') targetAlvo = 'PE_TEMP';
        else if (configId === 'pv') targetAlvo = 'PV_TEMP';
        else if (configId === 'dano') targetAlvo = 'DANO_BONUS';
        else if (configId === 'recuperacao') targetAlvo = 'RECUPERACAO_BONUS';
        else if (configId === 'rd') targetAlvo = 'RD_BONUS';
        else if (configId === 'acoes') targetAlvo = 'ACOES';

        let configDanoObj: any = undefined;

        if (ae.inputValue) {
          try {
            const parsed = JSON.parse(ae.inputValue);
            if (parsed && (parsed.alvo || parsed.bonusDescritor)) {
              configDanoObj = {
                alvo: parsed.alvo,
                bonusDescritor: parsed.bonusDescritor || '',
              };
            }
          } catch {
            // ignore
          }
        }

        behavior = {
          ...behavior,
          alvo: targetAlvo,
          configDano: configDanoObj,
        } as any;
      }

      if (behavior && behavior.kind === 'RECUPERACAO') {
        const configId = ae.configuracaoId;
        if (configId === 'dano') {
          behavior = {
            ...behavior,
            recurso: 'PV',
          };
        } else if (configId === 'energia') {
          behavior = {
            ...behavior,
            recurso: 'PE',
          };
        } else {
          behavior = null;
        }
      }

      const modifications: ResolvedModification[] = ae.appliedModifications.map((am) => {
        const automation = parseModificationAutomation({
          targetingEffect: am.modificationBase.targetingEffect,
          casterEffect: am.modificationBase.casterEffect,
          markerCondition: am.modificationBase.markerCondition ?? undefined,
        });

        return {
          modificationBaseId: am.modificationBaseId,
          grau: am.grau,
          targetingEffect: automation?.targetingEffect ?? 'NENHUM',
          casterEffect: automation?.casterEffect ?? 'NENHUM',
          markerCondition: automation?.markerCondition,
        };
      });

      return {
        id: ae.id,
        effectBaseId: ae.effectBaseId,
        grau: ae.grau,
        dadoModularizado: ae.dadoModularizado ?? undefined,
        behavior,
        modifications,
      };
    });

    // Separa modificações globais (scope=GLOBAL) das locais para o ResolvedPower
    const globalModifications: ResolvedModification[] = resolvedEffects
      .flatMap((re) => re.modifications)
      .filter((_, i) => {
        // Modificações globais ficam nas appliedModifications com scope=GLOBAL
        const allMods = power.appliedEffects.flatMap((ae) => ae.appliedModifications);
        return allMods[i]?.scope === 'GLOBAL';
      });

    // Verifica se o poder pertence a algum Item diretamente
    const itemPower = await this.prisma.itemPower.findFirst({
      where: { powerId },
      include: { item: true },
    });

    let itemPowerArrayItem: any = null;
    if (!itemPower) {
      // Se não, verifica se pertence a algum PowerArray de algum Item
      const powerArrayPower = await this.prisma.powerArrayPower.findFirst({
        where: { powerId },
      });
      if (powerArrayPower) {
        const itemPowerArray = await this.prisma.itemPowerArray.findFirst({
          where: { powerArrayId: powerArrayPower.powerArrayId },
          include: { item: true },
        });
        if (itemPowerArray) {
          itemPowerArrayItem = itemPowerArray.item;
        }
      }
    }

    const item = itemPower?.item || itemPowerArrayItem;
    const isFromWeapon = item?.tipo === 'WEAPON';

    // Domínios espirituais: NATURAL, SAGRADO, SACRILEGIO, PSIQUICO
    const espiritualDomains = ['NATURAL', 'SAGRADO', 'SACRILEGIO', 'PSIQUICO'];
    const isEspiritualDomain = espiritualDomains.includes(power.domainName);
    const isEspiritualPeculiarity = power.domainName === 'PECULIAR' && !!(power.peculiarity as any)?.espiritual;
    const isEspiritual = isEspiritualDomain || isEspiritualPeculiarity;
    const isInstantaneous = power.parametrosDuracao === 0;

    const isDanoAcoplado = isFromWeapon && !(isEspiritual && isInstantaneous);
    const isRecuperacaoAcoplada = isFromWeapon || (isEspiritual && isInstantaneous);

    const resolvedPower: ResolvedPower = {
      id: power.id,
      parametros,
      effects: resolvedEffects,
      globalModifications,
      isDanoAcoplado,
      isRecuperacaoAcoplada,
    };

    // 5. Chama o motor com contexto enriquecido
    const enrichedContext: PowerUseContext = {
      ...context,
      activeMarkers,
      isEspiritual,
    };

    const mutations = resolvePowerUse({
      power: resolvedPower,
      context: enrichedContext,
      selectedTargetIds,
    });

    return { mutations, resolutionMode: 'ON_USE', isDanoAcoplado, isRecuperacaoAcoplada };
  }

  /**
   * Resolve os modificadores passivos ativos de um personagem.
   *
   * Busca os behaviors dos poderes passivos equipados e benefícios ativos,
   * e delega para `resolvePassiveModifiers()` do motor.
   */
  async resolvePassive(input: ResolvePassiveInput): Promise<PassiveModifier[]> {
    const { characterId, equippedPassivePowerIds, activeConditions, activeBenefitIds } = input;

    // Busca behaviors dos poderes passivos equipados
    const passivePowers = equippedPassivePowerIds.length
      ? await this.prisma.power.findMany({
          where: { id: { in: equippedPassivePowerIds } },
          include: {
            appliedEffects: {
              include: {
                effectBase: { select: { id: true, behavior: true } },
              },
              orderBy: { posicao: 'asc' },
            },
          },
        })
      : [];

    const equippedPassivePowersBehaviors = passivePowers.flatMap((p) =>
      p.appliedEffects
        .map((ae) => ({ powerId: p.id, effectId: ae.id, behavior: parseBehavior(ae.effectBase.behavior) }))
        .filter((x): x is typeof x & { behavior: NonNullable<typeof x.behavior> } => x.behavior !== null),
    );

    // Benefícios ativos — por ora sem mapeamento de behavior (Fase futura)
    // A string do benefício é mantida para exibição na ficha
    const passiveCtx: PassiveContext = {
      characterId,
      equippedPassivePowers: equippedPassivePowersBehaviors,
      activeConditions,
      activeBenefits: [],
    };

    return resolvePassiveModifiers(passiveCtx);
  }

  async applyMutations(
    sceneId: string,
    sourceCharacterId: string,
    mutations: GameMutation[],
  ): Promise<void> {
    for (const mutation of mutations) {
      switch (mutation.type) {
        case 'DEAL_DAMAGE': {
          const char = await this.prisma.character.findUnique({
            where: { id: mutation.targetId },
          });
          if (!char) continue;

          const healthState = JSON.parse(JSON.stringify(char.healthState));
          const conditions = JSON.parse(JSON.stringify(char.conditions)) as string[];
          const attributes = JSON.parse(JSON.stringify(char.attributes));
          const level = char.level;

          const mockChar = {
            healthState,
            conditions,
            attributes,
            level,
            deathState: char.deathState,
            deathCounter: char.deathCounter,
          };

          const damageAmount = rollFormula(mutation.formula);
          applyDamage(mockChar, damageAmount);

          await this.prisma.character.update({
            where: { id: mutation.targetId },
            data: {
              healthState: mockChar.healthState,
              deathState: mockChar.deathState,
              deathCounter: mockChar.deathCounter,
            },
          });

          this.eventEmitter.emit('combat.event', {
            sceneId,
            eventName: 'DANO_CORPO_A_CORPO_CAUSADO',
            sourceId: sourceCharacterId,
            targetId: mutation.targetId,
            value: damageAmount,
          });
          break;
        }

        case 'HEAL': {
          const char = await this.prisma.character.findUnique({
            where: { id: mutation.targetId },
          });
          if (!char) continue;

          const healthState = JSON.parse(JSON.stringify(char.healthState));
          const attributes = JSON.parse(JSON.stringify(char.attributes));
          const level = char.level;

          const mockChar = {
            healthState,
            attributes,
            level,
            deathState: char.deathState,
            deathCounter: char.deathCounter,
          };

          const healAmount = rollFormula(mutation.formula);
          applyHeal(mockChar, healAmount);

          await this.prisma.character.update({
            where: { id: mutation.targetId },
            data: {
              healthState: mockChar.healthState,
              deathState: mockChar.deathState,
              deathCounter: mockChar.deathCounter,
            },
          });
          break;
        }

        case 'RESTORE_PE': {
          const char = await this.prisma.character.findUnique({
            where: { id: mutation.targetId },
          });
          if (!char) continue;

          const energyState = JSON.parse(JSON.stringify(char.energyState));
          const attributes = JSON.parse(JSON.stringify(char.attributes));
          const conditions = JSON.parse(JSON.stringify(char.conditions)) as string[];

          const mockChar = {
            energyState,
            attributes,
            conditions,
          };

          const peAmount = rollFormula(mutation.formula);
          applyRecoverEnergy(mockChar, peAmount);

          await this.prisma.character.update({
            where: { id: mutation.targetId },
            data: {
              energyState: mockChar.energyState,
            },
          });
          break;
        }

        case 'ADD_TEMP_PV': {
          const char = await this.prisma.character.findUnique({
            where: { id: mutation.targetId },
          });
          if (!char) continue;

          const healthState = JSON.parse(JSON.stringify(char.healthState));
          const mockChar = { healthState };

          const pvTempAmount = rollFormula(mutation.formula);
          applyAddTemporaryPV(mockChar, pvTempAmount);

          await this.prisma.character.update({
            where: { id: mutation.targetId },
            data: { healthState: mockChar.healthState },
          });
          break;
        }

        case 'ADD_TEMP_PE': {
          const char = await this.prisma.character.findUnique({
            where: { id: mutation.targetId },
          });
          if (!char) continue;

          const energyState = JSON.parse(JSON.stringify(char.energyState));
          const mockChar = { energyState };

          const peTempAmount = rollFormula(mutation.formula);
          applyAddTemporaryPE(mockChar, peTempAmount);

          await this.prisma.character.update({
            where: { id: mutation.targetId },
            data: { energyState: mockChar.energyState },
          });
          break;
        }

        case 'APPLY_CONDITION': {
          const char = await this.prisma.character.findUnique({
            where: { id: mutation.targetId },
          });
          if (!char) continue;

          const conditions = JSON.parse(JSON.stringify(char.conditions)) as string[];
          const mockChar = { conditions };

          applyCondition(mockChar, mutation.condicaoId);

          await this.prisma.character.update({
            where: { id: mutation.targetId },
            data: { conditions: mockChar.conditions },
          });
          break;
        }

        case 'APPLY_MARKER': {
          await this.prisma.sceneEffectInstance.create({
            data: {
              sceneId,
              kind: 'MARCADOR',
              sourceCharacterId,
              targetCharacterId: mutation.targetId,
              sourcePowerId: mutation.sourcePowerId,
              payload: {
                markerId: mutation.markerId,
                label: mutation.label,
                duracao: mutation.duracao,
              },
            },
          });
          break;
        }

        case 'REMOVE_MARKER': {
          const instances = await this.prisma.sceneEffectInstance.findMany({
            where: {
              sceneId,
              kind: 'MARCADOR',
              targetCharacterId: mutation.targetId,
            },
          });
          const toDelete = instances.filter((inst) => {
            const p = inst.payload as { markerId?: string };
            return p?.markerId === mutation.markerId;
          });
          if (toDelete.length > 0) {
            await this.prisma.sceneEffectInstance.deleteMany({
              where: {
                id: { in: toDelete.map((d) => d.id) },
              },
            });
          }
          break;
        }

        case 'REGISTER_TRIGGER': {
          await this.prisma.sceneEffectInstance.create({
            data: {
              sceneId,
              kind: 'GATILHO',
              sourceCharacterId,
              targetCharacterId: mutation.targetId,
              sourcePowerId: mutation.sourcePowerId,
              payload: {
                evento: mutation.trigger.evento,
                condicao: mutation.trigger.condicao,
                efeitosFilhos: mutation.trigger.efeitosFilhos,
              },
            },
          });
          break;
        }
      }
    }
  }
}
