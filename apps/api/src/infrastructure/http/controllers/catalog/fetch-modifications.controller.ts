import { Controller, Get, Query } from '@nestjs/common';
import { PowersService } from '@/modules/power-manager/powers.service';
import { Public } from '@/infrastructure/auth/public';
import { formatModificationBaseToHTTP } from '@/modules/power-manager/dto/power.dto';

@Controller('/modifications')
export class FetchModificationsController {
  constructor(private powersService: PowersService) {}

  @Public()
  @Get()
  async handle(
    @Query('type') type?: 'extra' | 'falha',
    @Query('category') category?: string,
  ) {
    const modifications = await this.powersService.fetchModifications(type, category);

    return modifications.map(formatModificationBaseToHTTP);
  }
}
