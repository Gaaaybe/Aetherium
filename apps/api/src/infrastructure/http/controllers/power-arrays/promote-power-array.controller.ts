import { Controller, Patch, Param, ForbiddenException } from '@nestjs/common';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { PowersService } from '@/modules/power-manager/powers.service';
import { formatPowerArrayToHTTP } from '@/modules/power-manager/dto/power.dto';

@Controller('/admin/power-arrays/:powerArrayId/promote')
export class PromotePowerArrayController {
  constructor(private powersService: PowersService) {}

  @Patch()
  async handle(
    @Param('powerArrayId') powerArrayId: string,
    @CurrentUser() user: UserPayload,
  ) {
    if (!user.isAdmin) {
      throw new ForbiddenException('Acesso não autorizado para esta operação');
    }
    const raw = await this.powersService.promotePowerArray(powerArrayId);
    return formatPowerArrayToHTTP(raw);
  }
}
