import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '@/infrastructure/auth/public';
import { formatPowerArrayToHTTP } from '@/modules/power-manager/dto/power.dto';
import { PowersService } from '@/modules/power-manager/powers.service';

@Controller('/power-arrays')
export class FetchPublicPowerArraysController {
  constructor(private powersService: PowersService) {}

  @Get()
  @Public()
  async handle(@Query('page') page: string) {
    const raws = await this.powersService.fetchPublicPowerArrays(page ? Number(page) : 1);
    return raws.map(formatPowerArrayToHTTP);
  }
}
