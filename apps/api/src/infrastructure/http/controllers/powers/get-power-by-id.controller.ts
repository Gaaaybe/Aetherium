import { Controller, Get, Param } from '@nestjs/common';
import { formatPowerToHTTP } from '@/modules/power-manager/dto/power.dto';
import { PowersService } from '@/modules/power-manager/powers.service';

@Controller('/powers/:powerId')
export class GetPowerByIdController {
  constructor(private powersService: PowersService) {}

  @Get()
  async handle(@Param('powerId') powerId: string) {
    const raw = await this.powersService.getPowerById(powerId);
    return formatPowerToHTTP(raw);
  }
}
