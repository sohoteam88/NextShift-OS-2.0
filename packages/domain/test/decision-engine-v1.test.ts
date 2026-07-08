import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  BusinessBrainV1,
  type BusinessBrainV1Id,
} from "../src/business-brain-v1";
import {
  BusinessFoundation,
  type BrandDnaId,
  type BusinessFoundationId,
  type BusinessMemoryId,
  type CustomerMemoryId,
  type KnowledgeNodeId,
} from "../src/business-foundation";
import {
  DecisionEngineV1,
  InMemoryDecisionEngineV1Repository,
  type DecisionEngineV1Id,
} from "../src/decision-engine-v1";

const businessId = "business-1" as BusinessId;
const foundationId = "foundation-1" as BusinessFoundationId;
const brainId = "brain-1" as BusinessBrainV1Id;
const engineId = "engine-1" as DecisionEngineV1Id;
const brandDnaId = "brand-dna-1" as BrandDnaId;
const knowledgeNodeId = "knowledge-node-1" as KnowledgeNodeId;
const businessMemoryId = "business-memory-1" as BusinessMemoryId;
const customerMemoryId = "customer-memory-1" as CustomerMemoryId;
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
      goals: ["Launch Decision Engine"],
      priorities: ["Prioritize next actions"],
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
    fact: "Business Brain v1.0 is implemented.",
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

  return foundation;
}

function createBrain() {
  return BusinessBrainV1.create({
    brainId,
    foundation: createFoundation().toSnapshot(),
    createdAt,
  });
}

function createSparseBrain() {
  const foundation = BusinessFoundation.create({
    foundationId,
    businessId,
    createdAt,
    twin: {
      name: "Early Stage Studio",
      market: "AI business operating systems",
      audience: "solo founders",
      offer: "guided business execution platform",
      valueProposition: "Turn business context into approved execution.",
      goals: ["Launch Decision Engine"],
      priorities: ["Prioritize next actions"],
      lifecycleStage: "active",
    },
  });

  return BusinessBrainV1.create({
    brainId,
    foundation: foundation.toSnapshot(),
    createdAt,
  });
}

describe("DecisionEngineV1 aggregate", () => {
  it("creates recommendations, signals, health evaluation, and coach guidance from Business Brain output", () => {
    const brain = createBrain();
    const brainBefore = brain.toSnapshot();
    const engine = DecisionEngineV1.create({
      engineId,
      brain: brainBefore,
      createdAt,
    });
    const snapshot = engine.toSnapshot();

    expect(snapshot).toMatchObject({
      engineId,
      businessId,
      brainId,
      healthEvaluation: {
        operatingHealth: "developing",
        strategicClarity: "high",
      },
      coachGuidance: {
        suggestedUserReview: brainBefore.interpretation.rationale,
      },
    });
    expect(snapshot.recommendations.length).toBeGreaterThan(0);
    expect(snapshot.opportunities.length).toBeGreaterThan(0);
    expect(snapshot.gaps).toHaveLength(0);
    expect(snapshot.recommendations[0]?.priorityScore.priority).toMatch(
      /high|critical/
    );
    expect(snapshot.recommendations[0]?.confidenceScore.score).toBeGreaterThan(
      0
    );
    expect(snapshot.recommendations[0]?.explanation.evidence.length).toBeGreaterThan(
      0
    );
    expect(brain.toSnapshot()).toEqual(brainBefore);
  });

  it("detects gaps from sparse Business Brain output", () => {
    const engine = DecisionEngineV1.create({
      engineId,
      brain: createSparseBrain().toSnapshot(),
      createdAt,
    });

    expect(engine.toSnapshot().gaps.length).toBeGreaterThan(0);
  });

  it("supports recommendation lifecycle transitions", () => {
    const engine = DecisionEngineV1.create({
      engineId,
      brain: createBrain().toSnapshot(),
      createdAt,
    });
    const recommendationId = engine.toSnapshot().recommendations[0]
      ?.recommendationId;

    expect(recommendationId).toBeDefined();
    if (!recommendationId) return;

    engine.reviewRecommendation(recommendationId, "2026-07-08T01:00:00.000Z");
    expect(engine.toSnapshot().recommendations[0]?.lifecycleStatus).toBe(
      "reviewed"
    );

    engine.acceptRecommendation(recommendationId, "2026-07-08T02:00:00.000Z");
    expect(engine.toSnapshot().recommendations[0]?.lifecycleStatus).toBe(
      "accepted"
    );

    engine.supersedeRecommendation(
      recommendationId,
      "2026-07-08T03:00:00.000Z"
    );
    expect(engine.toSnapshot().recommendations[0]?.lifecycleStatus).toBe(
      "superseded"
    );

    engine.archiveRecommendation(recommendationId, "2026-07-08T04:00:00.000Z");
    expect(engine.toSnapshot().recommendations[0]?.lifecycleStatus).toBe(
      "archived"
    );
  });
});

describe("InMemoryDecisionEngineV1Repository", () => {
  it("saves and retrieves Decision Engine outputs by business and brain", async () => {
    const repository = new InMemoryDecisionEngineV1Repository();
    const engine = DecisionEngineV1.create({
      engineId,
      brain: createBrain().toSnapshot(),
      createdAt,
    });

    await repository.save(engine);

    expect(await repository.exists(engineId)).toBe(true);
    expect((await repository.findById(engineId))?.toSnapshot()).toEqual(
      engine.toSnapshot()
    );
    expect(await repository.findByBusinessId(businessId)).toHaveLength(1);
    expect((await repository.findLatestByBrainId(brainId))?.engineId).toBe(
      engineId
    );
  });
});
