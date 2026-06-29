import type { CampaignDomainEvent } from "@nextshift/domain";
import type {
  Brand,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";

export type CampaignIntegrationEventId = Brand<
  string,
  "CampaignIntegrationEventId"
>;

export type CampaignIntegrationEventType = CampaignDomainEvent["eventType"];
export type CampaignIntegrationAggregateType =
  CampaignDomainEvent["aggregateType"];
export type CampaignIntegrationAggregateId = CampaignDomainEvent["aggregateId"];
export type CampaignIntegrationPayload = CampaignDomainEvent["payload"];

export interface CampaignIntegrationEvent {
  readonly integrationEventId: CampaignIntegrationEventId;
  readonly eventId: EventId;
  readonly eventType: CampaignIntegrationEventType;
  readonly aggregateType: CampaignIntegrationAggregateType;
  readonly aggregateId: CampaignIntegrationAggregateId;
  readonly occurredAt: Timestamp;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
  readonly version: 1;
  readonly payload: CampaignIntegrationPayload;
  readonly serializedPayload: string;
}

export interface CampaignIntegrationReplayStore {
  append(event: CampaignIntegrationEvent): Promise<void>;
  replay(): Promise<readonly CampaignIntegrationEvent[]>;
  replayByAggregate(
    aggregateType: CampaignIntegrationAggregateType,
    aggregateId: CampaignIntegrationAggregateId
  ): Promise<readonly CampaignIntegrationEvent[]>;
  replayByEventType(
    eventType: CampaignIntegrationEventType
  ): Promise<readonly CampaignIntegrationEvent[]>;
}

type CreateCampaignIntegrationEventId = () => CampaignIntegrationEventId;

const defaultCreateCampaignIntegrationEventId:
  CreateCampaignIntegrationEventId = () =>
    crypto.randomUUID() as CampaignIntegrationEventId;

export class CampaignIntegrationEventMapper {
  constructor(
    private readonly createIntegrationEventId:
      CreateCampaignIntegrationEventId =
      defaultCreateCampaignIntegrationEventId
  ) {}

  map(domainEvent: CampaignDomainEvent): CampaignIntegrationEvent {
    assertSupportedCampaignEvent(domainEvent);

    const payload = freezeDeep(cloneDeep(domainEvent.payload));

    return freezeDeep({
      integrationEventId: this.createIntegrationEventId(),
      eventId: domainEvent.eventId,
      eventType: domainEvent.eventType,
      aggregateType: domainEvent.aggregateType,
      aggregateId: domainEvent.aggregateId,
      occurredAt: domainEvent.occurredAt,
      correlationId: domainEvent.correlationId,
      causationId: domainEvent.causationId,
      version: domainEvent.version,
      payload,
      serializedPayload: JSON.stringify(payload),
    });
  }
}

export class InMemoryCampaignIntegrationReplayStore
  implements CampaignIntegrationReplayStore
{
  private readonly events: CampaignIntegrationEvent[] = [];

  async append(event: CampaignIntegrationEvent): Promise<void> {
    this.events.push(cloneCampaignIntegrationEvent(event));
  }

  async replay(): Promise<readonly CampaignIntegrationEvent[]> {
    return freezeList(this.events.map(cloneCampaignIntegrationEvent));
  }

  async replayByAggregate(
    aggregateType: CampaignIntegrationAggregateType,
    aggregateId: CampaignIntegrationAggregateId
  ): Promise<readonly CampaignIntegrationEvent[]> {
    return freezeList(
      this.events
        .filter(
          (event) =>
            event.aggregateType === aggregateType &&
            event.aggregateId === aggregateId
        )
        .map(cloneCampaignIntegrationEvent)
    );
  }

  async replayByEventType(
    eventType: CampaignIntegrationEventType
  ): Promise<readonly CampaignIntegrationEvent[]> {
    return freezeList(
      this.events
        .filter((event) => event.eventType === eventType)
        .map(cloneCampaignIntegrationEvent)
    );
  }
}

export class CampaignIntegrationEventPublisher {
  constructor(
    private readonly replayStore: CampaignIntegrationReplayStore,
    private readonly mapper: CampaignIntegrationEventMapper =
      new CampaignIntegrationEventMapper()
  ) {}

  async publish(
    domainEvent: CampaignDomainEvent
  ): Promise<CampaignIntegrationEvent> {
    const integrationEvent = this.mapper.map(domainEvent);
    await this.replayStore.append(integrationEvent);
    return integrationEvent;
  }

  async publishMany(
    domainEvents: readonly CampaignDomainEvent[]
  ): Promise<readonly CampaignIntegrationEvent[]> {
    const integrationEvents: CampaignIntegrationEvent[] = [];

    for (const domainEvent of domainEvents) {
      integrationEvents.push(await this.publish(domainEvent));
    }

    return freezeList(integrationEvents.map(cloneCampaignIntegrationEvent));
  }
}

function assertSupportedCampaignEvent(domainEvent: CampaignDomainEvent): void {
  switch (domainEvent.eventType) {
    case "CampaignCreated":
    case "CampaignUpdated":
    case "CampaignLaunched":
    case "CampaignPaused":
    case "CampaignResumed":
    case "CampaignCompleted":
    case "CampaignArchived":
    case "CampaignRestored":
      return;
    default: {
      const unsupported = domainEvent as { readonly eventType?: string };
      throw new Error(
        `Unsupported campaign integration event: ${unsupported.eventType}.`
      );
    }
  }
}

function cloneCampaignIntegrationEvent(
  event: CampaignIntegrationEvent
): CampaignIntegrationEvent {
  return freezeDeep({
    integrationEventId: event.integrationEventId,
    eventId: event.eventId,
    eventType: event.eventType,
    aggregateType: event.aggregateType,
    aggregateId: event.aggregateId,
    occurredAt: event.occurredAt,
    correlationId: event.correlationId,
    causationId: event.causationId,
    version: event.version,
    payload: freezeDeep(cloneDeep(event.payload)),
    serializedPayload: event.serializedPayload,
  });
}

function freezeList<T>(items: readonly T[]): readonly T[] {
  return Object.freeze([...items]);
}

function cloneDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneDeep(item)) as T;
  }

  if (value && typeof value === "object") {
    const clone: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(value)) {
      clone[key] = cloneDeep(child);
    }

    return clone as T;
  }

  return value;
}

function freezeDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    for (const item of value) {
      freezeDeep(item);
    }

    return Object.freeze(value) as T;
  }

  if (value && typeof value === "object") {
    for (const child of Object.values(value)) {
      freezeDeep(child);
    }

    return Object.freeze(value) as T;
  }

  return value;
}
