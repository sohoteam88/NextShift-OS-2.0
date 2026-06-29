import type { BusinessEvent } from "@nextshift/contracts";

export interface EventHandler<T extends BusinessEvent = BusinessEvent> {
  handle(event: T): Promise<void>;
}

export interface EventSubscription {
  readonly eventType: string;
  readonly handler: EventHandler;
}
