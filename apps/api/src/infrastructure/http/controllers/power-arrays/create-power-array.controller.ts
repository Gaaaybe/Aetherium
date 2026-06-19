import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { PowersService } from '@/modules/power-manager/powers.service';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe';
import {
  createPowerArrayBodySchema,
  formatPowerArrayToHTTP,
} from '@/modules/power-manager/dto/power.dto';
import type { CreatePowerArrayBodySchema } from '@/modules/power-manager/dto/power.dto';

@Controller('/power-arrays')
export class CreatePowerArrayController {
  constructor(private powersService: PowersService) {}

  @Post()
  @HttpCode(201)
  async handle(
    @Body(new ZodValidationPipe(createPowerArrayBodySchema)) body: CreatePowerArrayBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const raw = await this.powersService.createPowerArray(user.sub, body);
    return formatPowerArrayToHTTP(raw);
  }
}
