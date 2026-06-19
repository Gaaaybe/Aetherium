import { Body, Controller, Param, Put } from '@nestjs/common';
import { PowersService } from '@/modules/power-manager/powers.service';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe';
import {
  updatePowerBodySchema,
  formatPowerToHTTP,
} from '@/modules/power-manager/dto/power.dto';
import type { UpdatePowerBodySchema } from '@/modules/power-manager/dto/power.dto';

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
