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
import { ItemsRepository } from '@/domain/item-manager/application/repositories/items-repository';
import { ResourceNotFoundError, NotAllowedError, DomainValidationError } from '@/modules/character-manager/errors/character-errors';

const unequipItemBodySchema = z.object({
  slot: z.enum(['suit', 'accessory', 'hand', 'quick-access']),
  quantity: z.number().int().min(1).default(1),
});

type UnequipItemBodySchema = z.infer<typeof unequipItemBodySchema>;

@Controller('/characters/:characterId/items/:itemId/unequip')
export class UnequipItemController {
  constructor(
    private charactersService: CharactersService,
    private itemsRepository: ItemsRepository,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Param('characterId') characterId: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(unequipItemBodySchema)) body: UnequipItemBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    try {
      const character = await this.charactersService.unequipItem(
        characterId,
        user.sub,
        itemId,
        body.slot,
        body.quantity,
      );

      const items = await this.itemsRepository.findByCharacterId(characterId);

      return CharacterPresenter.toHTTP(character, [], items);
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
