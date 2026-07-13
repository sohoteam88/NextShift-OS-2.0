import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  BusinessBrainV1,
  type BusinessBrainV1Id,
} from "../src/business-brain-v1";
import {
  BusinessCommandCenterV1,
  InMemoryBusinessCommandCenterV1Repository,
  calculateBusinessScore,
  normalizeReadinessScore,
  type BusinessCommandCenterV1Id,
} from "../src/business-command-center-v1";
import {
  BusinessFoundation,
  type BrandDnaId,
  type BusinessFoundationId,
  type CustomerMemoryId,
} from "../src/business-foundation";
import {
  ConversationEngineV1,
  type ConversationEngineV1Id,
} from "../src/conversation-engine-v1";
import {
  CreativeStudioV1,
  type CreativeStudioV1Id,
} from "../src/creative-studio-v1";
import {
  DecisionEngineV1,
  type DecisionEngineV1Id,
} from "../src/decision-engine-v1";
import {
  GrowthRevenueV1,
  type GrowthRevenueV1Id,
} from "../src/growth-revenue-v1";

const businessId = "business-1" as BusinessId;
const foundationId = "foundation-1" as BusinessFoundationId;
const brainId = "brain-1" as BusinessBrainV1Id;
const engineId = "engine-1" as DecisionEngineV1Id;
const conversationId = "conversation-1" as ConversationEngineV1Id;
const creativeStudioId = "creative-studio-1" as CreativeStudioV1Id;
const growthRevenueId = "growth-revenue-1" as GrowthRevenueV1Id;
const commandCenterId = "command-center-1" as BusinessCommandCenterV1Id;
const brandDnaId = "brand-dna-1" as BrandDnaId;
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
      offer: "guided revenue execution platform",
      valueProposition: "Turn approved creative into measurable revenue.",
      goals: ["Launch Command Center"],
      priorities: ["Focus daily operating actions"],
      lifecycleStage: "active",
    },
  });

  foundation.updateBrandDna({
    brandDnaId,
    positioning: "AI guided business operating system.",
    promise: "Every daily action is grounded in business context.",
    voice: "clear and pragmatic",
    values: ["clarity"],
    differentiators: ["business memory"],
    audienceFit: "Founder-led teams.",
    proofMarkers: ["workflow catalog"],
    updatedAt: "2026-07-08T01:00:00.000Z",
  });
  foundation.addCustomerMemory({
    memoryId: customerMemoryId,
    segment: "Solo founders",
    need: "Know what to do today.",
    offerFit: "Guided command center.",
    source: source(),
    createdAt: "2026-07-08T02:00:00.000Z",
  });

  return foundation;
}

function createUpstream() {
  const foundation = createFoundation();
  const brain = BusinessBrainV1.create({
    brainId,
    foundation: foundation.toSnapshot(),
    createdAt,
  });
  const decisionEngine = DecisionEngineV1.create({
    engineId,
    brain: brain.toSnapshot(),
    createdAt,
  });
  const conversation = ConversationEngineV1.create({
    conversationId,
    foundation: foundation.toSnapshot(),
    brain: brain.toSnapshot(),
    decisionEngine: decisionEngine.toSnapshot(),
    createdAt,
  });
  conversation.approve({
    rationale: "Approved for Business Command Center.",
    actorReference: "user-1",
    executionHandoffIntent: "Create daily command center focus records.",
    decidedAt: "2026-07-08T03:00:00.000Z",
  });
  const creativeStudio = CreativeStudioV1.create({
    creativeStudioId,
    foundation: foundation.toSnapshot(),
    brain: brain.toSnapshot(),
    decisionEngine: decisionEngine.toSnapshot(),
    conversation: conversation.toSnapshot(),
    createdAt,
  });
  creativeStudio.packageForHandoff("2026-07-08T04:00:00.000Z");
  const growthRevenue = GrowthRevenueV1.create({
    growthRevenueId,
    foundation: foundation.toSnapshot(),
    brain: brain.toSnapshot(),
    decisionEngine: decisionEngine.toSnapshot(),
    conversation: conversation.toSnapshot(),
    creativeStudio: creativeStudio.toSnapshot(),
    createdAt,
  });

  return {
    foundation,
    brain,
    decisionEngine,
    conversation,
    creativeStudio,
    growthRevenue,
  };
}

describe("Business Score policy", () => {
  it("normalizes unit and percentage readiness inputs consistently", () => {
    expect(normalizeReadinessScore(0.6)).toBe(60);
    expect(normalizeReadinessScore(60)).toBe(60);
    expect(
      calculateBusinessScore({ readinessScore: 0.6, forecastConfidence: 0.8 })
    ).toEqual(
      calculateBusinessScore({ readinessScore: 60, forecastConfidence: 0.8 })
    );
  });

  it.each([
    [59, "needs_attention"],
    [60, "ready"],
    [79, "ready"],
    [80, "strong"],
  ] as const)("assigns %s to the %s band", (scoreValue, scoreBand) => {
    expect(
      calculateBusinessScore({
        readinessScore: scoreValue,
        forecastConfidence: scoreValue / 100,
      })
    ).toEqual({ scoreValue, scoreBand });
  });
});

