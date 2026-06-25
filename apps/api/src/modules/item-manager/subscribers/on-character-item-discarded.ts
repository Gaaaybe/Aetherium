import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { CharacterItemDiscardedEvent } from '@/modules/character-manager/events/character-item-discarded-event';

@Injectable()
export class OnCharacterItemDiscarded {
  constructor(private prisma: PrismaService) {}

  @OnEvent('CharacterItemDiscardedEvent')
  async handleCharacterItemDiscarded(event: CharacterItemDiscardedEvent) {
    const { character, discardedItemId } = event;

    const isEquipped =
      character.equipmentSlots.suitId === discardedItemId ||
      character.equipmentSlots.accessoryId === discardedItemId ||
      character.equipmentSlots.hands.some((h) => h.itemId === discardedItemId) ||
      character.equipmentSlots.quickAccess.some((q) => q.itemId === discardedItemId);

    if (isEquipped) {
      return;
    }

    const item = await this.prisma.item.findUnique({
      where: { id: discardedItemId },
      select: { isPublic: true },
    });

    if (item && !item.isPublic) {
      await this.prisma.item.delete({
        where: { id: discardedItemId },
      });
    }
  }
}
