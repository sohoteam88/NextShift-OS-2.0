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
  InMemoryGrowthRevenueV1Repository,
  type GrowthRevenueV1Id,
} from "../src/growth-revenue-v1";

const businessId = "business-1" as BusinessId;
const foundationId = "foundation-1" as BusinessFoundationId;
const brainId = "brain-1" as BusinessBrainV1Id;
const engineId = "engine-1" as DecisionEngineV1Id;
const conversationId = "conversation-1" as ConversationEngineV1Id;
const creativeStudioId = "creative-studio-1" as CreativeStudioV1Id;
const growthRevenueId = "growth-revenue-1" as GrowthRevenueV1Id;
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
      goals: ["Launch Growth & Revenue"],
      priorities: ["Convert qualified leads"],
      lifecycleStage: "active",
    },
  });

  foundation.updateBrandDna({
    brandDnaId,
    positioning: "AI guided business operating system.",
    promise: "Every revenue action is grounded in business context.",
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
    need: "Convert approved creative into qualified pipeline.",
    offerFit: "Guided revenue system.",
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
    rationale: "Approved for Creative Studio.",
    actorReference: "user-1",
    executionHandoffIntent: "Create growth and revenue planning records.",
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

  return { foundation, brain, decisionEngine, conversation, creativeStudio };
}

describe("GrowthRevenueV1 aggregate", () => {
  it("creates funnel, lead, CRM, opportunity, forecast, follow-up, conversion, recommendation, lifecycle, and integration outputs", () => {
    const { foundation, brain, decisionEngine, conversation, creativeStudio } =
      createUpstream();
    const foundationBefore = foundation.toSnapshot();
    const brainBefore = brain.toSnapshot();
    const decisionBefore = decisionEngine.toSnapshot();
    const conversationBefore = conversation.toSnapshot();
    const creativeBefore = creativeStudio.toSnapshot();

    const growthRevenue = GrowthRevenueV1.create({
      growthRevenueId,
      foundation: foundationBefore,
      brain: brainBefore,
      decisionEngine: decisionBefore,
      conversation: conversationBefore,
      creativeStudio: creativeBefore,
      createdAt,
    });
    const snapshot = growthRevenue.toSnapshot();

    expect(snapshot).toMatchObject({
      growthRevenueId,
      businessId,
      foundationId,
      brainId,
      engineId,
      conversationId,
      creativeStudioId,
      lifecycleStatus: "planned",
      sourceContext: {
        businessName: "NextShift Studio",
      },
    });
    expect(snapshot.funnelIntelligence.stages).toContain("qualification");
    expect(snapshot.leadIntelligence.fit).toMatch(/medium|high/);
    expect(snapshot.crmIntelligence.nextStepRecommendation).toBeTruthy();
    expect(snapshot.opportunityPipeline.stage).toBe("qualified");
    expect(snapshot.revenueForecast.forecastAmount).toBeGreaterThan(0);
    expect(snapshot.followUpIntelligence.status).toBe("planned");
    expect(snapshot.conversionOptimization.experimentIdea).toContain("creative");
    expect(snapshot.growthRecommendations.length).toBeGreaterThan(0);
    expect(snapshot.integration.growthRecommendationIds.length).toBeGreaterThan(0);
    expect(foundation.toSnapshot()).toEqual(foundationBefore);
    expect(brain.toSnapshot()).toEqual(brainBefore);
    expect(decisionEngine.toSnapshot()).toEqual(decisionBefore);
    expect(conversation.toSnapshot()).toEqual(conversationBefore);
    expect(creativeStudio.toSnapshot()).toEqual(creativeBefore);
  });

  it("supports revenue lifecycle transitions", () => {
    const { foundation, brain, decisionEngine, conversation, creativeStudio } =
      createUpstream();
    const growthRevenue = GrowthRevenueV1.create({
      growthRevenueId,
      foundation: foundation.toSnapshot(),
      brain: brain.toSnapshot(),
      decisionEngine: decisionEngine.toSnapshot(),
      conversation: conversation.toSnapshot(),
      creativeStudio: creativeStudio.toSnapshot(),
      createdAt,
    });

    growthRevenue.activate("2026-07-08T01:00:00.000Z");
    expect(growthRevenue.toSnapshot().lifecycleStatus).toBe("active");

    growthRevenue.review("2026-07-08T02:00:00.000Z");
    expect(growthRevenue.toSnapshot().lifecycleStatus).toBe("reviewing");

    growthRevenue.markForecasted("2026-07-08T03:00:00.000Z");
    expect(growthRevenue.toSnapshot().lifecycleStatus).toBe("forecasted");
    expect(growthRevenue.toSnapshot().revenueForecast.reviewState).toBe(
      "reviewed"
    );

    growthRevenue.markWon("2026-07-08T04:00:00.000Z");
    expect(growthRevenue.toSnapshot().lifecycleStatus).toBe("won");

    growthRevenue.markLost("2026-07-08T05:00:00.000Z");
    expect(growthRevenue.toSnapshot().lifecycleStatus).toBe("lost");

    growthRevenue.archive("2026-07-08T06:00:00.000Z");
    expect(growthRevenue.toSnapshot().lifecycleStatus).toBe("archived");
  });
});

describe("InMemoryGrowthRevenueV1Repository", () => {
  it("saves and retrieves Growth & Revenue outputs by business and Creative Studio", async () => {
    const repository = new InMemoryGrowthRevenueV1Repository();
    const { foundation, brain, decisionEngine, conversation, creativeStudio } =
      createUpstream();
    const growthRevenue = GrowthRevenueV1.create({
      growthRevenueId,
      foundation: foundation.toSnapshot(),
      brain: brain.toSnapshot(),
      decisionEngine: decisionEngine.toSnapshot(),
      conversation: conversation.toSnapshot(),
      creativeStudio: creativeStudio.toSnapshot(),
      createdAt,
    });

    await repository.save(growthRevenue);

    expect(await repository.exists(growthRevenueId)).toBe(true);
    expect((await repository.findById(growthRevenueId))?.toSnapshot()).toEqual(
      growthRevenue.toSnapshot()
    );
    expect(await repository.findByBusinessId(businessId)).toHaveLength(1);
    expect(
      (await repository.findLatestByCreativeStudioId(creativeStudioId))
        ?.growthRevenueId
    ).toBe(growthRevenueId);
  });
});
