import type { DomainEvent } from '@/core/events/domain-event';
import { DomainEvents } from '@/core/events/domain-events';
import { PowerMadePublicEvent } from '../../enterprise/events/power-made-public-event';
import type { PeculiaritiesRepository } from '../repositories/peculiarities-repository';

export class OnPowerMadePublic {
  constructor(private peculiaritiesRepository: PeculiaritiesRepository) {
    this.setupSubscriptions();
  }

  setupSubscriptions(): void {
    DomainEvents.register(this.publishReferencedPeculiarity.bind(this), PowerMadePublicEvent.name);
  }

  private async publishReferencedPeculiarity(event: DomainEvent): Promise<void> {
    const { peculiarityId } = event as PowerMadePublicEvent;

    if (!peculiarityId) return;

    const peculiarity = await this.peculiaritiesRepository.findById(peculiarityId);

    if (peculiarity && !peculiarity.isPublic) {
      const publicPeculiarity = peculiarity.makePublic();
      await this.peculiaritiesRepository.update(publicPeculiarity);
    }
  }
}
