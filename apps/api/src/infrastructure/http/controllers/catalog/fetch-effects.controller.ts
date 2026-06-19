import { Controller, Get, Query } from '@nestjs/common';
import { PowersService } from '@/modules/power-manager/powers.service';
import { Public } from '@/infrastructure/auth/public';
import { formatEffectBaseToHTTP } from '@/modules/power-manager/dto/power.dto';

@Controller('/effects')
export class FetchEffectsController {
  constructor(private powersService: PowersService) {}

  @Public()
  @Get()
  async handle(@Query('category') category?: string) {
    const effects = await this.powersService.fetchEffects(category);

    return effects.map(formatEffectBaseToHTTP);
  }
}
