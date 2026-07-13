import { Controller, Get, ForbiddenException } from '@nestjs/common';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { PowersService } from '@/modules/power-manager/powers.service';
import { formatPowerToHTTP } from '@/modules/power-manager/dto/power.dto';

@Controller('/admin/powers')
export class FetchAllPowersController {
  constructor(private powersService: PowersService) {}

  @Get()
  async handle(@CurrentUser() user: UserPayload) {
    if (!user.isAdmin) {
      throw new ForbiddenException('Acesso não autorizado para esta operação');
    }
    const raws = await this.powersService.fetchAllPowers();
    return raws.map((raw) => formatPowerToHTTP(raw));
  }
}
