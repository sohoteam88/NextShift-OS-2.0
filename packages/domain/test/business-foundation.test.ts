import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  BusinessFoundation,
  InMemoryBusinessFoundationRepository,
  type BrandDnaId,
  type BusinessFoundationId,
  type BusinessMemoryId,
  type BusinessTimelineEventId,
  type ContentMemoryId,
  type CustomerMemoryId,
  type KnowledgeNodeId,
  type LearningFoundationRecordId,
  type ReflectionFoundationRecordId,
  type StoryVaultItemId,
} from "../src/business-foundation";

const businessId = "business-1" as BusinessId;
const foundationId = "foundation-1" as BusinessFoundationId;
const brandDnaId = "brand-dna-1" as BrandDnaId;
const ownerNodeId = "knowledge-node-owner" as KnowledgeNodeId;
const offerNodeId = "knowledge-node-offer" as KnowledgeNodeId;
const storyId = "story-1" as StoryVaultItemId;
const businessMemoryId = "business-memory-1" as BusinessMemoryId;
const contentMemoryId = "content-memory-1" as ContentMemoryId;
const customerMemoryId = "customer-memory-1" as CustomerMemoryId;
const timelineEventId = "timeline-event-1" as BusinessTimelineEventId;
const learningId = "learning-1" as LearningFoundationRecordId;
const reflectionId = "reflection-1" as ReflectionFoundationRecordId;
const createdAt = "2026-07-08T00:00:00.000Z";

function source() {
  return {
    type: "manual" as const,
    referenceId: "source-1",
    summary: "Founder interview.",
    capturedAt: createdAt,
  };
}

function createFoundation(): BusinessFoundation {
  return BusinessFoundation.create({
    foundationId,
    businessId,
    createdAt,
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

describe("BusinessFoundation aggregate", () => {
  it("creates a Business Twin root context", () => {
    const foundation = createFoundation();

    expect(foundation.toSnapshot()).toMatchObject({
      foundationId,
      businessId,
      twin: {
        name: "NextShift Studio",
        market: "AI business operating systems",
        lifecycleStage: "active",
      },
      knowledgeNodes: [],
      storyVault: [],
      businessMemory: [],
      contentMemory: [],
      customerMemory: [],
      timeline: [],
      learning: [],
      reflections: [],
    });
  });

  it("records all Business Foundation areas with traceable links", () => {
    const foundation = createFoundation();

    foundation.updateBrandDna({
      brandDnaId,
      positioning: "AI guided business operating system for founders.",
      promise: "Every next action is grounded in business context.",
      voice: "clear and pragmatic",
      values: ["clarity", "execution"],
      differentiators: ["business memory", "guided approvals"],
      audienceFit: "Designed for founder-led teams.",
      proofMarkers: ["workflow catalog", "runtime platform"],
      updatedAt: "2026-07-08T01:00:00.000Z",
    });

    foundation.addKnowledgeNode({
      nodeId: ownerNodeId,
      type: "person",
      label: "Founder",
      summary: "Primary operator and decision maker.",
      confidence: 0.95,
      source: source(),
      createdAt: "2026-07-08T02:00:00.000Z",
    });
    foundation.addKnowledgeNode({
      nodeId: offerNodeId,
      type: "offer",
      label: "Guided execution",
      summary: "Platform offer for business execution.",
      confidence: 0.9,
      source: source(),
      createdAt: "2026-07-08T02:05:00.000Z",
    });
    foundation.addKnowledgeRelationship({
      fromNodeId: ownerNodeId,
      toNodeId: offerNodeId,
      relationshipType: "owns",
    });

    foundation.addStory({
      storyId,
      type: "positioning",
      title: "Founder operating system story",
      narrative: "The product helps founders convert knowledge into action.",
      linkedNodeIds: [ownerNodeId, offerNodeId],
      source: source(),
      createdAt: "2026-07-08T03:00:00.000Z",
    });
    foundation.addBusinessMemory({
      memoryId: businessMemoryId,
      title: "Primary priority",
      fact: "The foundation layer must precede Business Brain work.",
      tags: ["priority", "architecture"],
      source: source(),
      createdAt: "2026-07-08T04:00:00.000Z",
    });
    foundation.addContentMemory({
      memoryId: contentMemoryId,
      title: "Content theme",
      theme: "Founder execution clarity",
      observation: "Content should explain the operating loop.",
      linkedStoryIds: [storyId],
      source: source(),
      createdAt: "2026-07-08T05:00:00.000Z",
    });
    foundation.addCustomerMemory({
      memoryId: customerMemoryId,
      segment: "Solo founders",
      need: "Reduce uncertainty about next actions.",
      objection: "Too many AI tools create noise.",
      offerFit: "Guided approvals and memory reduce tool sprawl.",
      source: source(),
      createdAt: "2026-07-08T06:00:00.000Z",
    });
    foundation.addTimelineEvent({
      eventId: timelineEventId,
      type: "milestone",
      title: "Business Architecture frozen",
      occurredAt: "2026-07-08T07:00:00.000Z",
      summary: "Architecture freeze unlocked Business Foundation.",
      source: source(),
    });
    foundation.addLearning({
      learningId,
      signal: "Architecture-first delivery reduced rework.",
      outcome: "Implementation scope is narrower.",
      pattern: "Freeze architecture before product implementation.",
      sourceEventIds: [timelineEventId],
      source: source(),
      createdAt: "2026-07-08T08:00:00.000Z",
    });
    foundation.addReflection({
      reflectionId,
      category: "delivery",
      finding: "Foundation records need source links.",
      interpretation: "Downstream systems should consume, not own, foundation state.",
      sourceLearningIds: [learningId],
      createdAt: "2026-07-08T09:00:00.000Z",
    });

    expect(foundation.toSnapshot()).toMatchObject({
      brandDna: { brandDnaId },
      knowledgeNodes: [{ nodeId: ownerNodeId }, { nodeId: offerNodeId }],
      knowledgeRelationships: [
        {
          fromNodeId: ownerNodeId,
          toNodeId: offerNodeId,
          relationshipType: "owns",
        },
      ],
      storyVault: [{ storyId }],
      businessMemory: [{ memoryId: businessMemoryId }],
      contentMemory: [{ memoryId: contentMemoryId }],
      customerMemory: [{ memoryId: customerMemoryId }],
      timeline: [{ eventId: timelineEventId }],
      learning: [{ learningId }],
      reflections: [{ reflectionId }],
    });
  });

  it("rejects untraceable relationships", () => {
    const foundation = createFoundation();

    expect(() =>
      foundation.addStory({
        storyId,
        type: "origin",
        title: "Missing node story",
        narrative: "This story links to a missing node.",
        linkedNodeIds: [ownerNodeId],
        source: source(),
        createdAt,
      })
    ).toThrow("Knowledge node does not exist.");
  });
});

describe("InMemoryBusinessFoundationRepository", () => {
  it("saves and retrieves a foundation by foundation and business IDs", async () => {
    const repository = new InMemoryBusinessFoundationRepository();
    const foundation = createFoundation();

    await repository.save(foundation);

    expect(await repository.exists(foundationId)).toBe(true);
    expect((await repository.findById(foundationId))?.toSnapshot()).toEqual(
      foundation.toSnapshot()
    );
    expect((await repository.findByBusinessId(businessId))?.foundationId).toBe(
      foundationId
    );
  });
});
