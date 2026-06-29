import type { BusinessTwinSnapshot } from "@nextshift/contracts";
import type { BusinessId, TenantId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  DecisionContext,
  Opportunity,
  Recommendation,
  Risk,
  type DecisionContextId,
  type OpportunityEngine,
  type RecommendationEngine,
  type RiskEngine,
  type RiskEnginePort,
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

describe("Risk Engine foundation", () => {
  it("creates a valid risk", () => {
    const risk = createRisk();

    expect(risk.riskId).toBe("risk-1");
    expect(risk.decisionContextId).toBe(decisionContextId);
    expect(risk.toSnapshot()).toEqual({
      riskId: "risk-1",
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
  });

  it("returns immutable defensive snapshots", () => {
    const risk = createRisk();
    const firstSnapshot = risk.toSnapshot();
    const secondSnapshot = risk.toSnapshot();

    expect(firstSnapshot).not.toBe(secondSnapshot);
    expect(Object.isFrozen(firstSnapshot)).toBe(true);
  });

  it("validates required IDs", () => {
    expect(() =>
      Risk.create({
        ...baseRiskInput(),
        riskId: "" as RiskId,
      })
    ).toThrow("Risk ID is required.");
    expect(() =>
      Risk.create({
        ...baseRiskInput(),
        decisionContextId: "" as DecisionContextId,
      })
    ).toThrow("Risk decision context ID is required.");
  });

  it("validates risk types", () => {
    expect(() =>
      Risk.create({
        ...baseRiskInput(),
        riskType: "Unsupported" as never,
      })
    ).toThrow("Unsupported risk type: Unsupported.");
  });

  it("validates required text fields and timestamps", () => {
    expect(() =>
      Risk.create({
        ...baseRiskInput(),
        title: " ",
      })
    ).toThrow("Risk title is required.");
    expect(() =>
      Risk.create({
        ...baseRiskInput(),
        summary: " ",
      })
    ).toThrow("Risk summary is required.");
    expect(() =>
      Risk.create({
        ...baseRiskInput(),
        potentialImpact: " ",
      })
    ).toThrow("Risk potential impact is required.");
    expect(() =>
      Risk.create({
        ...baseRiskInput(),
        createdAt: "not-a-date",
      })
    ).toThrow("Risk createdAt must be a valid timestamp.");
  });

  it("validates bounded decision values", () => {
    expect(() =>
      Risk.create({
        ...baseRiskInput(),
        probability: -0.1,
      })
    ).toThrow("Decision confidence value must be between 0 and 1.");
    expect(() =>
      Risk.create({
        ...baseRiskInput(),
        impact: 1.1,
      })
    ).toThrow("Decision impact value must be between 0 and 1.");
    expect(() =>
      Risk.create({
        ...baseRiskInput(),
        urgency: Number.NaN,
      })
    ).toThrow("Decision urgency value must be between 0 and 1.");
    expect(() =>
      Risk.create({
        ...baseRiskInput(),
        effort: Number.POSITIVE_INFINITY,
      })
    ).toThrow("Decision effort value must be between 0 and 1.");
  });

  it("supports the risk engine contract", () => {
    const context = createDecisionContext();
    const risk = createRisk();
    const engine: RiskEngine = {
      assess(receivedContext) {
        expect(receivedContext).toBe(context);
        return Object.freeze([risk]);
      },
    };

    const result = engine.assess(context);

    expect(Object.isFrozen(result)).toBe(true);
    expect(result).toEqual([risk]);
    expectTypeMarker<RiskEnginePort>();
  });

  it("keeps public exports and previous slice APIs available", () => {
    expect(Risk).toEqual(expect.any(Function));
    expect(Recommendation).toEqual(expect.any(Function));
    expect(Opportunity).toEqual(expect.any(Function));
    expectTypeMarker<RiskId>();
    expectTypeMarker<RiskEngine>();
    expectTypeMarker<RiskEnginePort>();
    expectTypeMarker<RecommendationEngine>();
    expectTypeMarker<OpportunityEngine>();
  });
});

function createRisk() {
  return Risk.create(baseRiskInput());
}

function baseRiskInput() {
  return {
    riskId: "risk-1" as RiskId,
    decisionContextId,
    riskType: "Operational" as const,
    title: "Execution capacity may slow delivery",
    summary: "Current capacity constraints could delay selected next actions.",
    potentialImpact: "Reduced execution velocity during the next operating cycle.",
    probability: 0.64,
    impact: 0.78,
    urgency: 0.62,
    effort: 0.45,
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
