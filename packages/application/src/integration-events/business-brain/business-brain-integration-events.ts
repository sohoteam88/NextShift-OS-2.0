import type {
  BusinessBrainId,
  BusinessHealthSnapshot,
  BusinessProfileId,
  InsightGenerationResultSnapshot,
  KnowledgeGraphSnapshot,
  OpportunityDetectionResultSnapshot,
} from "@nextshift/domain";
import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  Timestamp,
} from "@nextshift/shared";
import type { BusinessBrainAnalysisResult } from "../../business-brain";

export type BusinessBrainIntegrationEventId = Brand<
  string,
  "BusinessBrainIntegrationEventId"
>;

export type BusinessBrainIntegrationEventType =
  | "BusinessHealthEvaluated"
  | "OpportunitiesDetected"
  | "BusinessInsightsGenerated"
  | "KnowledgeGraphGenerated"
  | "BusinessBrainAnalysisCompleted";

export type BusinessBrainIntegrationAggregateType = "BusinessBrain";
export type BusinessBrainIntegrationAggregateId = BusinessBrainId;

export interface BusinessHealthEvaluatedPayload {
  readonly businessBrainId: BusinessBrainId;
  readonly businessProfileId?: BusinessProfileId;
  readonly businessId?: BusinessId;
  readonly health: BusinessHealthSnapshot;
}

export interface OpportunitiesDetectedPayload {
  readonly businessBrainId: BusinessBrainId;
  readonly businessProfileId?: BusinessProfileId;
  readonly businessId?: BusinessId;
  readonly opportunityDetectionResult: OpportunityDetectionResultSnapshot;
}

export interface BusinessInsightsGeneratedPayload {
  readonly businessBrainId: BusinessBrainId;
  readonly businessProfileId?: BusinessProfileId;
  readonly businessId?: BusinessId;
  readonly insightGenerationResult: InsightGenerationResultSnapshot;
}

export interface KnowledgeGraphGeneratedPayload {
  readonly businessBrainId: BusinessBrainId;
  readonly businessProfileId?: BusinessProfileId;
  readonly businessId?: BusinessId;
  readonly knowledgeGraphSnapshot: KnowledgeGraphSnapshot;
}

export interface BusinessBrainAnalysisCompletedPayload {
  readonly businessBrainId: BusinessBrainId;
  readonly businessProfileId?: BusinessProfileId;
  readonly businessId?: BusinessId;
  readonly analyzedAt: Timestamp;
  readonly healthStatus: string;
  readonly healthScore: number;
  readonly opportunityCount: number;
  readonly insightCount: number;
  readonly knowledgeNodeCount: number;
  readonly knowledgeRelationshipCount: number;
}

export type BusinessBrainIntegrationPayload =
  | BusinessHealthEvaluatedPayload
  | OpportunitiesDetectedPayload
  | BusinessInsightsGeneratedPayload
  | KnowledgeGraphGeneratedPayload
  | BusinessBrainAnalysisCompletedPayload;

export interface BusinessBrainIntegrationEvent {
  readonly integrationEventId: BusinessBrainIntegrationEventId;
  readonly eventType: BusinessBrainIntegrationEventType;
  readonly aggregateType: BusinessBrainIntegrationAggregateType;
  readonly aggregateId: BusinessBrainIntegrationAggregateId;
  readonly businessProfileId?: BusinessProfileId;
  readonly businessId?: BusinessId;
  readonly occurredAt: Timestamp;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
  readonly version: 1;
  readonly payload: BusinessBrainIntegrationPayload;
  readonly serializedPayload: string;
}

export interface BusinessBrainIntegrationReplayStore {
  append(event: BusinessBrainIntegrationEvent): Promise<void>;
  replay(): Promise<readonly BusinessBrainIntegrationEvent[]>;
  replayByAggregate(
    aggregateType: BusinessBrainIntegrationAggregateType,
    aggregateId: BusinessBrainIntegrationAggregateId
  ): Promise<readonly BusinessBrainIntegrationEvent[]>;
  replayByEventType(
    eventType: BusinessBrainIntegrationEventType
  ): Promise<readonly BusinessBrainIntegrationEvent[]>;
}

