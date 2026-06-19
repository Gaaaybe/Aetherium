import {
  Controller,
  Delete,
  HttpCode,
  Param,
} from '@nestjs/common';
import { CharactersService } from '@/modules/character-manager/characters.service';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';

@Controller('/characters/:characterId')
export class DeleteCharacterController {
  constructor(private charactersService: CharactersService) {}

  @Delete()
  @HttpCode(204)
  async handle(@Param('characterId') characterId: string, @CurrentUser() user: UserPayload) {
    await this.charactersService.delete(characterId, user.sub);
  }
}
