import { Body, Controller, Param, Put } from '@nestjs/common';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import type { UpdatePowerBodySchema } from '@/modules/power-manager/dto/power.dto';
import { formatPowerToHTTP, updatePowerBodySchema } from '@/modules/power-manager/dto/power.dto';
import { PowersService } from '@/modules/power-manager/powers.service';
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe';

@Controller('/powers/:powerId')
export class UpdatePowerController {
  constructor(private powersService: PowersService) {}

  @Put()
  async handle(
    @Param('powerId') powerId: string,
    @Body(new ZodValidationPipe(updatePowerBodySchema)) body: UpdatePowerBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const raw = await this.powersService.updatePower(powerId, user.sub, body);
    return formatPowerToHTTP(raw);
  }
}
