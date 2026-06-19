import { BadRequestException, Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { CharactersService } from '@/modules/character-manager/characters.service';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe';
import { CharacterPresenter } from '../../presenters/character.presenter';
import { PeculiaritiesRepository } from '@/domain/power-manager/application/repositories/peculiarities-repository';

const acquireDomainMasteryBodySchema = z.object({
  domainId: z.string().min(1),
  masteryLevel: z.enum(['INICIANTE', 'PRATICANTE', 'MESTRE']),
});

type AcquireDomainMasteryBodySchema = z.infer<typeof acquireDomainMasteryBodySchema>;

@Controller('/characters/:characterId/domains')
export class AcquireDomainMasteryController {
  constructor(
    private charactersService: CharactersService,
    private peculiaritiesRepository: PeculiaritiesRepository,
  ) {}

  @Post()
  @HttpCode(201)
  async handle(
    @Param('characterId') characterId: string,
    @Body(new ZodValidationPipe(acquireDomainMasteryBodySchema)) body: AcquireDomainMasteryBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    try {
      const character = await this.charactersService.acquireDomainMastery(
        characterId,
        user.sub,
        body.domainId,
        body.masteryLevel as any,
      );

      const peculiarities = await this.peculiaritiesRepository.findByUserId(character.userId.toString(), { page: 1 });

      return CharacterPresenter.toHTTP(character, peculiarities);
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }
}
