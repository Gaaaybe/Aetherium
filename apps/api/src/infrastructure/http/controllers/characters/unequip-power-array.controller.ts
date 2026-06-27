import {
  BadRequestException,
  Controller,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { CharactersService } from '@/modules/character-manager/characters.service';
import {
  DomainValidationError,
  NotAllowedError,
  ResourceNotFoundError,
} from '@/modules/character-manager/errors/character-errors';
import { CharacterPresenter } from '../../presenters/character.presenter';

@Controller('/characters/:characterId/power-arrays/:powerArrayId/unequip')
export class UnequipPowerArrayController {
  constructor(private charactersService: CharactersService) {}

  @Patch()
  @HttpCode(200)
  async handle(
    @Param('characterId') characterId: string,
    @Param('powerArrayId') powerArrayId: string,
    @CurrentUser() user: UserPayload,
  ) {
    try {
      const character = await this.charactersService.unequipPowerArray(
        characterId,
        user.sub,
        powerArrayId,
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
        if (error.message.includes('não encontrado')) {
          throw new NotFoundException(error.message);
        }
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
