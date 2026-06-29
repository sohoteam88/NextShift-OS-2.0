import type { BusinessTwinSnapshot } from "@nextshift/contracts";
import type { BusinessId, TenantId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  DecisionBrain,
  DecisionContext,
  DecisionConversation,
  Opportunity,
  PrioritizedDecision,
  Recommendation,
  Risk,
  type ConversationEngine,
  type DecisionBrainDependencies,
  type DecisionBrainResult,
  type DecisionContextId,
  type DecisionConversationId,
  type OpportunityEngine,
  type OpportunityId,
  type PrioritizationEngine,
  type PrioritizedDecisionId,
  type RecommendationEngine,
  type RecommendationId,
  type RiskEngine,
  type RiskId,
} from "../src";

const businessId = "business-1" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const tenant = { tenantId };
const decisionContextId = "decision-context-1" as DecisionContextId;
const businessContext: BusinessTwinSnapshot = {
  businessId,
  tenant,
  version: 1,
  capturedAt: "2026-06-28T00:00:00.000Z",
  identity: {
    businessName: "NextShift Demo",
    values: ["clarity", "momentum"],
  },
  understanding: {
    executiveSummary: "Business is ready for decision intelligence.",
    strengths: ["Strong analytics baseline"],
    weaknesses: [],
    opportunities: ["Improve next-action selection"],
    missingInformation: [],
    contradictions: [],
    confidence: 0.9,
  },
};

describe("DecisionBrain integration facade", () => {
  it("delegates to RecommendationEngine", () => {
    const context = createDecisionContext();
    const recommendation = createRecommendation();
    const dependencies = createDependencies({
      recommendationEngine: {
        generate(receivedContext) {
          expect(receivedContext).toBe(context);
          return [recommendation];
        },
      },
    });
    const brain = new DecisionBrain(dependencies);

    const result = brain.generateRecommendations(context);

    expectSuccessValue(result, [recommendation]);
  });

  it("delegates to OpportunityEngine", () => {
    const context = createDecisionContext();
    const opportunity = createOpportunity();
    const dependencies = createDependencies({
      opportunityEngine: {
        identify(receivedContext) {
          expect(receivedContext).toBe(context);
          return [opportunity];
        },
      },
    });
    const brain = new DecisionBrain(dependencies);

    const result = brain.identifyOpportunities(context);

    expectSuccessValue(result, [opportunity]);
  });

  it("delegates to RiskEngine", () => {
    const context = createDecisionContext();
    const risk = createRisk();
    const dependencies = createDependencies({
      riskEngine: {
        assess(receivedContext) {
          expect(receivedContext).toBe(context);
          return [risk];
        },
      },
    });
    const brain = new DecisionBrain(dependencies);

    const result = brain.assessRisks(context);

    expectSuccessValue(result, [risk]);
  });

  it("delegates to PrioritizationEngine", () => {
    const context = createDecisionContext();
    const prioritizedDecision = createPrioritizedDecision();
    const dependencies = createDependencies({
      prioritizationEngine: {
        prioritize(receivedContext) {
          expect(receivedContext).toBe(context);
          return [prioritizedDecision];
        },
      },
    });
    const brain = new DecisionBrain(dependencies);

    const result = brain.prioritizeDecisions(context);

    expectSuccessValue(result, [prioritizedDecision]);
  });

  it("delegates to ConversationEngine", () => {
    const context = createDecisionContext();
    const conversation = createDecisionConversation();
    const dependencies = createDependencies({
      conversationEngine: {
        continueConversation(receivedContext) {
          expect(receivedContext).toBe(context);
          return [conversation];
        },
      },
    });
    const brain = new DecisionBrain(dependencies);

    const result = brain.continueConversation(context);

    expectSuccessValue(result, [conversation]);
  });

  it("returns immutable success results and copied arrays", () => {
    const context = createDecisionContext();
    const recommendation = createRecommendation();
    const engineOutput = [recommendation];
    const brain = new DecisionBrain(
      createDependencies({
        recommendationEngine: {
          generate() {
            return engineOutput;
          },
        },
      })
    );

    const result = brain.generateRecommendations(context);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.value)).toBe(true);
      expect(result.value).toEqual(engineOutput);
      expect(result.value).not.toBe(engineOutput);
    }
  });

  it("converts RecommendationEngine failures into failure results", () => {
    const brain = new DecisionBrain(
      createDependencies({
        recommendationEngine: {
          generate() {
            throw new Error("Recommendation engine failed.");
          },
        },
      })
    );

    const result = brain.generateRecommendations(createDecisionContext());

    expectFailure(result, "RECOMMENDATION_ENGINE_FAILED", "Recommendation engine failed.");
  });

  it("converts OpportunityEngine failures into failure results", () => {
    const brain = new DecisionBrain(
      createDependencies({
        opportunityEngine: {
          identify() {
            throw new Error("Opportunity engine failed.");
          },
        },
      })
    );

    const result = brain.identifyOpportunities(createDecisionContext());

    expectFailure(result, "OPPORTUNITY_ENGINE_FAILED", "Opportunity engine failed.");
  });

  it("converts RiskEngine failures into failure results", () => {
    const brain = new DecisionBrain(
      createDependencies({
        riskEngine: {
          assess() {
            throw new Error("Risk engine failed.");
          },
        },
      })
    );

    const result = brain.assessRisks(createDecisionContext());

    expectFailure(result, "RISK_ENGINE_FAILED", "Risk engine failed.");
  });

  it("converts PrioritizationEngine failures into failure results", () => {
    const brain = new DecisionBrain(
      createDependencies({
        prioritizationEngine: {
          prioritize() {
            throw new Error("Prioritization engine failed.");
          },
        },
      })
    );

    const result = brain.prioritizeDecisions(createDecisionContext());

    expectFailure(
      result,
      "PRIORITIZATION_ENGINE_FAILED",
      "Prioritization engine failed."
    );
  });

  it("converts ConversationEngine failures into failure results", () => {
    const brain = new DecisionBrain(
      createDependencies({
        conversationEngine: {
          continueConversation() {
            throw new Error("Conversation engine failed.");
          },
        },
      })
    );

    const result = brain.continueConversation(createDecisionContext());

    expectFailure(result, "CONVERSATION_ENGINE_FAILED", "Conversation engine failed.");
  });

  it("keeps public exports and previous slice APIs available", () => {
    expect(DecisionBrain).toEqual(expect.any(Function));
    expect(DecisionContext).toEqual(expect.any(Function));
    expect(Recommendation).toEqual(expect.any(Function));
    expect(Opportunity).toEqual(expect.any(Function));
    expect(Risk).toEqual(expect.any(Function));
    expect(PrioritizedDecision).toEqual(expect.any(Function));
    expect(DecisionConversation).toEqual(expect.any(Function));
    expectTypeMarker<DecisionBrainDependencies>();
    expectTypeMarker<DecisionBrainResult<readonly Recommendation[]>>();
    expectTypeMarker<RecommendationEngine>();
    expectTypeMarker<OpportunityEngine>();
    expectTypeMarker<RiskEngine>();
    expectTypeMarker<PrioritizationEngine>();
    expectTypeMarker<ConversationEngine>();
  });
});

