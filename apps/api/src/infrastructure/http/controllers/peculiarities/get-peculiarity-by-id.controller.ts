import { Controller, Get, Param } from '@nestjs/common';
import { formatPeculiarityToHTTP } from '@/modules/power-manager/dto/power.dto';
import { PowersService } from '@/modules/power-manager/powers.service';

@Controller('/peculiarities/:peculiarityId')
export class GetPeculiarityByIdController {
  constructor(private powersService: PowersService) {}

  @Get()
  async handle(@Param('peculiarityId') peculiarityId: string) {
    const raw = await this.powersService.getPeculiarityById(peculiarityId);
    return formatPeculiarityToHTTP(raw);
  }
}
