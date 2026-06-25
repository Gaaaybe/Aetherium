import { Controller, Get, Param } from '@nestjs/common';
import { formatPowerArrayToHTTP } from '@/modules/power-manager/dto/power.dto';
import { PowersService } from '@/modules/power-manager/powers.service';

@Controller('/power-arrays/:powerArrayId')
export class GetPowerArrayByIdController {
  constructor(private powersService: PowersService) {}

  @Get()
  async handle(@Param('powerArrayId') powerArrayId: string) {
    const raw = await this.powersService.getPowerArrayById(powerArrayId);
    return formatPowerArrayToHTTP(raw);
  }
}
