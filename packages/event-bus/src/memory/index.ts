import type { BusinessEvent } from "@nextshift/contracts";
import type { EventBus } from "../bus";

type EventHandlerFunction = (event: BusinessEvent) => Promise<void>;

export class InMemoryEventBus implements EventBus {
  private readonly handlers = new Map<string, EventHandlerFunction[]>();

  async publish(event: BusinessEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) ?? [];

    await Promise.all(handlers.map((handler) => handler(event)));
  }

  subscribe(eventType: string, handler: EventHandlerFunction): void {
    const handlers = this.handlers.get(eventType) ?? [];

    this.handlers.set(eventType, [...handlers, handler]);
  }

  unsubscribe(eventType: string): void {
    this.handlers.delete(eventType);
  }
}
