import { Controller, Get, Param } from '@nestjs/common';
import { PowersService } from '@/modules/power-manager/powers.service';
import { formatPowerToHTTP } from '@/modules/power-manager/dto/power.dto';

@Controller('/powers/:powerId')
export class GetPowerByIdController {
  constructor(private powersService: PowersService) {}

  @Get()
  async handle(@Param('powerId') powerId: string) {
    const raw = await this.powersService.getPowerById(powerId);
    return formatPowerToHTTP(raw);
  }
}
