import type { UniqueEntityId } from '@/core/entities/unique-entity-ts';
import type { DomainEvent } from '@/core/events/domain-event';
import type { PowerArray } from '../entities/power-array';

export class PowerArrayMadePublicEvent implements DomainEvent {
  public ocurredAt: Date;
  public powerArray: PowerArray;
  public privatePowerIds: string[];

  constructor(powerArray: PowerArray, privatePowerIds: string[]) {
    this.ocurredAt = new Date();
    this.powerArray = powerArray;
    this.privatePowerIds = privatePowerIds;
  }

  getAggregateId(): UniqueEntityId {
    return this.powerArray.id;
  }
}
