import { describe, expect, it } from "vitest";
import {
  BusinessBrain,
  BusinessHealth,
  DefaultBusinessHealthEvaluator,
  createBusinessHealthDimension,
  deriveBusinessHealthStatus,
  type BusinessBrainId,
  type BusinessInsightId,
  type BusinessProfileId,
  type ObservationId,
  type OpportunityId,
  type RiskId,
} from "../src/business-brain";
import {
  BusinessHealth as PublicBusinessHealth,
  DefaultBusinessHealthEvaluator as PublicDefaultBusinessHealthEvaluator,
} from "../src";

const businessBrainId = "business-brain-1" as BusinessBrainId;
const businessProfileId = "business-profile-1" as BusinessProfileId;

function createBusinessBrain(): BusinessBrain {
  return BusinessBrain.create({
    id: businessBrainId,
    businessProfileId,
    createdAt: "2026-06-29T00:00:00.000Z",
  });
}

function addPositiveSignals(businessBrain: BusinessBrain): void {
  businessBrain.ingestObservation({
    id: "observation-1" as ObservationId,
    source: "analytics",
    summary: "Lead conversion improved.",
    observedAt: "2026-06-29T01:00:00.000Z",
  });
  businessBrain.addInsight({
    id: "insight-1" as BusinessInsightId,
    title: "Conversion quality improved",
    summary: "Conversion quality improved after campaign optimization.",
    createdAt: "2026-06-29T02:00:00.000Z",
  });
  businessBrain.addOpportunity({
    id: "opportunity-1" as OpportunityId,
    title: "Scale webinar follow-up",
    summary: "Webinar follow-up can create more qualified sales calls.",
    createdAt: "2026-06-29T03:00:00.000Z",
  });
}

describe("BusinessHealth", () => {
  it("creates business health with derived status and immutable dimensions", () => {
    const businessHealth = BusinessHealth.create({
      score: 76,
      dimensions: [
        {
          name: "revenue",
          score: 82,
          summary: "Revenue trend is improving.",
        },
      ],
      summary: "Business health is strong.",
      evaluatedAt: "2026-06-29T06:00:00.000Z",
    });
    const snapshot = businessHealth.toSnapshot();

    expect(snapshot).toEqual({
      score: 76,
      status: "strong",
      dimensions: [
        {
          name: "revenue",
          score: 82,
          summary: "Revenue trend is improving.",
        },
      ],
      summary: "Business health is strong.",
      evaluatedAt: "2026-06-29T06:00:00.000Z",
    });
    expect(Object.isFrozen(snapshot.dimensions)).toBe(true);
    expect(Object.isFrozen(snapshot.dimensions[0])).toBe(true);
  });

  it("validates score type, finite value, and range", () => {
    expect(() =>
      BusinessHealth.create({
        score: Number.NaN,
        dimensions: [
          { name: "risk", score: 50, summary: "Risk baseline is stable." },
        ],
        summary: "Invalid score.",
        evaluatedAt: "2026-06-29T06:00:00.000Z",
      })
    ).toThrow("BusinessHealth score must be numeric.");

    expect(() =>
      BusinessHealth.create({
        score: Number.POSITIVE_INFINITY,
        dimensions: [
          { name: "risk", score: 50, summary: "Risk baseline is stable." },
        ],
        summary: "Invalid score.",
        evaluatedAt: "2026-06-29T06:00:00.000Z",
      })
    ).toThrow("BusinessHealth score must be finite.");

    expect(() =>
      BusinessHealth.create({
        score: 101,
        dimensions: [
          { name: "risk", score: 50, summary: "Risk baseline is stable." },
        ],
        summary: "Invalid score.",
        evaluatedAt: "2026-06-29T06:00:00.000Z",
      })
    ).toThrow("BusinessHealth score must be between 0 and 100.");
  });

  it("derives expected health statuses from score bands", () => {
    expect(deriveBusinessHealthStatus(0)).toBe("critical");
    expect(deriveBusinessHealthStatus(20)).toBe("weak");
    expect(deriveBusinessHealthStatus(40)).toBe("stable");
    expect(deriveBusinessHealthStatus(60)).toBe("strong");
    expect(deriveBusinessHealthStatus(80)).toBe("excellent");
    expect(deriveBusinessHealthStatus(100)).toBe("excellent");
  });

  it("validates dimensions", () => {
    expect(() =>
      createBusinessHealthDimension({
        name: " ",
        score: 50,
        summary: "Missing name.",
      })
    ).toThrow("BusinessHealth dimension name is required.");

    expect(() =>
      createBusinessHealthDimension({
        name: "custom-signal",
        score: -1,
        summary: "Invalid score.",
      })
    ).toThrow(
      "BusinessHealth custom-signal dimension score must be between 0 and 100."
    );

    expect(() =>
      createBusinessHealthDimension({
        name: "custom-signal",
        score: 50,
        summary: " ",
      })
    ).toThrow("BusinessHealth dimension summary is required.");
  });

  it("validates required dimensions, summary, and evaluatedAt", () => {
    expect(() =>
      BusinessHealth.create({
        score: 50,
        dimensions: [],
        summary: "Stable health.",
        evaluatedAt: "2026-06-29T06:00:00.000Z",
      })
    ).toThrow("BusinessHealth dimensions are required.");

    expect(() =>
      BusinessHealth.create({
        score: 50,
        dimensions: [
          { name: "risk", score: 50, summary: "Risk baseline is stable." },
        ],
        summary: " ",
        evaluatedAt: "2026-06-29T06:00:00.000Z",
      })
    ).toThrow("BusinessHealth summary is required.");

    expect(() =>
      BusinessHealth.create({
        score: 50,
        dimensions: [
          { name: "risk", score: 50, summary: "Risk baseline is stable." },
        ],
        summary: "Stable health.",
        evaluatedAt: "not-a-date",
      })
    ).toThrow("BusinessHealth evaluatedAt must be a valid timestamp.");
  });
});

