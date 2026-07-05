import type { BusinessEvent } from "@nextshift/contracts";
import type { EventBus, EventEnvelope } from "../bus";
import type { EventHandler, EventSubscription } from "../types";

export class InMemoryEventBus<TEvent extends EventEnvelope = BusinessEvent>
  implements EventBus<TEvent>
{
  private readonly handlers = new Map<string, Set<EventHandler<TEvent>>>();

  async publish(event: TEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) ?? new Set();

    await Promise.all(Array.from(handlers).map((handler) => handler(event)));
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
