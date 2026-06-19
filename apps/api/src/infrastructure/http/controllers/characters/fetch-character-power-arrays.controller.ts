import { Controller, Get, Param } from '@nestjs/common';
import { PowersService } from '@/modules/power-manager/powers.service';
import { formatPowerArrayToHTTP } from '@/modules/power-manager/dto/power.dto';

@Controller('/characters/:characterId/power-arrays/full')
export class FetchCharacterPowerArraysController {
  constructor(private powersService: PowersService) {}

  @Get()
  async handle(@Param('characterId') characterId: string) {
    const raws = await this.powersService.fetchCharacterPowerArrays(characterId);
    return {
      powerArrays: raws.map(formatPowerArrayToHTTP),
    };
  }
}
