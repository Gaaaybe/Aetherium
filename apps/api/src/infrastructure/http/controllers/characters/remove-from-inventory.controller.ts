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

const removeFromInventoryBodySchema = z.object({
  quantity: z.number().int().min(1).default(1),
});

type RemoveFromInventoryBodySchema = z.infer<typeof removeFromInventoryBodySchema>;

@Controller('/characters/:characterId/items/:itemId/remove')
export class RemoveFromInventoryController {
  constructor(private charactersService: CharactersService) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Param('characterId') characterId: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(removeFromInventoryBodySchema)) body: RemoveFromInventoryBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    try {
      const character = await this.charactersService.removeFromInventory(
        characterId,
        user.sub,
        itemId,
        body.quantity,
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
