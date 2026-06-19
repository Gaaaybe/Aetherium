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
import { CharactersService } from '@/modules/character-manager/characters.service';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe';
import { CharacterPresenter } from '../../presenters/character.presenter';
import { ResourceNotFoundError, NotAllowedError, DomainValidationError } from '@/modules/character-manager/errors/character-errors';

const changeQuantityBodySchema = z.object({
  quantity: z.number().int().min(0),
});

type ChangeQuantityBodySchema = z.infer<typeof changeQuantityBodySchema>;

@Controller('/characters/:characterId/items/:itemId/quantity')
export class ChangeInventoryItemQuantityController {
  constructor(private charactersService: CharactersService) {}

  @Patch()
  @HttpCode(200)
  async handle(
    @Param('characterId') characterId: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(changeQuantityBodySchema)) body: ChangeQuantityBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    try {
      const character = await this.charactersService.changeInventoryItemQuantity(
        characterId,
        user.sub,
        itemId,
        body.quantity,
      );

      return CharacterPresenter.toHTTP(character);
    } catch (error: any) {
      if (error instanceof ResourceNotFoundError || error.constructor.name === 'ResourceNotFoundError') {
        throw new NotFoundException(error.message);
      }

      if (error instanceof NotAllowedError || error.constructor.name === 'NotAllowedError') {
        throw new ForbiddenException(error.message);
      }

      if (error instanceof DomainValidationError || error.constructor.name === 'DomainValidationError') {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
