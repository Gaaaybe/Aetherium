import { BadRequestException, Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { CharactersService } from '@/modules/character-manager/characters.service';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe';
import { CharacterPresenter } from '../../presenters/character.presenter';
import { PeculiaritiesRepository } from '@/domain/power-manager/application/repositories/peculiarities-repository';
import { ItemsRepository } from '@/domain/item-manager/application/repositories/items-repository';

const updateUnarmedMasteryBodySchema = z.object({
  customName: z.string().optional(),
  degree: z.number().int().min(0).max(9),
  marginImprovements: z.number().int().min(0).max(10),
  multiplierImprovements: z.number().int().min(0).max(3),
  damageType: z.string().min(1),
});

type UpdateUnarmedMasteryBodySchema = z.infer<typeof updateUnarmedMasteryBodySchema>;

@Controller('/characters/:characterId/unarmed-mastery')
export class UpdateUnarmedMasteryController {
  constructor(
    private charactersService: CharactersService,
    private peculiaritiesRepository: PeculiaritiesRepository,
    private itemsRepository: ItemsRepository,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Param('characterId') characterId: string,
    @Body(new ZodValidationPipe(updateUnarmedMasteryBodySchema)) body: UpdateUnarmedMasteryBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    try {
      const character = await this.charactersService.updateUnarmedMastery(
        characterId,
        user.sub,
        body,
      );

      const peculiarities = await this.peculiaritiesRepository.findByUserId(character.userId.toString(), { page: 1 });
      const items = await this.itemsRepository.findByCharacterId(character.id.toString());

      return CharacterPresenter.toHTTP(character, peculiarities, items);
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }
}
