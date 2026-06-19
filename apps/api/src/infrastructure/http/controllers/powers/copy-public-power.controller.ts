import { Controller, HttpCode, Param, Post } from '@nestjs/common';
import { PowersService } from '@/modules/power-manager/powers.service';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { formatPowerToHTTP } from '@/modules/power-manager/dto/power.dto';

@Controller('/powers/:powerId/copy')
export class CopyPublicPowerController {
  constructor(private powersService: PowersService) {}

  @Post()
  @HttpCode(201)
  async handle(@Param('powerId') powerId: string, @CurrentUser() user: UserPayload) {
    const raw = await this.powersService.copyPublicPower(powerId, user.sub);
    return formatPowerToHTTP(raw);
  }
}