export type BusinessBrainIntegrationEventSource =
  | {
      readonly eventType: "BusinessHealthEvaluated";
      readonly businessBrainId: BusinessBrainId;
      readonly businessProfileId?: BusinessProfileId;
      readonly businessId?: BusinessId;
      readonly businessHealth: BusinessHealthSnapshot;
      readonly occurredAt?: Timestamp;
      readonly correlationId?: CorrelationId;
      readonly causationId?: CausationId;
    }
  | {
      readonly eventType: "OpportunitiesDetected";
      readonly businessBrainId: BusinessBrainId;
      readonly businessProfileId?: BusinessProfileId;
      readonly businessId?: BusinessId;
      readonly opportunityDetectionResult: OpportunityDetectionResultSnapshot;
      readonly occurredAt?: Timestamp;
      readonly correlationId?: CorrelationId;
      readonly causationId?: CausationId;
    }
  | {
      readonly eventType: "BusinessInsightsGenerated";
      readonly businessBrainId: BusinessBrainId;
      readonly businessProfileId?: BusinessProfileId;
      readonly businessId?: BusinessId;
      readonly insightGenerationResult: InsightGenerationResultSnapshot;
      readonly occurredAt?: Timestamp;
      readonly correlationId?: CorrelationId;
      readonly causationId?: CausationId;
    }
  | {
      readonly eventType: "KnowledgeGraphGenerated";
      readonly businessBrainId: BusinessBrainId;
      readonly businessProfileId?: BusinessProfileId;
      readonly businessId?: BusinessId;
      readonly knowledgeGraphSnapshot: KnowledgeGraphSnapshot;
      readonly occurredAt?: Timestamp;
      readonly correlationId?: CorrelationId;
      readonly causationId?: CausationId;
    }
  | {
      readonly eventType: "BusinessBrainAnalysisCompleted";
      readonly businessBrainId: BusinessBrainId;
      readonly businessProfileId?: BusinessProfileId;
      readonly businessId?: BusinessId;
      readonly analysisResult: BusinessBrainAnalysisResult;
      readonly occurredAt?: Timestamp;
      readonly correlationId?: CorrelationId;
      readonly causationId?: CausationId;
    };

export interface BusinessBrainAnalysisEventSourceInput {
  readonly businessBrainId: BusinessBrainId;
  readonly businessProfileId?: BusinessProfileId;
  readonly businessId?: BusinessId;
  readonly analysisResult: BusinessBrainAnalysisResult;
  readonly occurredAt?: Timestamp;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

type CreateBusinessBrainIntegrationEventId =
  () => BusinessBrainIntegrationEventId;

const defaultCreateBusinessBrainIntegrationEventId:
  CreateBusinessBrainIntegrationEventId = () =>
    crypto.randomUUID() as BusinessBrainIntegrationEventId;

export function createBusinessBrainAnalysisIntegrationEventSources(
  input: BusinessBrainAnalysisEventSourceInput
): readonly BusinessBrainIntegrationEventSource[] {
  const shared = {
    businessBrainId: input.businessBrainId,
    businessProfileId: input.businessProfileId,
    businessId: input.businessId,
    occurredAt: input.occurredAt,
    correlationId: input.correlationId,
    causationId: input.causationId,
  };

  return freezeList([
    {
      ...shared,
      eventType: "BusinessHealthEvaluated",
      businessHealth: input.analysisResult.businessHealth.toSnapshot(),
    },
    {
      ...shared,
      eventType: "OpportunitiesDetected",
      opportunityDetectionResult:
        input.analysisResult.opportunityDetectionResult.toSnapshot(),
    },
    {
      ...shared,
      eventType: "BusinessInsightsGenerated",
      insightGenerationResult:
        input.analysisResult.insightGenerationResult.toSnapshot(),
    },
    {
      ...shared,
      eventType: "KnowledgeGraphGenerated",
      knowledgeGraphSnapshot: input.analysisResult.knowledgeGraphSnapshot,
    },
    {
      ...shared,
      eventType: "BusinessBrainAnalysisCompleted",
      analysisResult: input.analysisResult,
    },
  ] satisfies readonly BusinessBrainIntegrationEventSource[]);
}

export class BusinessBrainIntegrationEventMapper {
  constructor(
    private readonly createIntegrationEventId:
      CreateBusinessBrainIntegrationEventId =
      defaultCreateBusinessBrainIntegrationEventId
  ) {}

  map(source: BusinessBrainIntegrationEventSource): BusinessBrainIntegrationEvent {
    switch (source.eventType) {
      case "BusinessHealthEvaluated":
        return this.mapBusinessHealthEvaluated(source);
      case "OpportunitiesDetected":
        return this.mapOpportunitiesDetected(source);
      case "BusinessInsightsGenerated":
        return this.mapBusinessInsightsGenerated(source);
      case "KnowledgeGraphGenerated":
        return this.mapKnowledgeGraphGenerated(source);
      case "BusinessBrainAnalysisCompleted":
        return this.mapBusinessBrainAnalysisCompleted(source);
      default: {
        const unsupported = source as { readonly eventType?: string };
        throw new Error(
          `Unsupported business brain integration event: ${unsupported.eventType}.`
        );
      }
    }
  }

