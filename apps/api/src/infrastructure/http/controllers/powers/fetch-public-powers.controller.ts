import { Controller, Get, Query } from '@nestjs/common';
import { PowersService } from '@/modules/power-manager/powers.service';
import { Public } from '@/infrastructure/auth/public';
import { formatPowerToHTTP } from '@/modules/power-manager/dto/power.dto';

@Controller('/powers')
export class FetchPublicPowersController {
  constructor(private powersService: PowersService) {}

  @Get()
  @Public()
  async handle(@Query('page') page: string) {
    const raws = await this.powersService.fetchPublicPowers(page ? Number(page) : 1);
    return raws.map(formatPowerToHTTP);
  }
}
