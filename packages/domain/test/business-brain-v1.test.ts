import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  BusinessBrainV1,
  InMemoryBusinessBrainV1Repository,
  type BusinessBrainV1Id,
} from "../src/business-brain-v1";
import {
  BusinessFoundation,
  type BrandDnaId,
  type BusinessFoundationId,
  type BusinessMemoryId,
  type BusinessTimelineEventId,
  type CustomerMemoryId,
  type KnowledgeNodeId,
  type LearningFoundationRecordId,
  type ReflectionFoundationRecordId,
} from "../src/business-foundation";

const businessId = "business-1" as BusinessId;
const foundationId = "foundation-1" as BusinessFoundationId;
const brainId = "brain-1" as BusinessBrainV1Id;
const brandDnaId = "brand-dna-1" as BrandDnaId;
const knowledgeNodeId = "knowledge-node-1" as KnowledgeNodeId;
const businessMemoryId = "business-memory-1" as BusinessMemoryId;
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
  const foundation = BusinessFoundation.create({
    foundationId,
    businessId,
    createdAt,
    twin: {
      name: "NextShift Studio",
      market: "AI business operating systems",
      audience: "solo founders",
      offer: "guided business execution platform",
      valueProposition: "Turn business context into approved execution.",
      goals: ["Launch Business Brain"],
      priorities: ["Interpret foundation facts"],
      lifecycleStage: "active",
    },
  });

  foundation.updateBrandDna({
    brandDnaId,
    positioning: "AI guided business operating system.",
    promise: "Every next action is grounded in business context.",
    voice: "clear and pragmatic",
    values: ["clarity"],
    differentiators: ["business memory"],
    audienceFit: "Founder-led teams.",
    proofMarkers: ["workflow catalog"],
    updatedAt: "2026-07-08T01:00:00.000Z",
  });
  foundation.addKnowledgeNode({
    nodeId: knowledgeNodeId,
    type: "business",
    label: "NextShift Studio",
    summary: "The operating business.",
    confidence: 0.95,
    source: source(),
    createdAt: "2026-07-08T02:00:00.000Z",
  });
  foundation.addBusinessMemory({
    memoryId: businessMemoryId,
    title: "Release state",
    fact: "Business Foundation v1.0 is released.",
    tags: ["release"],
    source: source(),
    createdAt: "2026-07-08T03:00:00.000Z",
  });
  foundation.addCustomerMemory({
    memoryId: customerMemoryId,
    segment: "Solo founders",
    need: "Know what to do next.",
    offerFit: "Guided operating system.",
    source: source(),
    createdAt: "2026-07-08T04:00:00.000Z",
  });
  foundation.addTimelineEvent({
    eventId: timelineEventId,
    type: "milestone",
    title: "Foundation release",
    occurredAt: "2026-07-08T05:00:00.000Z",
    summary: "Business Foundation released.",
    source: source(),
  });
  foundation.addLearning({
    learningId,
    signal: "Architecture-first delivery reduced ambiguity.",
    outcome: "Business Brain can consume facts.",
    pattern: "Facts precede intelligence.",
    sourceEventIds: [timelineEventId],
    source: source(),
    createdAt: "2026-07-08T06:00:00.000Z",
  });
  foundation.addReflection({
    reflectionId,
    category: "delivery",
    finding: "Business Brain should not own facts.",
    interpretation: "It should read foundation evidence.",
    sourceLearningIds: [learningId],
    createdAt: "2026-07-08T07:00:00.000Z",
  });

  return foundation;
}

describe("BusinessBrainV1 aggregate", () => {
  it("creates understanding, assessment, situation, interpretation, and insights from Foundation facts", () => {
    const foundation = createFoundation();
    const foundationBefore = foundation.toSnapshot();
    const brain = BusinessBrainV1.create({
      brainId,
      foundation: foundationBefore,
      createdAt,
    });

    expect(brain.toSnapshot()).toMatchObject({
      brainId,
      businessId,
      foundationId,
      lifecycleStatus: "interpreted",
      context: {
        businessName: "NextShift Studio",
        brandPositioning: "AI guided business operating system.",
      },
      understanding: {
        summary:
          "NextShift Studio serves solo founders in AI business operating systems with guided business execution platform.",
        confidence: 0.85,
      },
      stateAssessment: {
        operatingHealth: "strong",
        strategicClarity: "high",
      },
      interpretation: {
        downstreamImplications: [
          "Decision Engine can consume readiness, gaps, constraints, and insights later.",
          "Conversation Engine can ask for missing evidence later.",
        ],
      },
    });
    expect(brain.toSnapshot().reasoningPipeline.steps.map((step) => step.name)).toEqual([
      "Business Context Resolution",
      "Business State Assessment",
      "Business Situation Analysis",
      "Business Interpretation",
    ]);
    expect(brain.toSnapshot().insights.length).toBeGreaterThan(0);
    expect(foundation.toSnapshot()).toEqual(foundationBefore);
  });

  it("supports intelligence lifecycle transitions", () => {
    const brain = BusinessBrainV1.create({
      brainId,
      foundation: createFoundation().toSnapshot(),
      createdAt,
    });

    brain.supersede("2026-07-08T08:00:00.000Z");
    expect(brain.lifecycleStatus).toBe("superseded");

    brain.archive("2026-07-08T09:00:00.000Z");
    expect(brain.lifecycleStatus).toBe("archived");
  });
});

describe("InMemoryBusinessBrainV1Repository", () => {
  it("saves and retrieves Business Brain outputs by business and foundation", async () => {
    const repository = new InMemoryBusinessBrainV1Repository();
    const brain = BusinessBrainV1.create({
      brainId,
      foundation: createFoundation().toSnapshot(),
      createdAt,
    });

    await repository.save(brain);

    expect(await repository.exists(brainId)).toBe(true);
    expect((await repository.findById(brainId))?.toSnapshot()).toEqual(
      brain.toSnapshot()
    );
    expect(await repository.findByBusinessId(businessId)).toHaveLength(1);
    expect(
      (await repository.findLatestByFoundationId(foundationId))?.brainId
    ).toBe(brainId);
  });
});