  private mapBusinessHealthEvaluated(
    source: Extract<
      BusinessBrainIntegrationEventSource,
      { readonly eventType: "BusinessHealthEvaluated" }
    >
  ): BusinessBrainIntegrationEvent {
    const payload: BusinessHealthEvaluatedPayload = freezeDeep({
      businessBrainId: source.businessBrainId,
      businessProfileId: source.businessProfileId,
      businessId: source.businessId,
      health: cloneDeep(source.businessHealth),
    });

    return this.createEvent({
      eventType: "BusinessHealthEvaluated",
      aggregateId: source.businessBrainId,
      businessProfileId: source.businessProfileId,
      businessId: source.businessId,
      occurredAt: source.occurredAt ?? source.businessHealth.evaluatedAt,
      correlationId: source.correlationId,
      causationId: source.causationId,
      payload,
    });
  }

  private mapOpportunitiesDetected(
    source: Extract<
      BusinessBrainIntegrationEventSource,
      { readonly eventType: "OpportunitiesDetected" }
    >
  ): BusinessBrainIntegrationEvent {
    const payload: OpportunitiesDetectedPayload = freezeDeep({
      businessBrainId: source.businessBrainId,
      businessProfileId: source.businessProfileId,
      businessId: source.businessId,
      opportunityDetectionResult: cloneDeep(source.opportunityDetectionResult),
    });

    return this.createEvent({
      eventType: "OpportunitiesDetected",
      aggregateId: source.businessBrainId,
      businessProfileId: source.businessProfileId,
      businessId: source.businessId,
      occurredAt:
        source.occurredAt ?? source.opportunityDetectionResult.detectedAt,
      correlationId: source.correlationId,
      causationId: source.causationId,
      payload,
    });
  }

  private mapBusinessInsightsGenerated(
    source: Extract<
      BusinessBrainIntegrationEventSource,
      { readonly eventType: "BusinessInsightsGenerated" }
    >
  ): BusinessBrainIntegrationEvent {
    const payload: BusinessInsightsGeneratedPayload = freezeDeep({
      businessBrainId: source.businessBrainId,
      businessProfileId: source.businessProfileId,
      businessId: source.businessId,
      insightGenerationResult: cloneDeep(source.insightGenerationResult),
    });

    return this.createEvent({
      eventType: "BusinessInsightsGenerated",
      aggregateId: source.businessBrainId,
      businessProfileId: source.businessProfileId,
      businessId: source.businessId,
      occurredAt:
        source.occurredAt ?? source.insightGenerationResult.generatedAt,
      correlationId: source.correlationId,
      causationId: source.causationId,
      payload,
    });
  }

  private mapKnowledgeGraphGenerated(
    source: Extract<
      BusinessBrainIntegrationEventSource,
      { readonly eventType: "KnowledgeGraphGenerated" }
    >
  ): BusinessBrainIntegrationEvent {
    const payload: KnowledgeGraphGeneratedPayload = freezeDeep({
      businessBrainId: source.businessBrainId,
      businessProfileId: source.businessProfileId,
      businessId: source.businessId,
      knowledgeGraphSnapshot: cloneDeep(source.knowledgeGraphSnapshot),
    });

    return this.createEvent({
      eventType: "KnowledgeGraphGenerated",
      aggregateId: source.businessBrainId,
      businessProfileId: source.businessProfileId,
      businessId: source.businessId,
      occurredAt: source.occurredAt ?? source.knowledgeGraphSnapshot.generatedAt,
      correlationId: source.correlationId,
      causationId: source.causationId,
      payload,
    });
  }

