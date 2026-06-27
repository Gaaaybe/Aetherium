import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import type { CreatePeculiarityBodySchema } from '@/modules/power-manager/dto/power.dto';
import {
  createPeculiarityBodySchema,
  formatPeculiarityToHTTP,
} from '@/modules/power-manager/dto/power.dto';
import { PowersService } from '@/modules/power-manager/powers.service';
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe';

@Controller('/peculiarities')
export class CreatePeculiarityController {
  constructor(private powersService: PowersService) {}

  @Post()
  @HttpCode(201)
  async handle(
    @Body(new ZodValidationPipe(createPeculiarityBodySchema)) body: CreatePeculiarityBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const raw = await this.powersService.createPeculiarity(user.sub, body);
    return formatPeculiarityToHTTP(raw);
  }
}
