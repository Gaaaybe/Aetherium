import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { PowerResolutionService } from '../power-resolution.service';
import { parseBehavior } from '@aetherium/rules-engine';
import { executeBehavior } from '@aetherium/rules-engine';

export interface CombatEventPayload {
  sceneId: string;
  eventName: string;
  sourceId: string;
  targetId: string;
  value: number;
}

@Injectable()
export class CombatEventListener {
  constructor(
    private readonly prisma: PrismaService,
    private readonly powerResolutionService: PowerResolutionService,
  ) {}

  @OnEvent('combat.event')
  async handleCombatEvent(event: CombatEventPayload) {
    const { sceneId, eventName, sourceId, targetId } = event;

    // 1. Busca todos os gatilhos da cena
    const triggers = await this.prisma.sceneEffectInstance.findMany({
      where: {
        sceneId,
        kind: 'GATILHO',
        sourceCharacterId: sourceId, // O dono do gatilho é quem age
      },
    });

    for (const triggerInst of triggers) {
      const payload = triggerInst.payload as {
        evento: string;
        condicao: string;
        efeitosFilhos: string[];
      };

      if (!payload || payload.evento !== eventName) {
        continue;
      }

      // 2. Avalia a condição do gatilho
      const conditionPassed = await this.evaluateCondition(payload.condicao, {
        sceneId,
        sourceId,
        targetId,
      });

      if (!conditionPassed) {
        continue;
      }

      // 3. Executa os efeitos filhos
      for (const effectBaseId of payload.efeitosFilhos) {
        const effectBase = await this.prisma.effectBase.findUnique({
          where: { id: effectBaseId },
        });

        if (!effectBase || !effectBase.behavior) {
          continue;
        }

        const behavior = parseBehavior(effectBase.behavior);
        if (!behavior) {
          continue;
        }

        // Constrói um contexto de uso simulado para rodar o behavior
        const mockContext = {
          casterId: sourceId,
          sceneId,
          candidateTargetIds: [sourceId], // Para efeitos de cura/recuperação do conjurador
          casterState: {
            id: sourceId,
            keyPhysicalModifier: 0,
            keyMentalModifier: 0,
            level: 1,
          },
          activeMarkers: [],
        };

        // Roda o behavior contra o conjurador (ele mesmo recupera PV/PE na Agonia)
        const mutations = executeBehavior(
          behavior,
          [sourceId],
          1, // Grau 1 como padrão para efeitos filhos se não especificado
          mockContext,
          triggerInst.sourcePowerId,
        );

        // Aplica as mutações imediatamente
        await this.powerResolutionService.applyMutations(sceneId, sourceId, mutations);
      }
    }
  }

  private async evaluateCondition(
    condicao: string,
    context: { sceneId: string; sourceId: string; targetId: string },
  ): Promise<boolean> {
    // Ex: "alvo.tem_marcador:laco-de-odio"
    if (condicao.startsWith('alvo.tem_marcador:')) {
      const markerId = condicao.substring('alvo.tem_marcador:'.length);

      const markers = await this.prisma.sceneEffectInstance.findMany({
        where: {
          sceneId: context.sceneId,
          kind: 'MARCADOR',
          targetCharacterId: context.targetId,
        },
      });

      return markers.some((m) => {
        const p = m.payload as { markerId?: string };
        return p?.markerId === markerId;
      });
    }

    return false;
  }
}
