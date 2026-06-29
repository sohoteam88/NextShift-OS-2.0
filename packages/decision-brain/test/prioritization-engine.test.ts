import type { BusinessTwinSnapshot } from "@nextshift/contracts";
import type { BusinessId, TenantId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  DecisionContext,
  Opportunity,
  PrioritizedDecision,
  Recommendation,
  Risk,
  type DecisionContextId,
  type OpportunityEngine,
  type PrioritizationEngine,
  type PrioritizationEnginePort,
  type PrioritizedDecisionId,
  type RecommendationEngine,
  type RiskEngine,
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

describe("Prioritization Engine foundation", () => {
  it("creates a valid prioritized decision", () => {
    const prioritizedDecision = createPrioritizedDecision();

    expect(prioritizedDecision.prioritizedDecisionId).toBe(
      "prioritized-decision-1"
    );
    expect(prioritizedDecision.decisionContextId).toBe(decisionContextId);
    expect(prioritizedDecision.rank).toBe(1);
    expect(prioritizedDecision.toSnapshot()).toEqual({
      prioritizedDecisionId: "prioritized-decision-1",
      decisionContextId,
      sourceType: "Recommendation",
      sourceId: "recommendation-1",
      priorityScore: 0.91,
      confidence: 0.83,
      rationale: "This source has the clearest next-action signal.",
      rank: 1,
      createdAt: "2026-06-28T00:00:00.000Z",
    });
  });

  it("returns immutable defensive snapshots", () => {
    const prioritizedDecision = createPrioritizedDecision();
    const firstSnapshot = prioritizedDecision.toSnapshot();
    const secondSnapshot = prioritizedDecision.toSnapshot();

    expect(firstSnapshot).not.toBe(secondSnapshot);
    expect(Object.isFrozen(firstSnapshot)).toBe(true);
  });

  it("validates required IDs", () => {
    expect(() =>
      PrioritizedDecision.create({
        ...basePrioritizedDecisionInput(),
        prioritizedDecisionId: "" as PrioritizedDecisionId,
      })
    ).toThrow("Prioritized decision ID is required.");
    expect(() =>
      PrioritizedDecision.create({
        ...basePrioritizedDecisionInput(),
        decisionContextId: "" as DecisionContextId,
      })
    ).toThrow("Prioritized decision context ID is required.");
    expect(() =>
      PrioritizedDecision.create({
        ...basePrioritizedDecisionInput(),
        sourceId: " ",
      })
    ).toThrow("Prioritized decision source ID is required.");
  });

  it("validates source types", () => {
    expect(() =>
      PrioritizedDecision.create({
        ...basePrioritizedDecisionInput(),
        sourceType: "Unsupported" as never,
      })
    ).toThrow("Unsupported prioritized decision source type: Unsupported.");
  });

  it("validates required text fields, rank, and timestamps", () => {
    expect(() =>
      PrioritizedDecision.create({
        ...basePrioritizedDecisionInput(),
        rationale: " ",
      })
    ).toThrow("Prioritized decision rationale is required.");
    expect(() =>
      PrioritizedDecision.create({
        ...basePrioritizedDecisionInput(),
        rank: 0,
      })
    ).toThrow("Prioritized decision rank must be a positive integer.");
    expect(() =>
      PrioritizedDecision.create({
        ...basePrioritizedDecisionInput(),
        rank: 1.5,
      })
    ).toThrow("Prioritized decision rank must be a positive integer.");
    expect(() =>
      PrioritizedDecision.create({
        ...basePrioritizedDecisionInput(),
        createdAt: "not-a-date",
      })
    ).toThrow("Prioritized decision createdAt must be a valid timestamp.");
  });

  it("validates bounded decision values", () => {
    expect(() =>
      PrioritizedDecision.create({
        ...basePrioritizedDecisionInput(),
        priorityScore: -0.1,
      })
    ).toThrow("Decision impact value must be between 0 and 1.");
    expect(() =>
      PrioritizedDecision.create({
        ...basePrioritizedDecisionInput(),
        confidence: 1.1,
      })
    ).toThrow("Decision confidence value must be between 0 and 1.");
  });

  it("supports the prioritization engine contract", () => {
    const context = createDecisionContext();
    const prioritizedDecision = createPrioritizedDecision();
    const engine: PrioritizationEngine = {
      prioritize(receivedContext) {
        expect(receivedContext).toBe(context);
        return Object.freeze([prioritizedDecision]);
      },
    };

    const result = engine.prioritize(context);

    expect(Object.isFrozen(result)).toBe(true);
    expect(result).toEqual([prioritizedDecision]);
    expectTypeMarker<PrioritizationEnginePort>();
  });

  it("keeps public exports and previous slice APIs available", () => {
    expect(PrioritizedDecision).toEqual(expect.any(Function));
    expect(Recommendation).toEqual(expect.any(Function));
    expect(Opportunity).toEqual(expect.any(Function));
    expect(Risk).toEqual(expect.any(Function));
    expectTypeMarker<PrioritizedDecisionId>();
    expectTypeMarker<PrioritizationEngine>();
    expectTypeMarker<PrioritizationEnginePort>();
    expectTypeMarker<RecommendationEngine>();
    expectTypeMarker<OpportunityEngine>();
    expectTypeMarker<RiskEngine>();
  });
});

function createPrioritizedDecision() {
  return PrioritizedDecision.create(basePrioritizedDecisionInput());
}

function basePrioritizedDecisionInput() {
  return {
    prioritizedDecisionId: "prioritized-decision-1" as PrioritizedDecisionId,
    decisionContextId,
    sourceType: "Recommendation" as const,
    sourceId: "recommendation-1",
    priorityScore: 0.91,
    confidence: 0.83,
    rationale: "This source has the clearest next-action signal.",
    rank: 1,
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
