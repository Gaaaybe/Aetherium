import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { PowersService } from '@/modules/power-manager/powers.service';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe';
import {
  createPowerBodySchema,
  formatPowerToHTTP,
} from '@/modules/power-manager/dto/power.dto';
import type { CreatePowerBodySchema } from '@/modules/power-manager/dto/power.dto';

@Controller('/powers')
export class CreatePowerController {
  constructor(private powersService: PowersService) {}

  @Post()
  @HttpCode(201)
  async handle(
    @Body(new ZodValidationPipe(createPowerBodySchema)) body: CreatePowerBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const raw = await this.powersService.createPower(user.sub, body);
    return formatPowerToHTTP(raw);
  }
}
