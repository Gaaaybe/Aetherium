import { Controller, Get, Query } from '@nestjs/common';
import { PowersService } from '@/modules/power-manager/powers.service';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { formatPowerArrayToHTTP } from '@/modules/power-manager/dto/power.dto';

@Controller('/power-arrays/me')
export class FetchUserPowerArraysController {
  constructor(private powersService: PowersService) {}

  @Get()
  async handle(@Query('page') page: string, @CurrentUser() user: UserPayload) {
    const raws = await this.powersService.fetchUserPowerArrays(user.sub, page ? Number(page) : 1);
    return raws.map(formatPowerArrayToHTTP);
  }
}
