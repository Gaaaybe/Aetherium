import type { AggregateRoot } from '../entities/aggregate-root';
import type { UniqueEntityId } from '../entities/unique-entity-ts';
import type { DomainEvent } from './domain-event';

type DomainEventCallback = (event: DomainEvent) => void;

// biome-ignore lint/complexity/noStaticOnlyClass: DDD pattern for domain events management
export class DomainEvents {
  private static handlersMap: Record<string, DomainEventCallback[]> = {};
  private static markedAggregates: AggregateRoot<unknown>[] = [];

  public static markAggregateForDispatch(aggregate: AggregateRoot<unknown>): void {
    const aggregateFound = !!DomainEvents.findMarkedAggregateByID(aggregate.id);

    if (!aggregateFound) {
      DomainEvents.markedAggregates.push(aggregate);
    }
  }

  private static dispatchAggregateEvents(aggregate: AggregateRoot<unknown>): void {
    aggregate.domainEvents.forEach((event: DomainEvent) => {
      DomainEvents.dispatch(event);
    });
  }

  private static removeAggregateFromMarkedDispatchList(aggregate: AggregateRoot<unknown>): void {
    const index = DomainEvents.markedAggregates.findIndex((a) => a.equals(aggregate));

    if (index !== -1) {
      DomainEvents.markedAggregates.splice(index, 1);
    }
  }

  private static findMarkedAggregateByID(id: UniqueEntityId): AggregateRoot<unknown> | undefined {
    return DomainEvents.markedAggregates.find((aggregate) => aggregate.id.equals(id));
  }

  public static dispatchEventsForAggregate(id: UniqueEntityId): void {
    const aggregate = DomainEvents.findMarkedAggregateByID(id);

    if (aggregate) {
      DomainEvents.dispatchAggregateEvents(aggregate);
      aggregate.clearEvents();
      DomainEvents.removeAggregateFromMarkedDispatchList(aggregate);
    }
  }

  public static register(callback: DomainEventCallback, eventClassName: string): void {
    if (!Object.hasOwn(DomainEvents.handlersMap, eventClassName)) {
      DomainEvents.handlersMap[eventClassName] = [];
    }

    DomainEvents.handlersMap[eventClassName].push(callback);
  }

  public static clearHandlers(): void {
    DomainEvents.handlersMap = {};
  }

  public static clearMarkedAggregates(): void {
    DomainEvents.markedAggregates = [];
  }

  private static dispatch(event: DomainEvent): void {
    const eventClassName: string = event.constructor.name;

    if (Object.hasOwn(DomainEvents.handlersMap, eventClassName)) {
      const handlers = DomainEvents.handlersMap[eventClassName];

      for (const handler of handlers) {
        handler(event);
      }
    }
  }
}