describe("DefaultBusinessHealthEvaluator", () => {
  it("evaluates business health from BusinessBrain snapshot signals", () => {
    const businessBrain = createBusinessBrain();
    addPositiveSignals(businessBrain);
    businessBrain.addRisk({
      id: "risk-1" as RiskId,
      title: "Revenue concentration",
      summary: "Revenue remains concentrated in one offer.",
      createdAt: "2026-06-29T04:00:00.000Z",
    });

    const evaluator = new DefaultBusinessHealthEvaluator();
    const businessHealth = evaluator.evaluate(businessBrain.toSnapshot());

    expect(businessHealth.toSnapshot()).toMatchObject({
      score: 60,
      status: "strong",
      evaluatedAt: "2026-06-29T04:00:00.000Z",
      summary: "Business health is strong based on current Business Brain signals.",
    });
    expect(businessHealth.toSnapshot().dimensions).toEqual([
      {
        name: "operations",
        score: 60,
        summary: "1 observation signal(s) available.",
      },
      {
        name: "customer",
        score: 62,
        summary: "1 insight signal(s) registered.",
      },
      {
        name: "revenue",
        score: 62,
        summary: "1 opportunity signal(s) registered.",
      },
      {
        name: "risk",
        score: 80,
        summary: "1 risk signal(s) registered.",
      },
    ]);
  });

  it("clamps high baseline scores to excellent", () => {
    const businessBrain = createBusinessBrain();

    for (let index = 0; index < 12; index += 1) {
      businessBrain.ingestObservation({
        id: `observation-${index}` as ObservationId,
        source: "analytics",
        summary: `Observation ${index}`,
        observedAt: `2026-06-29T${String(index + 1).padStart(2, "0")}:00:00.000Z`,
      });
    }

    const businessHealth = new DefaultBusinessHealthEvaluator().evaluate(
      businessBrain.toSnapshot()
    );

    expect(businessHealth.toSnapshot()).toMatchObject({
      score: 100,
      status: "excellent",
    });
  });

  it("clamps low baseline scores to critical", () => {
    const businessBrain = createBusinessBrain();

    for (let index = 0; index < 8; index += 1) {
      businessBrain.addRisk({
        id: `risk-${index}` as RiskId,
        title: `Risk ${index}`,
        summary: `Risk summary ${index}`,
        createdAt: `2026-06-29T${String(index + 1).padStart(2, "0")}:00:00.000Z`,
      });
    }

    const businessHealth = new DefaultBusinessHealthEvaluator().evaluate(
      businessBrain.toSnapshot()
    );

    expect(businessHealth.toSnapshot()).toMatchObject({
      score: 0,
      status: "critical",
    });
  });

  it("exports health model and evaluator through public barrels", () => {
    expect(PublicBusinessHealth).toBe(BusinessHealth);
    expect(PublicDefaultBusinessHealthEvaluator).toBe(
      DefaultBusinessHealthEvaluator
    );
  });
});