function createDependencies(
  overrides: Partial<DecisionBrainDependencies> = {}
): DecisionBrainDependencies {
  return {
    recommendationEngine: {
      generate() {
        return [];
      },
    },
    opportunityEngine: {
      identify() {
        return [];
      },
    },
    riskEngine: {
      assess() {
        return [];
      },
    },
    prioritizationEngine: {
      prioritize() {
        return [];
      },
    },
    conversationEngine: {
      continueConversation() {
        return [];
      },
    },
    ...overrides,
  };
}

function createDecisionContext() {
  return DecisionContext.create({
    decisionContextId,
    businessId,
    tenant,
    businessContext,
    objective: "Choose the highest value next action",
    createdAt: "2026-06-28T00:00:00.000Z",
  });
}

function createRecommendation() {
  return Recommendation.create({
    recommendationId: "recommendation-1" as RecommendationId,
    decisionContextId,
    recommendationType: "Growth",
    title: "Prioritize high-intent leads",
    summary: "Focus the next operating cycle on leads with clear buying intent.",
    rationale: "The context contains enough signal for a focused next action.",
    confidence: 0.82,
    impact: 0.9,
    urgency: 0.7,
    effort: 0.35,
    createdAt: "2026-06-28T00:00:00.000Z",
  });
}

function createOpportunity() {
  return Opportunity.create({
    opportunityId: "opportunity-1" as OpportunityId,
    decisionContextId,
    opportunityType: "Revenue",
    title: "Expand high-intent conversion path",
    summary: "Convert active buying signals into a focused revenue motion.",
    expectedImpact: "Increase qualified pipeline from existing demand signals.",
    confidence: 0.81,
    impact: 0.88,
    urgency: 0.72,
    effort: 0.4,
    createdAt: "2026-06-28T00:00:00.000Z",
  });
}

function createRisk() {
  return Risk.create({
    riskId: "risk-1" as RiskId,
    decisionContextId,
    riskType: "Operational",
    title: "Execution capacity may slow delivery",
    summary: "Current capacity constraints could delay selected next actions.",
    potentialImpact: "Reduced execution velocity during the next operating cycle.",
    probability: 0.64,
    impact: 0.78,
    urgency: 0.62,
    effort: 0.45,
    createdAt: "2026-06-28T00:00:00.000Z",
  });
}

function createPrioritizedDecision() {
  return PrioritizedDecision.create({
    prioritizedDecisionId: "prioritized-decision-1" as PrioritizedDecisionId,
    decisionContextId,
    sourceType: "Recommendation",
    sourceId: "recommendation-1",
    priorityScore: 0.91,
    confidence: 0.83,
    rationale: "This source has the clearest next-action signal.",
    rank: 1,
    createdAt: "2026-06-28T00:00:00.000Z",
  });
}

function createDecisionConversation() {
  return DecisionConversation.create({
    decisionConversationId: "conversation-1" as DecisionConversationId,
    decisionContextId,
    conversationType: "Advisory",
    title: "Discuss next operating decision",
    summary: "A focused advisory conversation for the next decision cycle.",
    latestMessage: "Which tradeoff matters most for this next action?",
    messageCount: 3,
    createdAt: "2026-06-28T00:00:00.000Z",
    updatedAt: "2026-06-28T00:05:00.000Z",
  });
}

function expectSuccessValue<T>(
  result: DecisionBrainResult<readonly T[]>,
  value: readonly T[]
): void {
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value).toEqual(value);
    expect(Object.isFrozen(result.value)).toBe(true);
  }
}

function expectFailure(
  result: DecisionBrainResult<unknown>,
  code: string,
  message: string
): void {
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.error)).toBe(true);
    expect(result.error).toEqual({ code, message });
  }
}

function expectTypeMarker<T>(): void {
  expect(true as T extends unknown ? true : false).toBe(true);
}
