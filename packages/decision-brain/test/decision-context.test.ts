import type { BusinessTwinSnapshot } from "@nextshift/contracts";
import type { BusinessId, TenantId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  ConversationEnginePort,
  DecisionBrain,
  DecisionContext,
  OpportunityEnginePort,
  PrioritizationEnginePort,
  RecommendationEnginePort,
  RiskEnginePort,
  StrategyEnginePort,
  createConfidenceValue,
  createDecisionConstraint,
  createDecisionEvidence,
  createEffortValue,
  createImpactValue,
  createUrgencyValue,
  type DecisionConstraintId,
  type DecisionContextId,
  type DecisionEvidenceId,
} from "../src";

const businessId = "business-1" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const tenant = { tenantId };
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

describe("DecisionContext foundation", () => {
  it("creates a valid decision context", () => {
    const context = createDecisionContext();

    expect(context.decisionContextId).toBe("decision-context-1");
    expect(context.businessId).toBe(businessId);
    expect(context.toSnapshot()).toMatchObject({
      decisionContextId: "decision-context-1",
      businessId,
      objective: "Choose the highest value next action",
      evidence: [
        {
          evidenceId: "evidence-1",
          source: "AnalyticsInsight",
          confidence: 0.85,
        },
      ],
      constraints: [
        {
          constraintId: "constraint-1",
          constraintType: "Capacity",
          severity: "Medium",
        },
      ],
    });
  });

  it("returns immutable defensive snapshots", () => {
    const context = createDecisionContext();
    const firstSnapshot = context.toSnapshot();
    const secondSnapshot = context.toSnapshot();
    const evidence = firstSnapshot.evidence[0];

    expect(firstSnapshot).not.toBe(secondSnapshot);
    expect(firstSnapshot.evidence).not.toBe(secondSnapshot.evidence);
    expect(Object.isFrozen(firstSnapshot)).toBe(true);
    expect(Object.isFrozen(firstSnapshot.tenant)).toBe(true);
    expect(Object.isFrozen(firstSnapshot.businessContext)).toBe(true);
    expect(Object.isFrozen(firstSnapshot.businessContext.identity?.values)).toBe(
      true
    );
    expect(Object.isFrozen(firstSnapshot.evidence)).toBe(true);
    expect(Object.isFrozen(firstSnapshot.constraints)).toBe(true);
    expect(Object.isFrozen(evidence?.metadata)).toBe(true);
    expect(
      Object.isFrozen(
        (evidence?.metadata as { readonly tags?: readonly string[] }).tags
      )
    ).toBe(true);
  });

  it("validates decision evidence", () => {
    expect(() =>
      createDecisionEvidence({
        evidenceId: "" as DecisionEvidenceId,
        source: "AnalyticsInsight",
        summary: "Strong signal",
        confidence: 0.8,
        observedAt: "2026-06-28T00:00:00.000Z",
      })
    ).toThrow("Decision evidence ID is required.");
    expect(() =>
      createDecisionEvidence({
        evidenceId: "evidence-1" as DecisionEvidenceId,
        source: " ",
        summary: "Strong signal",
        confidence: 0.8,
        observedAt: "2026-06-28T00:00:00.000Z",
      })
    ).toThrow("Decision evidence source is required.");
    expect(() =>
      createDecisionEvidence({
        evidenceId: "evidence-1" as DecisionEvidenceId,
        source: "AnalyticsInsight",
        summary: " ",
        confidence: 0.8,
        observedAt: "2026-06-28T00:00:00.000Z",
      })
    ).toThrow("Decision evidence summary is required.");
    expect(() =>
      createDecisionEvidence({
        evidenceId: "evidence-1" as DecisionEvidenceId,
        source: "AnalyticsInsight",
        summary: "Strong signal",
        confidence: 1.5,
        observedAt: "2026-06-28T00:00:00.000Z",
      })
    ).toThrow("Decision confidence value must be between 0 and 1.");
    expect(() =>
      createDecisionEvidence({
        evidenceId: "evidence-1" as DecisionEvidenceId,
        source: "AnalyticsInsight",
        summary: "Strong signal",
        confidence: 0.8,
        observedAt: "not-a-date",
      })
    ).toThrow("Decision evidence observedAt must be a valid timestamp.");
  });

  it("validates decision constraints", () => {
    expect(() =>
      createDecisionConstraint({
        constraintId: "" as DecisionConstraintId,
        constraintType: "Budget",
        description: "Budget is constrained.",
        severity: "High",
      })
    ).toThrow("Decision constraint ID is required.");
    expect(() =>
      createDecisionConstraint({
        constraintId: "constraint-1" as DecisionConstraintId,
        constraintType: "Unknown" as never,
        description: "Budget is constrained.",
        severity: "High",
      })
    ).toThrow("Unsupported decision constraint type: Unknown.");
    expect(() =>
      createDecisionConstraint({
        constraintId: "constraint-1" as DecisionConstraintId,
        constraintType: "Budget",
        description: " ",
        severity: "High",
      })
    ).toThrow("Decision constraint description is required.");
    expect(() =>
      createDecisionConstraint({
        constraintId: "constraint-1" as DecisionConstraintId,
        constraintType: "Budget",
        description: "Budget is constrained.",
        severity: "Severe" as never,
      })
    ).toThrow("Unsupported decision constraint severity: Severe.");
  });

  it("validates decision context required fields and timestamps", () => {
    expect(() =>
      DecisionContext.create({
        ...baseDecisionContextInput(),
        decisionContextId: "" as DecisionContextId,
      })
    ).toThrow("Decision context ID is required.");
    expect(() =>
      DecisionContext.create({
        ...baseDecisionContextInput(),
        businessId: "" as BusinessId,
      })
    ).toThrow("Decision context business ID is required.");
    expect(() =>
      DecisionContext.create({
        ...baseDecisionContextInput(),
        tenant: undefined as never,
      })
    ).toThrow("Decision context tenant is required.");
    expect(() =>
      DecisionContext.create({
        ...baseDecisionContextInput(),
        businessContext: undefined as never,
      })
    ).toThrow("Decision context business context is required.");
    expect(() =>
      DecisionContext.create({
        ...baseDecisionContextInput(),
        createdAt: "not-a-date",
      })
    ).toThrow("Decision context createdAt must be a valid timestamp.");
  });

  it("validates confidence, impact, urgency, and effort value bounds", () => {
    expect(createConfidenceValue(0)).toBe(0);
    expect(createConfidenceValue(1)).toBe(1);
    expect(createImpactValue(0.7)).toBe(0.7);
    expect(createUrgencyValue(0.4)).toBe(0.4);
    expect(createEffortValue(0.2)).toBe(0.2);

    expect(() => createConfidenceValue(-0.1)).toThrow(
      "Decision confidence value must be between 0 and 1."
    );
    expect(() => createImpactValue(1.1)).toThrow(
      "Decision impact value must be between 0 and 1."
    );
    expect(() => createUrgencyValue(Number.NaN)).toThrow(
      "Decision urgency value must be between 0 and 1."
    );
    expect(() => createEffortValue(Number.POSITIVE_INFINITY)).toThrow(
      "Decision effort value must be between 0 and 1."
    );
  });

  it("keeps existing package exports available", () => {
    expect(DecisionBrain).toEqual(expect.any(Function));
    expectTypeMarker<RecommendationEnginePort>();
    expectTypeMarker<StrategyEnginePort>();
    expectTypeMarker<OpportunityEnginePort>();
    expectTypeMarker<RiskEnginePort>();
    expectTypeMarker<PrioritizationEnginePort>();
    expectTypeMarker<ConversationEnginePort>();
  });
});

function createDecisionContext() {
  return DecisionContext.create(baseDecisionContextInput());
}

function baseDecisionContextInput() {
  return {
    decisionContextId: "decision-context-1" as DecisionContextId,
    businessId,
    tenant,
    businessContext,
    objective: "Choose the highest value next action",
    evidence: [
      createDecisionEvidence({
        evidenceId: "evidence-1" as DecisionEvidenceId,
        source: "AnalyticsInsight",
        summary: "Health score improved and trend is stable.",
        confidence: 0.85,
        observedAt: "2026-06-28T00:00:00.000Z",
        metadata: {
          tags: ["analytics", "health"],
          score: 0.92,
        },
      }),
    ],
    constraints: [
      createDecisionConstraint({
        constraintId: "constraint-1" as DecisionConstraintId,
        constraintType: "Capacity",
        description: "Team has limited implementation capacity this week.",
        severity: "Medium",
      }),
    ],
    createdAt: "2026-06-28T00:00:00.000Z",
  };
}

function expectTypeMarker<T>(): void {
  expect(true as T extends unknown ? true : false).toBe(true);
}
