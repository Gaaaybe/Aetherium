import { Controller, Get, Param } from '@nestjs/common';
import { CharactersService } from '@/modules/character-manager/characters.service';
import { CharacterPresenter } from '../../presenters/character.presenter';
import { PeculiaritiesRepository } from '@/domain/power-manager/application/repositories/peculiarities-repository';
import { ItemsRepository } from '@/domain/item-manager/application/repositories/items-repository';

@Controller('/characters/:characterId')
export class GetCharacterByIdController {
  constructor(
    private charactersService: CharactersService,
    private peculiaritiesRepository: PeculiaritiesRepository,
    private itemsRepository: ItemsRepository,
  ) {}

  @Get()
  async handle(@Param('characterId') characterId: string) {
    const character = await this.charactersService.getById(characterId);
    const [peculiarities, items] = await Promise.all([
      this.peculiaritiesRepository.findByUserId(character.userId.toString(), { page: 1 }),
      this.itemsRepository.findByCharacterId(characterId),
    ]);

    return CharacterPresenter.toHTTP(character, peculiarities, items);
  }
}
