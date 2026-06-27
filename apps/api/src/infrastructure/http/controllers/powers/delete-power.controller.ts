import { Controller, Delete, HttpCode, Param } from '@nestjs/common';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { PowersService } from '@/modules/power-manager/powers.service';

@Controller('/powers/:powerId')
export class DeletePowerController {
  constructor(private powersService: PowersService) {}

  @Delete()
  @HttpCode(204)
  async handle(@Param('powerId') powerId: string, @CurrentUser() user: UserPayload) {
    await this.powersService.deletePower(powerId, user.sub);
  }
}
