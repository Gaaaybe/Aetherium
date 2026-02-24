import type { UniqueEntityId } from '@/core/entities/unique-entity-ts';
import type { DomainEvent } from '@/core/events/domain-event';
import type { Power } from '../entities/power';

export class PowerMadePublicEvent implements DomainEvent {
  public ocurredAt: Date;
  public power: Power;

  constructor(power: Power) {
    this.ocurredAt = new Date();
    this.power = power;
  }

  getAggregateId(): UniqueEntityId {
    return this.power.id;
  }

  get peculiarityId(): string | undefined {
    return this.power.getReferencedPeculiarityId();
  }
}
