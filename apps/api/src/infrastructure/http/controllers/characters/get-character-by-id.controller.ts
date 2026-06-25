import { Controller, Get, Param } from '@nestjs/common';
import { CharactersService } from '@/modules/character-manager/characters.service';
import { ItemsService } from '@/modules/item-manager/items.service';
import { PowersService } from '@/modules/power-manager/powers.service';
import { CharacterPresenter } from '../../presenters/character.presenter';

@Controller('/characters/:characterId')
export class GetCharacterByIdController {
  constructor(
    private charactersService: CharactersService,
    private powersService: PowersService,
    private itemsService: ItemsService,
  ) {}

  @Get()
  async handle(@Param('characterId') characterId: string) {
    const character = await this.charactersService.getById(characterId);
    const [peculiarities, items] = await Promise.all([
      this.powersService.fetchUserPeculiarities(character.userId.toString(), 1),
      this.itemsService.fetchCharacter(characterId),
    ]);

    return CharacterPresenter.toHTTP(character, peculiarities, items);
  }
}
