import { Controller, Patch, Param, ForbiddenException } from '@nestjs/common';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { PowersService } from '@/modules/power-manager/powers.service';
import { formatPeculiarityToHTTP } from '@/modules/power-manager/dto/power.dto';

@Controller('/admin/peculiarities/:peculiarityId/promote')
export class PromotePeculiarityController {
  constructor(private powersService: PowersService) {}

  @Patch()
  async handle(
    @Param('peculiarityId') peculiarityId: string,
    @CurrentUser() user: UserPayload,
  ) {
    if (!user.isAdmin) {
      throw new ForbiddenException('Acesso não autorizado para esta operação');
    }
    const raw = await this.powersService.promotePeculiarity(peculiarityId);
    return formatPeculiarityToHTTP(raw);
  }
}