  private mapBusinessBrainAnalysisCompleted(
    source: Extract<
      BusinessBrainIntegrationEventSource,
      { readonly eventType: "BusinessBrainAnalysisCompleted" }
    >
  ): BusinessBrainIntegrationEvent {
    const health = source.analysisResult.businessHealth.toSnapshot();
    const opportunities =
      source.analysisResult.opportunityDetectionResult.toSnapshot();
    const insights = source.analysisResult.insightGenerationResult.toSnapshot();
    const graph = source.analysisResult.knowledgeGraphSnapshot;
    const payload: BusinessBrainAnalysisCompletedPayload = freezeDeep({
      businessBrainId: source.businessBrainId,
      businessProfileId: source.businessProfileId,
      businessId: source.businessId,
      analyzedAt: source.analysisResult.analyzedAt,
      healthStatus: health.status,
      healthScore: health.score,
      opportunityCount: opportunities.opportunities.length,
      insightCount: insights.insights.length,
      knowledgeNodeCount: graph.nodes.length,
      knowledgeRelationshipCount: graph.relationships.length,
    });

    return this.createEvent({
      eventType: "BusinessBrainAnalysisCompleted",
      aggregateId: source.businessBrainId,
      businessProfileId: source.businessProfileId,
      businessId: source.businessId,
      occurredAt: source.occurredAt ?? source.analysisResult.analyzedAt,
      correlationId: source.correlationId,
      causationId: source.causationId,
      payload,
    });
  }

  private createEvent(input: {
    readonly eventType: BusinessBrainIntegrationEventType;
    readonly aggregateId: BusinessBrainIntegrationAggregateId;
    readonly businessProfileId?: BusinessProfileId;
    readonly businessId?: BusinessId;
    readonly occurredAt: Timestamp;
    readonly correlationId?: CorrelationId;
    readonly causationId?: CausationId;
    readonly payload: BusinessBrainIntegrationPayload;
  }): BusinessBrainIntegrationEvent {
    return freezeDeep({
      integrationEventId: this.createIntegrationEventId(),
      eventType: input.eventType,
      aggregateType: "BusinessBrain",
      aggregateId: input.aggregateId,
      businessProfileId: input.businessProfileId,
      businessId: input.businessId,
      occurredAt: input.occurredAt,
      correlationId: input.correlationId,
      causationId: input.causationId,
      version: 1,
      payload: input.payload,
      serializedPayload: JSON.stringify(input.payload),
    });
  }
}

export class InMemoryBusinessBrainIntegrationReplayStore
  implements BusinessBrainIntegrationReplayStore
{
  private readonly events: BusinessBrainIntegrationEvent[] = [];

  async append(event: BusinessBrainIntegrationEvent): Promise<void> {
    this.events.push(cloneBusinessBrainIntegrationEvent(event));
  }

  async replay(): Promise<readonly BusinessBrainIntegrationEvent[]> {
    return freezeList(this.events.map(cloneBusinessBrainIntegrationEvent));
  }

  async replayByAggregate(
    aggregateType: BusinessBrainIntegrationAggregateType,
    aggregateId: BusinessBrainIntegrationAggregateId
  ): Promise<readonly BusinessBrainIntegrationEvent[]> {
    return freezeList(
      this.events
        .filter(
          (event) =>
            event.aggregateType === aggregateType &&
            event.aggregateId === aggregateId
        )
        .map(cloneBusinessBrainIntegrationEvent)
    );
  }

  async replayByEventType(
    eventType: BusinessBrainIntegrationEventType
  ): Promise<readonly BusinessBrainIntegrationEvent[]> {
    return freezeList(
      this.events
        .filter((event) => event.eventType === eventType)
        .map(cloneBusinessBrainIntegrationEvent)
    );
  }
}

export class BusinessBrainIntegrationEventPublisher {
  constructor(
    private readonly replayStore: BusinessBrainIntegrationReplayStore,
    private readonly mapper: BusinessBrainIntegrationEventMapper =
      new BusinessBrainIntegrationEventMapper()
  ) {}

  async publish(
    source: BusinessBrainIntegrationEventSource
  ): Promise<BusinessBrainIntegrationEvent> {
    const integrationEvent = this.mapper.map(source);
    await this.replayStore.append(integrationEvent);
    return cloneBusinessBrainIntegrationEvent(integrationEvent);
  }

  async publishMany(
    sources: readonly BusinessBrainIntegrationEventSource[]
  ): Promise<readonly BusinessBrainIntegrationEvent[]> {
    const integrationEvents: BusinessBrainIntegrationEvent[] = [];

    for (const source of sources) {
      integrationEvents.push(await this.publish(source));
    }

    return freezeList(integrationEvents.map(cloneBusinessBrainIntegrationEvent));
  }
}

function cloneBusinessBrainIntegrationEvent(
  event: BusinessBrainIntegrationEvent
): BusinessBrainIntegrationEvent {
  return freezeDeep({
    integrationEventId: event.integrationEventId,
    eventType: event.eventType,
    aggregateType: event.aggregateType,
    aggregateId: event.aggregateId,
    businessProfileId: event.businessProfileId,
    businessId: event.businessId,
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
