import { Controller, Delete, HttpCode, Param } from '@nestjs/common';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { PowersService } from '@/modules/power-manager/powers.service';

@Controller('/power-arrays/:powerArrayId')
export class DeletePowerArrayController {
  constructor(private powersService: PowersService) {}

  @Delete()
  @HttpCode(204)
  async handle(@Param('powerArrayId') powerArrayId: string, @CurrentUser() user: UserPayload) {
    await this.powersService.deletePowerArray(powerArrayId, user.sub, user.isAdmin);
  }
}
