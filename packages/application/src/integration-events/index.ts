import type {
  CustomerDomainEvent,
  FollowUpDomainEvent,
  InteractionDomainEvent,
  LeadDomainEvent,
  SegmentDomainEvent,
} from "@nextshift/domain";
import type {
  Brand,
  CausationId,
  CorrelationId,
  Timestamp,
} from "@nextshift/shared";

export * from "./campaign";
export * from "./analytics";
export * from "./business-brain";

export type IntegrationEventId = Brand<string, "IntegrationEventId">;

export type CRMDomainEvent =
  | CustomerDomainEvent
  | LeadDomainEvent
  | InteractionDomainEvent
  | FollowUpDomainEvent
  | SegmentDomainEvent;

export type CRMIntegrationEventType = CRMDomainEvent["eventType"];
export type CRMIntegrationAggregateType = CRMDomainEvent["aggregateType"];
export type CRMIntegrationAggregateId = CRMDomainEvent["aggregateId"];
export type CRMIntegrationPayload = CRMDomainEvent["payload"];

export interface IntegrationEvent {
  readonly integrationEventId: IntegrationEventId;
  readonly eventType: CRMIntegrationEventType;
  readonly aggregateType: CRMIntegrationAggregateType;
  readonly aggregateId: CRMIntegrationAggregateId;
  readonly occurredAt: Timestamp;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
  readonly version: 1;
  readonly payload: CRMIntegrationPayload;
  readonly serializedPayload: string;
}

export interface IntegrationReplayStore {
  append(event: IntegrationEvent): Promise<void>;
  replay(): Promise<readonly IntegrationEvent[]>;
  replayByAggregate(
    aggregateType: CRMIntegrationAggregateType,
    aggregateId: CRMIntegrationAggregateId
  ): Promise<readonly IntegrationEvent[]>;
  replayByEventType(
    eventType: CRMIntegrationEventType
  ): Promise<readonly IntegrationEvent[]>;
}

type CreateIntegrationEventId = () => IntegrationEventId;

const defaultCreateIntegrationEventId: CreateIntegrationEventId = () =>
  crypto.randomUUID() as IntegrationEventId;

export class IntegrationEventMapper {
  constructor(
    private readonly createIntegrationEventId: CreateIntegrationEventId =
      defaultCreateIntegrationEventId
  ) {}

  map(domainEvent: CRMDomainEvent): IntegrationEvent {
    const payload = freezeDeep(cloneDeep(domainEvent.payload));

    return freezeDeep({
      integrationEventId: this.createIntegrationEventId(),
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

export class InMemoryIntegrationReplayStore implements IntegrationReplayStore {
  private readonly events: IntegrationEvent[] = [];

  async append(event: IntegrationEvent): Promise<void> {
    this.events.push(cloneIntegrationEvent(event));
  }

  async replay(): Promise<readonly IntegrationEvent[]> {
    return freezeList(this.events.map(cloneIntegrationEvent));
  }

  async replayByAggregate(
    aggregateType: CRMIntegrationAggregateType,
    aggregateId: CRMIntegrationAggregateId
  ): Promise<readonly IntegrationEvent[]> {
    return freezeList(
      this.events
        .filter(
          (event) =>
            event.aggregateType === aggregateType &&
            event.aggregateId === aggregateId
        )
        .map(cloneIntegrationEvent)
    );
  }

  async replayByEventType(
    eventType: CRMIntegrationEventType
  ): Promise<readonly IntegrationEvent[]> {
    return freezeList(
      this.events
        .filter((event) => event.eventType === eventType)
        .map(cloneIntegrationEvent)
    );
  }
}

export class CRMIntegrationEventPublisher {
  constructor(
    private readonly replayStore: IntegrationReplayStore,
    private readonly mapper: IntegrationEventMapper = new IntegrationEventMapper()
  ) {}

  async publish(domainEvent: CRMDomainEvent): Promise<IntegrationEvent> {
    const integrationEvent = this.mapper.map(domainEvent);
    await this.replayStore.append(integrationEvent);
    return integrationEvent;
  }

  async publishMany(
    domainEvents: readonly CRMDomainEvent[]
  ): Promise<readonly IntegrationEvent[]> {
    const integrationEvents: IntegrationEvent[] = [];

    for (const domainEvent of domainEvents) {
      integrationEvents.push(await this.publish(domainEvent));
    }

    return freezeList(integrationEvents.map(cloneIntegrationEvent));
  }
}

function cloneIntegrationEvent(event: IntegrationEvent): IntegrationEvent {
  return freezeDeep({
    integrationEventId: event.integrationEventId,
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
