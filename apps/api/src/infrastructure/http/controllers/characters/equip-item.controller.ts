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
import { ItemsService } from '@/modules/item-manager/items.service';
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe';
import { CharacterPresenter } from '../../presenters/character.presenter';

const equipItemBodySchema = z.object({
  slot: z.enum(['suit', 'accessory', 'hand', 'quick-access']),
  quantity: z.number().int().min(1).default(1),
});

type EquipItemBodySchema = z.infer<typeof equipItemBodySchema>;

@Controller('/characters/:characterId/items/:itemId/equip')
export class EquipItemController {
  constructor(
    private charactersService: CharactersService,
    private itemsService: ItemsService,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Param('characterId') characterId: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(equipItemBodySchema)) body: EquipItemBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    try {
      const character = await this.charactersService.equipItem(
        characterId,
        user.sub,
        itemId,
        body.slot,
        body.quantity,
      );

      const items = await this.itemsService.fetchCharacter(characterId);

      return CharacterPresenter.toHTTP(character, [], items);
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
