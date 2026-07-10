import type { BusinessEvent } from "@nextshift/contracts";
import type { EventHandler, EventSubscription } from "../types";

export interface EventEnvelope {
  readonly eventType: string;
}

export interface EventBus<TEvent extends EventEnvelope = BusinessEvent> {
  publish(event: TEvent): Promise<void>;

  subscribe(
    eventType: string,
    handler: EventHandler<TEvent>
  ): EventSubscription<TEvent>;

  unsubscribe(eventType: string, handler?: EventHandler<TEvent>): void;
}
