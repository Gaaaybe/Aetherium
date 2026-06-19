import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
import { CharactersService } from '@/modules/character-manager/characters.service';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe';
import { CharacterPresenter } from '../../presenters/character.presenter';
import { ResourceNotFoundError, NotAllowedError, DomainValidationError } from '@/modules/character-manager/errors/character-errors';

const unlockSpiritualPrincipleBodySchema = z.object({
  stage: z.enum(['NORMAL', 'DIVINE']).optional().default('NORMAL'),
});

type UnlockSpiritualPrincipleBodySchema = z.infer<typeof unlockSpiritualPrincipleBodySchema>;

@Controller('/characters/:characterId/spiritual-awakening')
export class UnlockSpiritualPrincipleController {
  constructor(private charactersService: CharactersService) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Param('characterId') characterId: string,
    @Body(new ZodValidationPipe(unlockSpiritualPrincipleBodySchema)) body: UnlockSpiritualPrincipleBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    try {
      const character = await this.charactersService.unlockSpiritualPrinciple(
        characterId,
        user.sub,
        body.stage,
      );

      return CharacterPresenter.toHTTP(character);
    } catch (error) {
      if (error instanceof ResourceNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof NotAllowedError) {
        throw new ForbiddenException(error.message);
      }

      if (error instanceof DomainValidationError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
