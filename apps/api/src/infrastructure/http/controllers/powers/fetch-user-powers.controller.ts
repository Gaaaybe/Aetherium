import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { formatPowerToHTTP } from '@/modules/power-manager/dto/power.dto';
import { PowersService } from '@/modules/power-manager/powers.service';

@Controller('/powers/me')
export class FetchUserPowersController {
  constructor(private powersService: PowersService) {}

  @Get()
  async handle(@Query('page') page: string, @CurrentUser() user: UserPayload) {
    const raws = await this.powersService.fetchUserPowers(user.sub, page ? Number(page) : 1);
    return raws.map(formatPowerToHTTP);
  }
}
