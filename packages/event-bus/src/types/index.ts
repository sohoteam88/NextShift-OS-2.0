import type { BusinessEvent } from "@nextshift/contracts";
import type { EventEnvelope } from "../bus";

export type EventHandler<TEvent extends EventEnvelope = BusinessEvent> = (
  event: TEvent
) => Promise<void> | void;

export interface EventSubscription<TEvent extends EventEnvelope = BusinessEvent> {
  readonly eventType: string;
  readonly handler: EventHandler<TEvent>;
  unsubscribe(): void;
}
