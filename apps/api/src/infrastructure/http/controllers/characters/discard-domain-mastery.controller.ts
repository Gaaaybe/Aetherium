import { BadRequestException, Controller, Delete, HttpCode, Param } from '@nestjs/common';
import { CharactersService } from '@/modules/character-manager/characters.service';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { CharacterPresenter } from '../../presenters/character.presenter';
import { PeculiaritiesRepository } from '@/domain/power-manager/application/repositories/peculiarities-repository';

@Controller('/characters/:characterId/domains/:domainId')
export class DiscardDomainMasteryController {
  constructor(
    private charactersService: CharactersService,
    private peculiaritiesRepository: PeculiaritiesRepository,
  ) {}

  @Delete()
  @HttpCode(200)
  async handle(
    @Param('characterId') characterId: string,
    @Param('domainId') domainId: string,
    @CurrentUser() user: UserPayload,
  ) {
    try {
      const character = await this.charactersService.discardDomainMastery(
        characterId,
        user.sub,
        domainId,
      );

      const peculiarities = await this.peculiaritiesRepository.findByUserId(character.userId.toString(), { page: 1 });

      return CharacterPresenter.toHTTP(character, peculiarities);
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }
}
