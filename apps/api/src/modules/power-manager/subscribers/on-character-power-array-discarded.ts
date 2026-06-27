import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { CharacterPowerArrayDiscardedEvent } from '@/modules/character-manager/events/character-power-array-discarded-event';

@Injectable()
export class OnCharacterPowerArrayDiscarded {
  constructor(private prisma: PrismaService) {}

  @OnEvent('CharacterPowerArrayDiscardedEvent')
  async handleCharacterPowerArrayDiscarded(event: CharacterPowerArrayDiscardedEvent) {
    const { discardedPowerArrayId } = event;
    const powerArray = await this.prisma.powerArray.findUnique({
      where: { id: discardedPowerArrayId },
      select: { isPublic: true },
    });

    if (powerArray && !powerArray.isPublic) {
      await this.prisma.powerArray.delete({
        where: { id: discardedPowerArrayId },
      });
    }
  }
}
