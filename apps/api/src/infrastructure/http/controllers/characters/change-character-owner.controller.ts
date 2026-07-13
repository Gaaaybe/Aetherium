import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
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

const changeOwnerBodySchema = z.object({
  newOwnerId: z.string().uuid(),
});

type ChangeOwnerBodySchema = z.infer<typeof changeOwnerBodySchema>;

@Controller('/admin/characters/:characterId/owner')
export class ChangeCharacterOwnerController {
  constructor(private charactersService: CharactersService) {}

  @Patch()
  @HttpCode(200)
  async handle(
    @Param('characterId') characterId: string,
    @Body(new ZodValidationPipe(changeOwnerBodySchema)) body: ChangeOwnerBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    try {
      if (!user.isAdmin) {
        throw new ForbiddenException('Acesso não autorizado para esta operação');
      }

      const character = await this.charactersService.changeOwner(
        characterId,
        body.newOwnerId,
        user.sub,
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