describe("BusinessCommandCenterV1 aggregate", () => {
  it("creates mission, score, recommendation feed, forecasts, opportunity, readiness, health, lifecycle, and integration outputs", () => {
    const {
      foundation,
      brain,
      decisionEngine,
      conversation,
      creativeStudio,
      growthRevenue,
    } = createUpstream();
    const foundationBefore = foundation.toSnapshot();
    const brainBefore = brain.toSnapshot();
    const decisionBefore = decisionEngine.toSnapshot();
    const conversationBefore = conversation.toSnapshot();
    const creativeBefore = creativeStudio.toSnapshot();
    const growthBefore = growthRevenue.toSnapshot();

    const commandCenter = BusinessCommandCenterV1.create({
      commandCenterId,
      foundation: foundationBefore,
      brain: brainBefore,
      decisionEngine: decisionBefore,
      conversation: conversationBefore,
      creativeStudio: creativeBefore,
      growthRevenue: growthBefore,
      createdAt,
    });
    const snapshot = commandCenter.toSnapshot();
    const expectedScore = calculateBusinessScore({
      readinessScore: decisionBefore.healthEvaluation.readinessScore,
      forecastConfidence: growthBefore.revenueForecast.confidence,
    });

    expect(snapshot).toMatchObject({
      commandCenterId,
      businessId,
      foundationId,
      brainId,
      engineId,
      conversationId,
      creativeStudioId,
      growthRevenueId,
      lifecycleStatus: "drafted",
      sourceContext: {
        businessName: "NextShift Studio",
      },
    });
    expect(snapshot.todaysMission.primaryObjective).toBeTruthy();
    expect(snapshot.businessScore).toEqual({
      scoreId: `${commandCenterId}:score:business`,
      ...expectedScore,
      factors: [
        decisionBefore.healthEvaluation.summary,
        `Forecast confidence ${growthBefore.revenueForecast.confidence}`,
        `Lead fit ${growthBefore.leadIntelligence.fit}`,
      ],
      confidence: growthBefore.revenueForecast.confidence,
      explanation: "Score combines decision readiness with current growth forecast confidence.",
      healthReference: decisionBefore.healthEvaluation.summary,
      growthReference: growthRevenueId,
    });
    expect(snapshot.aiRecommendationFeed.length).toBeGreaterThan(0);
    expect(snapshot.revenueForecastView.forecastAmount).toBeGreaterThan(0);
    expect(snapshot.leadForecastView.nextRecommendedAction).toBeTruthy();
    expect(snapshot.todaysOpportunity.urgency).toMatch(/today|scheduled/);
    expect(snapshot.actionReadinessSummary.readinessRationale).toContain(
      "without triggering execution"
    );
    expect(snapshot.businessHealthSnapshot.evidenceReferences.length).toBeGreaterThan(0);
    expect(snapshot.integration.recommendationFeedItemIds.length).toBeGreaterThan(0);
    expect(foundation.toSnapshot()).toEqual(foundationBefore);
    expect(brain.toSnapshot()).toEqual(brainBefore);
    expect(decisionEngine.toSnapshot()).toEqual(decisionBefore);
    expect(conversation.toSnapshot()).toEqual(conversationBefore);
    expect(creativeStudio.toSnapshot()).toEqual(creativeBefore);
    expect(growthRevenue.toSnapshot()).toEqual(growthBefore);
  });

  it("supports command center lifecycle transitions", () => {
    const {
      foundation,
      brain,
      decisionEngine,
      conversation,
      creativeStudio,
      growthRevenue,
    } = createUpstream();
    const commandCenter = BusinessCommandCenterV1.create({
      commandCenterId,
      foundation: foundation.toSnapshot(),
      brain: brain.toSnapshot(),
      decisionEngine: decisionEngine.toSnapshot(),
      conversation: conversation.toSnapshot(),
      creativeStudio: creativeStudio.toSnapshot(),
      growthRevenue: growthRevenue.toSnapshot(),
      createdAt,
    });

    commandCenter.review("2026-07-08T01:00:00.000Z");
    expect(commandCenter.toSnapshot().lifecycleStatus).toBe("reviewed");

    commandCenter.activate("2026-07-08T02:00:00.000Z");
    expect(commandCenter.toSnapshot().lifecycleStatus).toBe("active");

    commandCenter.resolve("2026-07-08T03:00:00.000Z");
    expect(commandCenter.toSnapshot().lifecycleStatus).toBe("resolved");

    commandCenter.archive("2026-07-08T04:00:00.000Z");
    expect(commandCenter.toSnapshot().lifecycleStatus).toBe("archived");
  });
});

describe("InMemoryBusinessCommandCenterV1Repository", () => {
  it("saves and retrieves Business Command Center outputs by business and Growth & Revenue", async () => {
    const repository = new InMemoryBusinessCommandCenterV1Repository();
    const {
      foundation,
      brain,
      decisionEngine,
      conversation,
      creativeStudio,
      growthRevenue,
    } = createUpstream();
    const commandCenter = BusinessCommandCenterV1.create({
      commandCenterId,
      foundation: foundation.toSnapshot(),
      brain: brain.toSnapshot(),
      decisionEngine: decisionEngine.toSnapshot(),
      conversation: conversation.toSnapshot(),
      creativeStudio: creativeStudio.toSnapshot(),
      growthRevenue: growthRevenue.toSnapshot(),
      createdAt,
    });

    await repository.save(commandCenter);

    expect(await repository.exists(commandCenterId)).toBe(true);
    expect((await repository.findById(commandCenterId))?.toSnapshot()).toEqual(
      commandCenter.toSnapshot()
    );
    expect(await repository.findByBusinessId(businessId)).toHaveLength(1);
    expect(
      (await repository.findLatestByGrowthRevenueId(growthRevenueId))
        ?.commandCenterId
    ).toBe(commandCenterId);
  });
});
