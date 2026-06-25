import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { CharactersService } from '@/modules/character-manager/characters.service';
import { CharacterPresenter } from '../../presenters/character.presenter';

@Controller('/characters/me')
export class FetchUserCharactersController {
  constructor(private charactersService: CharactersService) {}

  @Get()
  async handle(@CurrentUser() user: UserPayload) {
    const characters = await this.charactersService.fetchUserCharacters(user.sub);
    return characters.map((character) => CharacterPresenter.toHTTP(character));
  }
}
