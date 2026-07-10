import {
  InMemoryBusinessFoundationRepository,
  type BusinessFoundationDomainEvent,
  type BusinessFoundationId,
  type BrandDnaId,
  type KnowledgeNodeId,
  type StoryVaultItemId,
  type BusinessMemoryId,
  type ContentMemoryId,
  type CustomerMemoryId,
  type BusinessTimelineEventId,
  type LearningFoundationRecordId,
  type ReflectionFoundationRecordId,
} from "@nextshift/domain";
import type {
  BusinessId,
  CorrelationId,
  EventId,
  TenantId,
} from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  BusinessFoundationApplicationService,
  type BusinessFoundationEventPublisher,
} from "../src/business-foundation";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const correlationId = "correlation-1" as CorrelationId;
const foundationId = "foundation-1" as BusinessFoundationId;
const eventId = "event-1" as EventId;
const brandDnaId = "brand-dna-1" as BrandDnaId;
const nodeId = "knowledge-node-1" as KnowledgeNodeId;
const storyId = "story-1" as StoryVaultItemId;
const businessMemoryId = "business-memory-1" as BusinessMemoryId;
const contentMemoryId = "content-memory-1" as ContentMemoryId;
const customerMemoryId = "customer-memory-1" as CustomerMemoryId;
const timelineEventId = "timeline-event-1" as BusinessTimelineEventId;
const learningId = "learning-1" as LearningFoundationRecordId;
const reflectionId = "reflection-1" as ReflectionFoundationRecordId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingBusinessFoundationEventPublisher
  implements BusinessFoundationEventPublisher
{
  readonly events: BusinessFoundationDomainEvent[] = [];

  async publish(event: BusinessFoundationDomainEvent): Promise<void> {
    this.events.push(event);
  }
}

function source(capturedAt = "2026-07-08T00:00:00.000Z") {
  return {
    type: "manual" as const,
    referenceId: "source-1",
    summary: "Founder interview.",
    capturedAt,
  };
}

function createService() {
  const repository = new InMemoryBusinessFoundationRepository();
  const publisher = new RecordingBusinessFoundationEventPublisher();
  const timestamps = [
    "2026-07-08T00:00:00.000Z",
    "2026-07-08T01:00:00.000Z",
    "2026-07-08T02:00:00.000Z",
    "2026-07-08T03:00:00.000Z",
    "2026-07-08T04:00:00.000Z",
    "2026-07-08T05:00:00.000Z",
    "2026-07-08T06:00:00.000Z",
    "2026-07-08T07:00:00.000Z",
    "2026-07-08T08:00:00.000Z",
    "2026-07-08T09:00:00.000Z",
    "2026-07-08T10:00:00.000Z",
    "2026-07-08T11:00:00.000Z",
  ];
  const service = new BusinessFoundationApplicationService(
    repository,
    publisher,
    () => timestamps.shift() ?? "2026-07-08T12:00:00.000Z",
    () => eventId,
    () => foundationId
  );

  return { publisher, repository, service };
}

async function createFoundation(service: BusinessFoundationApplicationService) {
  return service.createBusinessFoundation({
    commandType: "CreateBusinessFoundation",
    context,
    foundationId,
    twin: {
      name: "NextShift Studio",
      market: "AI business operating systems",
      audience: "solo founders",
      offer: "guided business execution platform",
      valueProposition: "Turn business context into approved execution.",
      goals: ["Launch foundation layer"],
      priorities: ["Capture durable business facts"],
      lifecycleStage: "active",
    },
  });
}

