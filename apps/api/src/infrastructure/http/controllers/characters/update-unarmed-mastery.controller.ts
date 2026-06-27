import { BadRequestException, Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { CharactersService } from '@/modules/character-manager/characters.service';
import { ItemsService } from '@/modules/item-manager/items.service';
import { PowersService } from '@/modules/power-manager/powers.service';
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe';
import { CharacterPresenter } from '../../presenters/character.presenter';

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
    private powersService: PowersService,
    private itemsService: ItemsService,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Param('characterId') characterId: string,
    @Body(new ZodValidationPipe(updateUnarmedMasteryBodySchema))
    body: UpdateUnarmedMasteryBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    try {
      const character = await this.charactersService.updateUnarmedMastery(
        characterId,
        user.sub,
        body,
      );

      const peculiarities = await this.powersService.fetchUserPeculiarities(
        character.userId.toString(),
        1,
      );
      const items = await this.itemsService.fetchCharacter(character.id.toString());

      return CharacterPresenter.toHTTP(character, peculiarities, items);
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }
}
