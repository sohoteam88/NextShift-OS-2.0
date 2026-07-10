import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  InMemoryOpportunityEvaluationRepository,
  OpportunityEvaluation,
  createOpportunityScore,
  deriveOpportunityEvaluationPriority,
  type OpportunityEvaluationId,
} from "../src/opportunity-evaluation";

const businessId = "business-1" as BusinessId;
const evaluationId = "opportunity-evaluation-1" as OpportunityEvaluationId;
const createdAt = "2026-07-06T00:00:00.000Z";

function createEvaluation(): OpportunityEvaluation {
  return OpportunityEvaluation.create({
    evaluationId,
    businessId,
    title: "Expand CRM onboarding offer",
    summary: "Paid onboarding demand is emerging from qualified CRM leads.",
    source: {
      type: "lead",
      referenceId: "lead-1",
      summary: "Lead requested onboarding support.",
    },
    createdAt,
  });
}

describe("OpportunityEvaluation aggregate", () => {
  it("creates a draft opportunity evaluation", () => {
    const evaluation = createEvaluation();

    expect(evaluation.toSnapshot()).toMatchObject({
      evaluationId,
      businessId,
      title: "Expand CRM onboarding offer",
      summary: "Paid onboarding demand is emerging from qualified CRM leads.",
      source: {
        type: "lead",
        referenceId: "lead-1",
      },
      status: "draft",
      createdAt,
      updatedAt: createdAt,
    });
  });

  it("calculates opportunity score and priority", () => {
    expect(deriveOpportunityEvaluationPriority(20)).toBe("low");
    expect(deriveOpportunityEvaluationPriority(55)).toBe("medium");
    expect(deriveOpportunityEvaluationPriority(82)).toBe("high");
    expect(deriveOpportunityEvaluationPriority(95)).toBe("critical");

    expect(
      createOpportunityScore({
        marketFit: 90,
        businessValue: 95,
        urgency: 85,
        effort: 15,
        confidence: 95,
      })
    ).toMatchObject({
      total: 90,
      priority: "critical",
    });
  });

  it("evaluates and accepts an opportunity", () => {
    const evaluation = createEvaluation();

    evaluation.evaluate({
      marketFit: 80,
      businessValue: 90,
      urgency: 70,
      effort: 30,
      confidence: 80,
      evaluatedAt: "2026-07-06T01:00:00.000Z",
    });

    expect(evaluation.toSnapshot()).toMatchObject({
      status: "evaluated",
      score: {
        total: 78,
        priority: "high",
      },
      evaluatedAt: "2026-07-06T01:00:00.000Z",
    });

    evaluation.accept({
      reason: "Strong fit for current revenue goals.",
      decidedAt: "2026-07-06T02:00:00.000Z",
    });

    expect(evaluation.toSnapshot()).toMatchObject({
      status: "accepted",
      decisionReason: "Strong fit for current revenue goals.",
      acceptedAt: "2026-07-06T02:00:00.000Z",
    });
  });

  it("rejects invalid lifecycle transitions", () => {
    const evaluation = createEvaluation();

    expect(() =>
      evaluation.accept({
        decidedAt: "2026-07-06T01:00:00.000Z",
      })
    ).toThrow("Only evaluated opportunities can receive decisions.");

    evaluation.archive("2026-07-06T02:00:00.000Z");

    expect(() =>
      evaluation.evaluate({
        marketFit: 80,
        businessValue: 90,
        urgency: 70,
        effort: 30,
        confidence: 80,
        evaluatedAt: "2026-07-06T03:00:00.000Z",
      })
    ).toThrow("Archived opportunity evaluations cannot be modified.");
  });
});

describe("InMemoryOpportunityEvaluationRepository", () => {
  it("saves, retrieves, and filters evaluated opportunities", async () => {
    const repository = new InMemoryOpportunityEvaluationRepository();
    const evaluation = createEvaluation();

    evaluation.evaluate({
      marketFit: 80,
      businessValue: 90,
      urgency: 70,
      effort: 30,
      confidence: 80,
      evaluatedAt: "2026-07-06T01:00:00.000Z",
    });

    await repository.save(evaluation);

    expect(await repository.exists(evaluationId)).toBe(true);
    expect((await repository.findById(evaluationId))?.toSnapshot()).toEqual(
      evaluation.toSnapshot()
    );
    expect(await repository.findByBusinessId(businessId)).toHaveLength(1);
    expect(await repository.findByStatus(businessId, "evaluated")).toHaveLength(1);
    expect(await repository.findByPriority(businessId, "high")).toHaveLength(1);
  });
});
