import { Controller, HttpCode, Param, Post } from '@nestjs/common';
import { PowersService } from '@/modules/power-manager/powers.service';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { formatPeculiarityToHTTP } from '@/modules/power-manager/dto/power.dto';

@Controller('/peculiarities/:peculiarityId/copy')
export class CopyPublicPeculiarityController {
  constructor(private powersService: PowersService) {}

  @Post()
  @HttpCode(201)
  async handle(
    @Param('peculiarityId') peculiarityId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const raw = await this.powersService.copyPublicPeculiarity(peculiarityId, user.sub);
    return formatPeculiarityToHTTP(raw);
  }
}
