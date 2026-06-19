import { Controller, Get, Param } from '@nestjs/common';
import { PowersService } from '@/modules/power-manager/powers.service';
import { formatPowerToHTTP } from '@/modules/power-manager/dto/power.dto';

@Controller('/characters/:characterId/powers/full')
export class FetchCharacterPowersController {
  constructor(private powersService: PowersService) {}

  @Get()
  async handle(@Param('characterId') characterId: string) {
    const raws = await this.powersService.fetchCharacterPowers(characterId);
    return {
      powers: raws.map(formatPowerToHTTP),
    };
  }
}
