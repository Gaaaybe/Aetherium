import { Controller, Delete, HttpCode, Param } from '@nestjs/common';
import { PowersService } from '@/modules/power-manager/powers.service';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';

@Controller('/peculiarities/:peculiarityId')
export class DeletePeculiarityController {
  constructor(private powersService: PowersService) {}

  @Delete()
  @HttpCode(204)
  async handle(
    @Param('peculiarityId') peculiarityId: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.powersService.deletePeculiarity(peculiarityId, user.sub);
  }
}
