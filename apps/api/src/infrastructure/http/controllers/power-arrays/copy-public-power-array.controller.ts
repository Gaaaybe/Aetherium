import { Controller, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { formatPowerArrayToHTTP } from '@/modules/power-manager/dto/power.dto';
import { PowersService } from '@/modules/power-manager/powers.service';

@Controller('/power-arrays/:powerArrayId/copy')
export class CopyPublicPowerArrayController {
  constructor(private powersService: PowersService) {}

  @Post()
  @HttpCode(201)
  async handle(@Param('powerArrayId') powerArrayId: string, @CurrentUser() user: UserPayload) {
    const raw = await this.powersService.copyPublicPowerArray(powerArrayId, user.sub);
    return formatPowerArrayToHTTP(raw);
  }
}
