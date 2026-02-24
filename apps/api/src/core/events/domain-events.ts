import type { AggregateRoot } from '../entities/aggregate-root';
import type { UniqueEntityId } from '../entities/unique-entity-ts';
import type { DomainEvent } from './domain-event';

type DomainEventCallback = (event: DomainEvent) => void | Promise<void>;

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

  private static async dispatchAggregateEvents(aggregate: AggregateRoot<unknown>): Promise<void> {
    for (const event of aggregate.domainEvents) {
      await DomainEvents.dispatch(event);
    }
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

  public static async dispatchEventsForAggregate(id: UniqueEntityId): Promise<void> {
    const aggregate = DomainEvents.findMarkedAggregateByID(id);

    if (aggregate) {
      await DomainEvents.dispatchAggregateEvents(aggregate);
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

  private static async dispatch(event: DomainEvent): Promise<void> {
    const eventClassName: string = event.constructor.name;

    if (Object.hasOwn(DomainEvents.handlersMap, eventClassName)) {
      const handlers = DomainEvents.handlersMap[eventClassName];

      for (const handler of handlers) {
        await handler(event);
      }
    }
  }
}
