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
      // A limpeza pode ser disparada mais de uma vez por sessões concorrentes.
      // deleteMany mantém a operação idempotente caso outra execução já tenha removido a cópia.
      await this.prisma.power.deleteMany({
        where: { id: discardedPowerId, isPublic: false },
      });
    }
  }
}
