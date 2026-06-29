import {
  BusinessHealth,
  InsightGenerationResult,
  OpportunityDetectionResult,
  createGeneratedBusinessInsight,
  createKnowledgeGraphSnapshot,
  createKnowledgeNode,
  createKnowledgeRelationship,
  type BusinessBrainId,
  type BusinessProfileId,
  type DetectedOpportunityId,
  type GeneratedBusinessInsightId,
  type KnowledgeNodeId,
  type KnowledgeRelationshipId,
} from "@nextshift/domain";
import type {
  BusinessId,
  CausationId,
  CorrelationId,
  Timestamp,
} from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import type { BusinessBrainAnalysisResult } from "../src/business-brain";
import {
  BusinessBrainIntegrationEventMapper,
  BusinessBrainIntegrationEventPublisher,
  BusinessBrainIntegrationEventPublisher as PublicBusinessBrainIntegrationEventPublisher,
  InMemoryBusinessBrainIntegrationReplayStore,
  InMemoryBusinessBrainIntegrationReplayStore as PublicInMemoryBusinessBrainIntegrationReplayStore,
  createBusinessBrainAnalysisIntegrationEventSources,
  type BusinessBrainIntegrationEventId,
  type BusinessBrainIntegrationEventSource,
} from "../src";

const businessBrainId = "business-brain-1" as BusinessBrainId;
const businessProfileId = "business-profile-1" as BusinessProfileId;
const businessId = "business-1" as BusinessId;
const correlationId = "correlation-1" as CorrelationId;
const causationId = "causation-1" as CausationId;
const analyzedAt = "2026-06-29T10:00:00.000Z" as Timestamp;

describe("BusinessBrainIntegrationEventMapper", () => {
  it("maps every business brain event type into immutable integration events", () => {
    const mapper = new BusinessBrainIntegrationEventMapper(
      nextBusinessBrainIntegrationEventId()
    );

    const mapped = sampleEventSources().map((source) => mapper.map(source));

    expect(mapped.map((event) => event.eventType)).toEqual([
      "BusinessHealthEvaluated",
      "OpportunitiesDetected",
      "BusinessInsightsGenerated",
      "KnowledgeGraphGenerated",
      "BusinessBrainAnalysisCompleted",
    ]);
    expect(mapped[0]).toMatchObject({
      integrationEventId: "business-brain-integration-event-1",
      eventType: "BusinessHealthEvaluated",
      aggregateType: "BusinessBrain",
      aggregateId: businessBrainId,
      businessProfileId,
      businessId,
      version: 1,
      payload: {
        businessBrainId,
        health: {
          score: 76,
          status: "strong",
        },
      },
    });
    expect(mapped.at(-1)).toMatchObject({
      eventType: "BusinessBrainAnalysisCompleted",
      occurredAt: analyzedAt,
      payload: {
        analyzedAt,
        healthStatus: "strong",
        healthScore: 76,
        opportunityCount: 1,
        insightCount: 1,
        knowledgeNodeCount: 2,
        knowledgeRelationshipCount: 1,
      },
    });
    expect(Object.isFrozen(mapped[0])).toBe(true);
    expect(Object.isFrozen(mapped[0]?.payload)).toBe(true);
    expect(
      Object.isFrozen(
        (mapped[0]?.payload as { readonly health: object }).health
      )
    ).toBe(true);
    expect(mapped[0]?.serializedPayload).toBe(
      JSON.stringify(mapped[0]?.payload)
    );
  });

  it("uses source occurredAt when provided", () => {
    const mapper = new BusinessBrainIntegrationEventMapper(
      () =>
        "business-brain-integration-event-1" as BusinessBrainIntegrationEventId
    );
    const event = mapper.map({
      ...sampleEventSources()[0],
      occurredAt: "2026-06-29T11:00:00.000Z",
    });

    expect(event.occurredAt).toBe("2026-06-29T11:00:00.000Z");
  });

  it("rejects unsupported event types defensively", () => {
    const mapper = new BusinessBrainIntegrationEventMapper(
      () =>
        "business-brain-integration-event-1" as BusinessBrainIntegrationEventId
    );

    expect(() =>
      mapper.map({
        eventType: "UnsupportedBusinessBrainEvent",
      } as unknown as BusinessBrainIntegrationEventSource)
    ).toThrow(
      "Unsupported business brain integration event: UnsupportedBusinessBrainEvent."
    );
  });
});

describe("Business Brain analysis event source helper", () => {
  it("maps analysis result into the five planned event sources", () => {
    const sources = createBusinessBrainAnalysisIntegrationEventSources({
      businessBrainId,
      businessProfileId,
      businessId,
      analysisResult: sampleAnalysisResult(),
      correlationId,
      causationId,
    });

    expect(sources.map((source) => source.eventType)).toEqual([
      "BusinessHealthEvaluated",
      "OpportunitiesDetected",
      "BusinessInsightsGenerated",
      "KnowledgeGraphGenerated",
      "BusinessBrainAnalysisCompleted",
    ]);
    expect(Object.isFrozen(sources)).toBe(true);
    expect(sources[0]).toMatchObject({
      businessBrainId,
      businessProfileId,
      businessId,
      correlationId,
      causationId,
    });
  });
});