describe("BusinessFoundationApplicationService", () => {
  it("creates a foundation and records the ten foundation areas", async () => {
    const { publisher, repository, service } = createService();

    const created = await createFoundation(service);

    expect(created.ok).toBe(true);
    expect(await repository.exists(foundationId)).toBe(true);

    await service.updateBrandDna({
      commandType: "UpdateBusinessFoundationBrandDna",
      context,
      foundationId,
      brandDna: {
        brandDnaId,
        positioning: "AI guided business operating system.",
        promise: "Every next action is grounded in business context.",
        voice: "clear and pragmatic",
        values: ["clarity"],
        differentiators: ["business memory"],
        audienceFit: "Founder-led teams.",
        proofMarkers: ["workflow catalog"],
      },
    });
    await service.addKnowledgeNode({
      commandType: "AddBusinessFoundationKnowledgeNode",
      context,
      foundationId,
      node: {
        nodeId,
        type: "business",
        label: "NextShift Studio",
        summary: "The operating business.",
        confidence: 0.95,
        source: source(),
        createdAt: "2026-07-08T02:00:00.000Z",
      },
    });
    await service.addStory({
      commandType: "AddBusinessFoundationStory",
      context,
      foundationId,
      story: {
        storyId,
        type: "origin",
        title: "Origin story",
        narrative: "The product began as a guided operating system.",
        linkedNodeIds: [nodeId],
        source: source(),
        createdAt: "2026-07-08T03:00:00.000Z",
      },
    });
    await service.recordBusinessMemory({
      commandType: "RecordBusinessFoundationBusinessMemory",
      context,
      foundationId,
      memory: {
        memoryId: businessMemoryId,
        title: "Architecture prerequisite",
        fact: "Business Architecture v1.0 is frozen.",
        tags: ["architecture"],
        source: source(),
        createdAt: "2026-07-08T04:00:00.000Z",
      },
    });
    await service.recordContentMemory({
      commandType: "RecordBusinessFoundationContentMemory",
      context,
      foundationId,
      memory: {
        memoryId: contentMemoryId,
        title: "Content theme",
        theme: "Operating loop",
        observation: "Explain understand-decide-create-execute-measure-learn.",
        linkedStoryIds: [storyId],
        source: source(),
        createdAt: "2026-07-08T05:00:00.000Z",
      },
    });
    await service.recordCustomerMemory({
      commandType: "RecordBusinessFoundationCustomerMemory",
      context,
      foundationId,
      memory: {
        memoryId: customerMemoryId,
        segment: "Solo founders",
        need: "Clarity on what to do next.",
        offerFit: "Guided next actions.",
        source: source(),
        createdAt: "2026-07-08T06:00:00.000Z",
      },
    });
    await service.recordTimelineEvent({
      commandType: "RecordBusinessFoundationTimelineEvent",
      context,
      foundationId,
      event: {
        eventId: timelineEventId,
        type: "milestone",
        title: "BA freeze",
        occurredAt: "2026-07-08T07:00:00.000Z",
        summary: "Business Architecture v1.0 was frozen.",
        source: source(),
      },
    });
    await service.recordLearning({
      commandType: "RecordBusinessFoundationLearning",
      context,
      foundationId,
      learning: {
        learningId,
        signal: "Architecture freeze reduced implementation ambiguity.",
        outcome: "Business Foundation can begin.",
        pattern: "Architecture precedes implementation.",
        sourceEventIds: [timelineEventId],
        source: source(),
        createdAt: "2026-07-08T08:00:00.000Z",
      },
    });
    const reflected = await service.recordReflection({
      commandType: "RecordBusinessFoundationReflection",
      context,
      foundationId,
      reflection: {
        reflectionId,
        category: "delivery",
        finding: "Foundation state must remain durable.",
        interpretation: "Downstream systems should read foundation records.",
        sourceLearningIds: [learningId],
        createdAt: "2026-07-08T09:00:00.000Z",
      },
    });

    expect(reflected.ok).toBe(true);
    const found = await service.getBusinessFoundation({
      queryType: "GetBusinessFoundation",
      context,
      foundationId,
    });

    expect(found.foundation?.toSnapshot()).toMatchObject({
      brandDna: { brandDnaId },
      knowledgeNodes: [{ nodeId }],
      storyVault: [{ storyId }],
      businessMemory: [{ memoryId: businessMemoryId }],
      contentMemory: [{ memoryId: contentMemoryId }],
      customerMemory: [{ memoryId: customerMemoryId }],
      timeline: [{ eventId: timelineEventId }],
      learning: [{ learningId }],
      reflections: [{ reflectionId }],
    });
    expect(publisher.events.map((event) => event.eventType)).toEqual([
      "BusinessFoundationCreated",
      "BusinessFoundationBrandDnaUpdated",
      "BusinessFoundationRecordAdded",
      "BusinessFoundationRecordAdded",
      "BusinessFoundationRecordAdded",
      "BusinessFoundationRecordAdded",
      "BusinessFoundationRecordAdded",
      "BusinessFoundationRecordAdded",
      "BusinessFoundationRecordAdded",
      "BusinessFoundationRecordAdded",
    ]);
  });

  it("rejects missing and foreign foundation access", async () => {
    const { service } = createService();

    const missing = await service.recordBusinessMemory({
      commandType: "RecordBusinessFoundationBusinessMemory",
      context,
      foundationId,
      memory: {
        memoryId: businessMemoryId,
        title: "Missing foundation",
        fact: "This should fail.",
        tags: ["missing"],
        source: source(),
        createdAt: "2026-07-08T04:00:00.000Z",
      },
    });

    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.error.code).toBe("BusinessFoundationNotFound");
    }

    await createFoundation(service);

    const foreign = await service.updateBrandDna({
      commandType: "UpdateBusinessFoundationBrandDna",
      context: {
        ...context,
        businessId: otherBusinessId,
      },
      foundationId,
      brandDna: {
        brandDnaId,
        positioning: "Wrong business",
        promise: "Wrong business",
        voice: "Wrong business",
        values: ["wrong"],
        differentiators: ["wrong"],
        audienceFit: "Wrong business",
        proofMarkers: ["wrong"],
      },
    });

    expect(foreign.ok).toBe(false);
    if (!foreign.ok) {
      expect(foreign.error.code).toBe("ValidationFailed");
    }
  });
});
