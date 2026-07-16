import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe';
import { z } from 'zod';
import { PowerResolutionService } from '@/modules/power-manager/power-resolution.service';

const resolvePowerBodySchema = z.object({
  sceneId: z.string().min(1, 'ID da cena é obrigatório'),
  candidateTargetIds: z.array(z.string()).default([]),
  selectedTargetIds: z.array(z.string()).optional(),
  casterState: z.object({
    id: z.string().min(1, 'ID do conjurador é obrigatório'),
    keyPhysicalModifier: z.number().int(),
    keyMentalModifier: z.number().int(),
    level: z.number().int().positive(),
  }),
  attackSucceeded: z.boolean().optional(),
});

export type ResolvePowerBodySchema = z.infer<typeof resolvePowerBodySchema>;

@Controller('/powers/:id/resolve')
export class ResolvePowerController {
  constructor(private readonly powerResolutionService: PowerResolutionService) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Param('id') powerId: string,
    @Body(new ZodValidationPipe(resolvePowerBodySchema)) body: ResolvePowerBodySchema,
    @CurrentUser() _user: UserPayload, // Garante que o usuário está autenticado
  ) {
    const { sceneId, candidateTargetIds, selectedTargetIds, casterState, attackSucceeded } = body;

    const result = await this.powerResolutionService.resolvePower({
      powerId,
      context: {
        casterId: casterState.id,
        sceneId,
        candidateTargetIds,
        casterState,
        activeMarkers: [], // Preenchido internamente pelo service a partir do banco
        attackSucceeded,
      },
      selectedTargetIds,
    });

    return {
      mutations: result.mutations,
      resolutionMode: result.resolutionMode,
      isDanoAcoplado: result.isDanoAcoplado,
      isRecuperacaoAcoplada: result.isRecuperacaoAcoplada,
    };
  }
}
