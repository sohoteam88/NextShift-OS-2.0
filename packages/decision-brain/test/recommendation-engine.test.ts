import type { BusinessTwinSnapshot } from "@nextshift/contracts";
import type { BusinessId, TenantId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  DecisionContext,
  Recommendation,
  type DecisionContextId,
  type RecommendationEngine,
  type RecommendationEnginePort,
  type RecommendationId,
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

describe("Recommendation Engine foundation", () => {
  it("creates a valid recommendation", () => {
    const recommendation = createRecommendation();

    expect(recommendation.recommendationId).toBe("recommendation-1");
    expect(recommendation.decisionContextId).toBe(decisionContextId);
    expect(recommendation.toSnapshot()).toEqual({
      recommendationId: "recommendation-1",
      decisionContextId,
      recommendationType: "Growth",
      title: "Prioritize high-intent leads",
      summary: "Focus the next operating cycle on leads with clear buying intent.",
      rationale:
        "The decision context contains enough signal to recommend a focused next action.",
      confidence: 0.82,
      impact: 0.9,
      urgency: 0.7,
      effort: 0.35,
      createdAt: "2026-06-28T00:00:00.000Z",
    });
  });

  it("returns immutable defensive snapshots", () => {
    const recommendation = createRecommendation();
    const firstSnapshot = recommendation.toSnapshot();
    const secondSnapshot = recommendation.toSnapshot();

    expect(firstSnapshot).not.toBe(secondSnapshot);
    expect(Object.isFrozen(firstSnapshot)).toBe(true);
  });

  it("validates required IDs", () => {
    expect(() =>
      Recommendation.create({
        ...baseRecommendationInput(),
        recommendationId: "" as RecommendationId,
      })
    ).toThrow("Recommendation ID is required.");
    expect(() =>
      Recommendation.create({
        ...baseRecommendationInput(),
        decisionContextId: "" as DecisionContextId,
      })
    ).toThrow("Recommendation decision context ID is required.");
  });

  it("validates recommendation types", () => {
    expect(() =>
      Recommendation.create({
        ...baseRecommendationInput(),
        recommendationType: "Unsupported" as never,
      })
    ).toThrow("Unsupported recommendation type: Unsupported.");
  });

  it("validates required text fields and timestamps", () => {
    expect(() =>
      Recommendation.create({
        ...baseRecommendationInput(),
        title: " ",
      })
    ).toThrow("Recommendation title is required.");
    expect(() =>
      Recommendation.create({
        ...baseRecommendationInput(),
        summary: " ",
      })
    ).toThrow("Recommendation summary is required.");
    expect(() =>
      Recommendation.create({
        ...baseRecommendationInput(),
        rationale: " ",
      })
    ).toThrow("Recommendation rationale is required.");
    expect(() =>
      Recommendation.create({
        ...baseRecommendationInput(),
        createdAt: "not-a-date",
      })
    ).toThrow("Recommendation createdAt must be a valid timestamp.");
  });

  it("validates bounded decision values", () => {
    expect(() =>
      Recommendation.create({
        ...baseRecommendationInput(),
        confidence: -0.1,
      })
    ).toThrow("Decision confidence value must be between 0 and 1.");
    expect(() =>
      Recommendation.create({
        ...baseRecommendationInput(),
        impact: 1.1,
      })
    ).toThrow("Decision impact value must be between 0 and 1.");
    expect(() =>
      Recommendation.create({
        ...baseRecommendationInput(),
        urgency: Number.NaN,
      })
    ).toThrow("Decision urgency value must be between 0 and 1.");
    expect(() =>
      Recommendation.create({
        ...baseRecommendationInput(),
        effort: Number.POSITIVE_INFINITY,
      })
    ).toThrow("Decision effort value must be between 0 and 1.");
  });

  it("supports the recommendation engine contract", () => {
    const context = createDecisionContext();
    const recommendation = createRecommendation();
    const engine: RecommendationEngine = {
      generate(receivedContext) {
        expect(receivedContext).toBe(context);
        return Object.freeze([recommendation]);
      },
    };

    const result = engine.generate(context);

    expect(Object.isFrozen(result)).toBe(true);
    expect(result).toEqual([recommendation]);
    expectTypeMarker<RecommendationEnginePort>();
  });

  it("keeps public exports available", () => {
    expect(Recommendation).toEqual(expect.any(Function));
    expectTypeMarker<RecommendationId>();
    expectTypeMarker<RecommendationEngine>();
    expectTypeMarker<RecommendationEnginePort>();
  });
});

function createRecommendation() {
  return Recommendation.create(baseRecommendationInput());
}

function baseRecommendationInput() {
  return {
    recommendationId: "recommendation-1" as RecommendationId,
    decisionContextId,
    recommendationType: "Growth" as const,
    title: "Prioritize high-intent leads",
    summary: "Focus the next operating cycle on leads with clear buying intent.",
    rationale:
      "The decision context contains enough signal to recommend a focused next action.",
    confidence: 0.82,
    impact: 0.9,
    urgency: 0.7,
    effort: 0.35,
    createdAt: "2026-06-28T00:00:00.000Z",
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

function expectTypeMarker<T>(): void {
  expect(true as T extends unknown ? true : false).toBe(true);
}
