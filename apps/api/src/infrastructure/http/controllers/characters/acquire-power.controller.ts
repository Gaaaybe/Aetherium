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
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { CharactersService } from '@/modules/character-manager/characters.service';
import {
  DomainValidationError,
  NotAllowedError,
  ResourceNotFoundError,
} from '@/modules/character-manager/errors/character-errors';
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe';
import { CharacterPresenter } from '../../presenters/character.presenter';

const acquirePowerBodySchema = z.object({
  powerId: z.string().uuid(),
});

type AcquirePowerBodySchema = z.infer<typeof acquirePowerBodySchema>;

@Controller('/characters/:characterId/powers')
export class AcquirePowerController {
  constructor(private charactersService: CharactersService) {}

  @Post()
  @HttpCode(201)
  async handle(
    @Param('characterId') characterId: string,
    @Body(new ZodValidationPipe(acquirePowerBodySchema)) body: AcquirePowerBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    try {
      const { character } = await this.charactersService.acquirePower(
        characterId,
        user.sub,
        body.powerId,
      );

      return CharacterPresenter.toHTTP(character);
    } catch (error: any) {
      if (
        error instanceof ResourceNotFoundError ||
        error.constructor.name === 'ResourceNotFoundError'
      ) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof NotAllowedError || error.constructor.name === 'NotAllowedError') {
        throw new ForbiddenException(error.message);
      }

      if (
        error instanceof DomainValidationError ||
        error.constructor.name === 'DomainValidationError'
      ) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
