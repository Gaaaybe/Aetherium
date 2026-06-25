import { Body, Controller, Param, Put } from '@nestjs/common';
import { CurrentUser } from '@/infrastructure/auth/current-user-decorator';
import type { UserPayload } from '@/infrastructure/auth/jwt.strategy';
import type { UpdatePeculiarityBodySchema } from '@/modules/power-manager/dto/power.dto';
import {
  formatPeculiarityToHTTP,
  updatePeculiarityBodySchema,
} from '@/modules/power-manager/dto/power.dto';
import { PowersService } from '@/modules/power-manager/powers.service';
import { ZodValidationPipe } from '../../pipes/zod-validation-pipe';

@Controller('/peculiarities/:peculiarityId')
export class UpdatePeculiarityController {
  constructor(private powersService: PowersService) {}

  @Put()
  async handle(
    @Param('peculiarityId') peculiarityId: string,
    @Body(new ZodValidationPipe(updatePeculiarityBodySchema)) body: UpdatePeculiarityBodySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const raw = await this.powersService.updatePeculiarity(peculiarityId, user.sub, body);
    return formatPeculiarityToHTTP(raw);
  }
}
