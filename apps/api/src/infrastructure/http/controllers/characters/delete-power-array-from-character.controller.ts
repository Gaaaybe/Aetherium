import {
  BadRequestException,
  Controller,
  ForbiddenException,
  HttpCode,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { CharactersService } from '@/modules/character-manager/characters.service';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { CharacterPresenter } from '../../presenters/character.presenter';
import { ResourceNotFoundError, NotAllowedError, DomainValidationError } from '@/modules/character-manager/errors/character-errors';

@Controller('/characters/:characterId/power-arrays/:powerArrayId/remove')
export class DeletePowerArrayFromCharacterController {
  constructor(private charactersService: CharactersService) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Param('characterId') characterId: string,
    @Param('powerArrayId') powerArrayId: string,
    @CurrentUser() user: UserPayload,
  ) {
    try {
      const character = await this.charactersService.deletePowerArrayFromCharacter(
        characterId,
        user.sub,
        powerArrayId,
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
