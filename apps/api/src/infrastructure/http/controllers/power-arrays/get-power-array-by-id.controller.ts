import { Controller, Get, Param } from '@nestjs/common';
import { PowersService } from '@/modules/power-manager/powers.service';
import { formatPowerArrayToHTTP } from '@/modules/power-manager/dto/power.dto';

@Controller('/power-arrays/:powerArrayId')
export class GetPowerArrayByIdController {
  constructor(private powersService: PowersService) {}

  @Get()
  async handle(@Param('powerArrayId') powerArrayId: string) {
    const raw = await this.powersService.getPowerArrayById(powerArrayId);
    return formatPowerArrayToHTTP(raw);
  }
}
