import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import { CharactersService } from '@/modules/character-manager/characters.service';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { CharacterPresenter } from '../../presenters/character.presenter';
import { NotAllowedError } from '@/modules/character-manager/errors/character-errors';

@Controller('/admin/characters')
export class FetchAllCharactersController {
  constructor(private charactersService: CharactersService) {}

  @Get()
  async handle(@CurrentUser() user: UserPayload) {
    try {
      const characters = await this.charactersService.fetchAllCharacters(user.sub);
      return characters.map((character) => CharacterPresenter.toHTTP(character));
    } catch (err) {
      if (err instanceof NotAllowedError) {
        throw new UnauthorizedException('User is not authorized to fetch all characters.');
      }
      throw err;
    }
  }
}
