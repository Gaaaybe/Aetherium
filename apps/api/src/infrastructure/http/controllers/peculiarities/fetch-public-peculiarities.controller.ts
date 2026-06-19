import { Controller, Get, Query } from '@nestjs/common';
import { PowersService } from '@/modules/power-manager/powers.service';
import { Public } from '@/infrastructure/auth/public';
import { formatPeculiarityToHTTP } from '@/modules/power-manager/dto/power.dto';

@Controller('/peculiarities/public')
export class FetchPublicPeculiaritiesController {
  constructor(private powersService: PowersService) {}

  @Get()
  @Public()
  async handle(@Query('page') page: string) {
    const raws = await this.powersService.fetchPublicPeculiarities(page ? Number(page) : 1);
    return raws.map(formatPeculiarityToHTTP);
  }
}
