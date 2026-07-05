import type { BusinessEvent } from "@nextshift/contracts";
import type { EventBus, EventEnvelope } from "../bus";
import type { EventHandler, EventSubscription } from "../types";

export interface EventBusHandlerFailure {
  readonly eventType: string;
  readonly handlerIndex: number;
  readonly error: unknown;
}

export class EventBusPublishError extends Error {
  readonly failures: readonly EventBusHandlerFailure[];

  constructor(eventType: string, failures: readonly EventBusHandlerFailure[]) {
    super(
      `Event bus publish failed for ${eventType}: ${failures.length} handler failure(s)`
    );
    this.name = "EventBusPublishError";
    this.failures = failures;
  }
}

export class InMemoryEventBus<TEvent extends EventEnvelope = BusinessEvent>
  implements EventBus<TEvent>
{
  private readonly handlers = new Map<string, Set<EventHandler<TEvent>>>();

  async publish(event: TEvent): Promise<void> {
    const handlers = Array.from(this.handlers.get(event.eventType) ?? []);

    const results = await Promise.allSettled(
      handlers.map((handler) => Promise.resolve().then(() => handler(event)))
    );

    const failures = results.flatMap((result, index) =>
      result.status === "rejected"
        ? [
            {
              eventType: event.eventType,
              handlerIndex: index,
              error: result.reason,
            },
          ]
        : []
    );

    if (failures.length > 0) {
      throw new EventBusPublishError(event.eventType, failures);
    }
  }

  subscribe(
    eventType: string,
    handler: EventHandler<TEvent>
  ): EventSubscription<TEvent> {
    const handlers = this.handlers.get(eventType) ?? new Set();

    handlers.add(handler);
    this.handlers.set(eventType, handlers);

    return {
      eventType,
      handler,
      unsubscribe: () => this.unsubscribe(eventType, handler),
    };
  }

  unsubscribe(eventType: string, handler?: EventHandler<TEvent>): void {
    if (!handler) {
      this.handlers.delete(eventType);
      return;
    }

    const handlers = this.handlers.get(eventType);

    if (!handlers) {
      return;
    }

    handlers.delete(handler);

    if (handlers.size === 0) {
      this.handlers.delete(eventType);
    }
  }
}
