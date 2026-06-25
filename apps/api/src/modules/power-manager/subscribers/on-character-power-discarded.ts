import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { CharacterPowerDiscardedEvent } from '@/modules/character-manager/events/character-power-discarded-event';

@Injectable()
export class OnCharacterPowerDiscarded {
  constructor(private prisma: PrismaService) {}

  @OnEvent('CharacterPowerDiscardedEvent')
  async handleCharacterPowerDiscarded(event: CharacterPowerDiscardedEvent) {
    const { discardedPowerId } = event;
    const power = await this.prisma.power.findUnique({
      where: { id: discardedPowerId },
      select: { isPublic: true },
    });

    if (power && !power.isPublic) {
      await this.prisma.power.delete({
        where: { id: discardedPowerId },
      });
    }
  }
}
