import type { BusinessEvent } from "@nextshift/contracts";

export interface EventBus {
  publish(event: BusinessEvent): Promise<void>;

  subscribe(
    eventType: string,
    handler: (event: BusinessEvent) => Promise<void>
  ): void;

  unsubscribe(eventType: string): void;
}
