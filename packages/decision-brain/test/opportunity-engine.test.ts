import type { BusinessTwinSnapshot } from "@nextshift/contracts";
import type { BusinessId, TenantId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  DecisionContext,
  Opportunity,
  type DecisionContextId,
  type OpportunityEngine,
  type OpportunityEnginePort,
  type OpportunityId,
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

describe("Opportunity Engine foundation", () => {
  it("creates a valid opportunity", () => {
    const opportunity = createOpportunity();

    expect(opportunity.opportunityId).toBe("opportunity-1");
    expect(opportunity.decisionContextId).toBe(decisionContextId);
    expect(opportunity.toSnapshot()).toEqual({
      opportunityId: "opportunity-1",
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
  });

  it("returns immutable defensive snapshots", () => {
    const opportunity = createOpportunity();
    const firstSnapshot = opportunity.toSnapshot();
    const secondSnapshot = opportunity.toSnapshot();

    expect(firstSnapshot).not.toBe(secondSnapshot);
    expect(Object.isFrozen(firstSnapshot)).toBe(true);
  });

  it("validates required IDs", () => {
    expect(() =>
      Opportunity.create({
        ...baseOpportunityInput(),
        opportunityId: "" as OpportunityId,
      })
    ).toThrow("Opportunity ID is required.");
    expect(() =>
      Opportunity.create({
        ...baseOpportunityInput(),
        decisionContextId: "" as DecisionContextId,
      })
    ).toThrow("Opportunity decision context ID is required.");
  });

  it("validates opportunity types", () => {
    expect(() =>
      Opportunity.create({
        ...baseOpportunityInput(),
        opportunityType: "Unsupported" as never,
      })
    ).toThrow("Unsupported opportunity type: Unsupported.");
  });

  it("validates required text fields and timestamps", () => {
    expect(() =>
      Opportunity.create({
        ...baseOpportunityInput(),
        title: " ",
      })
    ).toThrow("Opportunity title is required.");
    expect(() =>
      Opportunity.create({
        ...baseOpportunityInput(),
        summary: " ",
      })
    ).toThrow("Opportunity summary is required.");
    expect(() =>
      Opportunity.create({
        ...baseOpportunityInput(),
        expectedImpact: " ",
      })
    ).toThrow("Opportunity expected impact is required.");
    expect(() =>
      Opportunity.create({
        ...baseOpportunityInput(),
        createdAt: "not-a-date",
      })
    ).toThrow("Opportunity createdAt must be a valid timestamp.");
  });

  it("validates bounded decision values", () => {
    expect(() =>
      Opportunity.create({
        ...baseOpportunityInput(),
        confidence: -0.1,
      })
    ).toThrow("Decision confidence value must be between 0 and 1.");
    expect(() =>
      Opportunity.create({
        ...baseOpportunityInput(),
        impact: 1.1,
      })
    ).toThrow("Decision impact value must be between 0 and 1.");
    expect(() =>
      Opportunity.create({
        ...baseOpportunityInput(),
        urgency: Number.NaN,
      })
    ).toThrow("Decision urgency value must be between 0 and 1.");
    expect(() =>
      Opportunity.create({
        ...baseOpportunityInput(),
        effort: Number.POSITIVE_INFINITY,
      })
    ).toThrow("Decision effort value must be between 0 and 1.");
  });

  it("supports the opportunity engine contract", () => {
    const context = createDecisionContext();
    const opportunity = createOpportunity();
    const engine: OpportunityEngine = {
      identify(receivedContext) {
        expect(receivedContext).toBe(context);
        return Object.freeze([opportunity]);
      },
    };

    const result = engine.identify(context);

    expect(Object.isFrozen(result)).toBe(true);
    expect(result).toEqual([opportunity]);
    expectTypeMarker<OpportunityEnginePort>();
  });

  it("keeps public exports available", () => {
    expect(Opportunity).toEqual(expect.any(Function));
    expectTypeMarker<OpportunityId>();
    expectTypeMarker<OpportunityEngine>();
    expectTypeMarker<OpportunityEnginePort>();
  });
});

function createOpportunity() {
  return Opportunity.create(baseOpportunityInput());
}

function baseOpportunityInput() {
  return {
    opportunityId: "opportunity-1" as OpportunityId,
    decisionContextId,
    opportunityType: "Revenue" as const,
    title: "Expand high-intent conversion path",
    summary: "Convert active buying signals into a focused revenue motion.",
    expectedImpact: "Increase qualified pipeline from existing demand signals.",
    confidence: 0.81,
    impact: 0.88,
    urgency: 0.72,
    effort: 0.4,
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
