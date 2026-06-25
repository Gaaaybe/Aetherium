import { Body, Controller, Param, Put } from '@nestjs/common';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import type { UpdatePowerArrayBodySchema } from '@/modules/power-manager/dto/power.dto';
import {
  formatPowerArrayToHTTP,
  updatePowerArrayBodySchema,
} from '@/modules/power-manager/dto/power.dto';
import { PowersService } from '@/modules/power-manager/powers.service';
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe';

@Controller('/power-arrays/:powerArrayId')
export class UpdatePowerArrayController {
  constructor(private powersService: PowersService) {}

  @Put()
  async handle(
    @Param('powerArrayId') powerArrayId: string,
    @Body(new ZodValidationPipe(updatePowerArrayBodySchema)) body: UpdatePowerArrayBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const raw = await this.powersService.updatePowerArray(powerArrayId, user.sub, body);
    return formatPowerArrayToHTTP(raw);
  }
}