describe("BusinessBrainIntegrationEventPublisher", () => {
  it("publishes mapped events into the replay store", async () => {
    const store = new InMemoryBusinessBrainIntegrationReplayStore();
    const publisher = new BusinessBrainIntegrationEventPublisher(
      store,
      new BusinessBrainIntegrationEventMapper(
        () =>
          "business-brain-integration-event-1" as BusinessBrainIntegrationEventId
      )
    );

    const integrationEvent = await publisher.publish(sampleEventSources()[0]);

    expect(integrationEvent).toMatchObject({
      integrationEventId: "business-brain-integration-event-1",
      eventType: "BusinessHealthEvaluated",
    });
    await expect(store.replay()).resolves.toMatchObject([
      {
        integrationEventId: "business-brain-integration-event-1",
        eventType: "BusinessHealthEvaluated",
      },
    ]);
  });

  it("preserves replay ordering and supports replay filters", async () => {
    const store = new InMemoryBusinessBrainIntegrationReplayStore();
    const publisher = new BusinessBrainIntegrationEventPublisher(
      store,
      new BusinessBrainIntegrationEventMapper(
        nextBusinessBrainIntegrationEventId()
      )
    );

    await publisher.publishMany(sampleEventSources());

    const replayed = await store.replay();

    expect(replayed.map((event) => event.eventType)).toEqual([
      "BusinessHealthEvaluated",
      "OpportunitiesDetected",
      "BusinessInsightsGenerated",
      "KnowledgeGraphGenerated",
      "BusinessBrainAnalysisCompleted",
    ]);
    await expect(
      store.replayByAggregate("BusinessBrain", businessBrainId)
    ).resolves.toHaveLength(5);
    await expect(
      store.replayByEventType("KnowledgeGraphGenerated")
    ).resolves.toMatchObject([{ eventType: "KnowledgeGraphGenerated" }]);
  });

  it("returns immutable replay output", async () => {
    const store = new InMemoryBusinessBrainIntegrationReplayStore();
    const publisher = new BusinessBrainIntegrationEventPublisher(
      store,
      new BusinessBrainIntegrationEventMapper(
        nextBusinessBrainIntegrationEventId()
      )
    );

    await publisher.publish(sampleEventSources()[2]);

    const replayed = await store.replay();
    const payload = replayed[0]?.payload as {
      readonly insightGenerationResult: {
        readonly insights: readonly unknown[];
      };
    };

    expect(Object.isFrozen(replayed)).toBe(true);
    expect(Object.isFrozen(replayed[0])).toBe(true);
    expect(Object.isFrozen(replayed[0]?.payload)).toBe(true);
    expect(Object.isFrozen(payload.insightGenerationResult.insights)).toBe(true);
  });

  it("exports business brain integration events publicly", () => {
    expect(PublicBusinessBrainIntegrationEventPublisher).toBe(
      BusinessBrainIntegrationEventPublisher
    );
    expect(PublicInMemoryBusinessBrainIntegrationReplayStore).toBe(
      InMemoryBusinessBrainIntegrationReplayStore
    );
  });
});

function nextBusinessBrainIntegrationEventId() {
  let sequence = 0;

  return () => {
    sequence += 1;
    return `business-brain-integration-event-${sequence}` as BusinessBrainIntegrationEventId;
  };
}

function sampleEventSources(): BusinessBrainIntegrationEventSource[] {
  return createBusinessBrainAnalysisIntegrationEventSources({
    businessBrainId,
    businessProfileId,
    businessId,
    analysisResult: sampleAnalysisResult(),
    correlationId,
    causationId,
  }) as BusinessBrainIntegrationEventSource[];
}

function sampleAnalysisResult(): BusinessBrainAnalysisResult {
  return {
    businessHealth: BusinessHealth.create({
      score: 76,
      dimensions: [
        {
          name: "operations",
          score: 76,
          summary: "Operations are strong.",
        },
      ],
      summary: "Business health is strong.",
      evaluatedAt: "2026-06-29T06:00:00.000Z",
    }),
    opportunityDetectionResult: OpportunityDetectionResult.create({
      opportunities: [
        {
          id: "detected-opportunity-1" as DetectedOpportunityId,
          title: "Scale webinar follow-up",
          summary: "Webinar follow-up can create more qualified calls.",
          priority: "high",
          confidence: 0.8,
          source: {
            type: "manual",
            referenceId: "opportunity-1",
            summary: "Existing opportunity.",
          },
          detectedAt: "2026-06-29T07:00:00.000Z",
        },
      ],
      detectedAt: "2026-06-29T07:00:00.000Z",
      summary: "1 opportunity detected.",
    }),
    insightGenerationResult: InsightGenerationResult.create({
      insights: [
        createGeneratedBusinessInsight({
          id: "generated-insight-1" as GeneratedBusinessInsightId,
          title: "Growth opportunity",
          summary: "Opportunity pipeline is improving.",
          category: "growth",
          confidence: 0.8,
          generatedAt: "2026-06-29T08:00:00.000Z",
        }),
      ],
      generatedAt: "2026-06-29T08:00:00.000Z",
      summary: "1 business insight generated.",
    }),
    knowledgeGraphSnapshot: createKnowledgeGraphSnapshot({
      nodes: [
        createKnowledgeNode({
          id: "node-1" as KnowledgeNodeId,
          type: "insight",
          title: "Insight",
          summary: "Insight summary.",
          createdAt: "2026-06-29T08:00:00.000Z",
        }),
        createKnowledgeNode({
          id: "node-2" as KnowledgeNodeId,
          type: "opportunity",
          title: "Opportunity",
          summary: "Opportunity summary.",
          createdAt: "2026-06-29T08:00:00.000Z",
        }),
      ],
      relationships: [
        createKnowledgeRelationship({
          id: "relationship-1" as KnowledgeRelationshipId,
          fromNodeId: "node-1" as KnowledgeNodeId,
          toNodeId: "node-2" as KnowledgeNodeId,
          relationshipType: "influences",
          confidence: 0.75,
          createdAt: "2026-06-29T09:00:00.000Z",
        }),
      ],
      generatedAt: "2026-06-29T09:00:00.000Z",
      summary: "2 nodes and 1 relationship generated.",
    }),
    analyzedAt,
  };
}
