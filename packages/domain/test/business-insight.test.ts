import { describe, expect, it } from "vitest";
import {
  BusinessBrain,
  DefaultBusinessInsightGenerator,
  InsightGenerationResult,
  createBusinessInsightCategory,
  createGeneratedBusinessInsight,
  createInsightConfidence,
  deriveBusinessInsightSeverity,
  type BusinessBrainId,
  type BusinessInsightId,
  type BusinessProfileId,
  type GeneratedBusinessInsightId,
  type ObservationId,
  type OpportunityId,
  type RiskId,
} from "../src/business-brain";
import {
  DefaultBusinessInsightGenerator as PublicDefaultBusinessInsightGenerator,
  InsightGenerationResult as PublicInsightGenerationResult,
} from "../src";

const businessBrainId = "business-brain-1" as BusinessBrainId;
const businessProfileId = "business-profile-1" as BusinessProfileId;
const createdAt = "2026-06-29T00:00:00.000Z";

function createBusinessBrain(): BusinessBrain {
  return BusinessBrain.create({
    id: businessBrainId,
    businessProfileId,
    createdAt,
  });
}

function addObservation(
  businessBrain: BusinessBrain,
  id: string,
  timestamp: string
): void {
  businessBrain.ingestObservation({
    id: id as ObservationId,
    source: "analytics",
    summary: `Observation ${id}`,
    observedAt: timestamp,
  });
}

function addAggregateInsight(
  businessBrain: BusinessBrain,
  timestamp = "2026-06-29T02:00:00.000Z"
): void {
  businessBrain.addInsight({
    id: "insight-1" as BusinessInsightId,
    title: "Conversion quality improved",
    summary: "Qualified conversion improved after campaign optimization.",
    createdAt: timestamp,
  });
}

function addOpportunity(
  businessBrain: BusinessBrain,
  timestamp = "2026-06-29T03:00:00.000Z"
): void {
  businessBrain.addOpportunity({
    id: "opportunity-1" as OpportunityId,
    title: "Scale webinar follow-up",
    summary: "Webinar follow-up can create more qualified sales calls.",
    createdAt: timestamp,
  });
}

function addRisk(
  businessBrain: BusinessBrain,
  timestamp = "2026-06-29T04:00:00.000Z"
): void {
  businessBrain.addRisk({
    id: "risk-1" as RiskId,
    title: "Revenue concentration",
    summary: "Revenue remains concentrated in one offer.",
    createdAt: timestamp,
  });
}

describe("Generated business insight model", () => {
  it("creates generated business insights with derived severity", () => {
    const insight = createGeneratedBusinessInsight({
      id: "generated-insight-1" as GeneratedBusinessInsightId,
      title: "Growth opportunity",
      summary: "Opportunity pipeline is improving.",
      category: "growth",
      confidence: 0.8,
      generatedAt: "2026-06-29T06:00:00.000Z",
    });

    expect(insight).toEqual({
      id: "generated-insight-1",
      title: "Growth opportunity",
      summary: "Opportunity pipeline is improving.",
      category: "growth",
      severity: "important",
      confidence: 0.8,
      generatedAt: "2026-06-29T06:00:00.000Z",
    });
    expect(Object.isFrozen(insight)).toBe(true);
  });

  it("validates confidence", () => {
    expect(() => createInsightConfidence(Number.NaN)).toThrow(
      "Business insight confidence must be numeric."
    );
    expect(() => createInsightConfidence(Number.POSITIVE_INFINITY)).toThrow(
      "Business insight confidence must be finite."
    );
    expect(() => createInsightConfidence(1.01)).toThrow(
      "Business insight confidence must be between 0 and 1."
    );
  });

  it("derives severity from confidence bands", () => {
    expect(deriveBusinessInsightSeverity(0)).toBe("informational");
    expect(deriveBusinessInsightSeverity(0.39)).toBe("informational");
    expect(deriveBusinessInsightSeverity(0.4)).toBe("advisory");
    expect(deriveBusinessInsightSeverity(0.69)).toBe("advisory");
    expect(deriveBusinessInsightSeverity(0.7)).toBe("important");
    expect(deriveBusinessInsightSeverity(0.89)).toBe("important");
    expect(deriveBusinessInsightSeverity(0.9)).toBe("critical");
    expect(deriveBusinessInsightSeverity(1)).toBe("critical");
  });

  it("validates insight category and required fields", () => {
    expect(createBusinessInsightCategory("growth")).toBe("growth");
    expect(() =>
      createBusinessInsightCategory("unsupported" as "growth")
    ).toThrow("Unsupported business insight category: unsupported.");

    expect(() =>
      createGeneratedBusinessInsight({
        id: " " as GeneratedBusinessInsightId,
        title: "Growth opportunity",
        summary: "Opportunity pipeline is improving.",
        category: "growth",
        confidence: 0.8,
        generatedAt: "2026-06-29T06:00:00.000Z",
      })
    ).toThrow("GeneratedBusinessInsight id is required.");

    expect(() =>
      createGeneratedBusinessInsight({
        id: "generated-insight-1" as GeneratedBusinessInsightId,
        title: " ",
        summary: "Opportunity pipeline is improving.",
        category: "growth",
        confidence: 0.8,
        generatedAt: "2026-06-29T06:00:00.000Z",
      })
    ).toThrow("GeneratedBusinessInsight title is required.");
  });

  it("validates insight generation result and protects snapshots", () => {
    const insight = createGeneratedBusinessInsight({
      id: "generated-insight-1" as GeneratedBusinessInsightId,
      title: "Growth opportunity",
      summary: "Opportunity pipeline is improving.",
      category: "growth",
      confidence: 0.8,
      generatedAt: "2026-06-29T06:00:00.000Z",
    });
    const result = InsightGenerationResult.create({
      insights: [insight],
      generatedAt: "2026-06-29T06:00:00.000Z",
      summary: "1 business insight generated.",
    });
    const snapshot = result.toSnapshot();

    expect(snapshot.insights).toHaveLength(1);
    expect(Object.isFrozen(snapshot.insights)).toBe(true);
    expect(Object.isFrozen(snapshot.insights[0])).toBe(true);
    expect(() =>
      InsightGenerationResult.create({
        insights: [],
        generatedAt: "not-a-date",
        summary: "Invalid timestamp.",
      })
    ).toThrow("Business insight generatedAt must be a valid timestamp.");
    expect(() =>
      InsightGenerationResult.create({
        insights: [],
        generatedAt: "2026-06-29T06:00:00.000Z",
        summary: " ",
      })
    ).toThrow("InsightGenerationResult summary is required.");
  });
});

describe("DefaultBusinessInsightGenerator", () => {
  it("generates deterministic insights from available BusinessBrain signals", () => {
    const businessBrain = createBusinessBrain();
    addObservation(businessBrain, "observation-1", "2026-06-29T01:00:00.000Z");
    addObservation(businessBrain, "observation-2", "2026-06-29T02:00:00.000Z");
    addObservation(businessBrain, "observation-3", "2026-06-29T03:00:00.000Z");
    addAggregateInsight(businessBrain, "2026-06-29T04:00:00.000Z");
    addOpportunity(businessBrain, "2026-06-29T05:00:00.000Z");
    addRisk(businessBrain, "2026-06-29T06:00:00.000Z");

    const result = new DefaultBusinessInsightGenerator()
      .generate(businessBrain.toSnapshot())
      .toSnapshot();

    expect(result).toMatchObject({
      generatedAt: "2026-06-29T06:00:00.000Z",
      summary: "4 business insights generated from current Business Brain signals.",
    });
    expect(result.insights).toEqual([
      {
        id: "generated-insight:growth:opportunity-1",
        title: "Growth opportunity: Scale webinar follow-up",
        summary: "Webinar follow-up can create more qualified sales calls.",
        category: "growth",
        severity: "important",
        confidence: 0.8,
        generatedAt: "2026-06-29T06:00:00.000Z",
      },
      {
        id: "generated-insight:risk:risk-1",
        title: "Risk signal: Revenue concentration",
        summary: "Revenue remains concentrated in one offer.",
        category: "risk",
        severity: "important",
        confidence: 0.75,
        generatedAt: "2026-06-29T06:00:00.000Z",
      },
      {
        id: "generated-insight:operations:observation-3",
        title: "Operations signal volume increased",
        summary: "3 observations are available. Latest signal: Observation observation-3",
        category: "operations",
        severity: "advisory",
        confidence: 0.65,
        generatedAt: "2026-06-29T06:00:00.000Z",
      },
      {
        id: "generated-insight:customer:insight-1",
        title: "Customer insight: Conversion quality improved",
        summary: "Qualified conversion improved after campaign optimization.",
        category: "customer",
        severity: "important",
        confidence: 0.7,
        generatedAt: "2026-06-29T06:00:00.000Z",
      },
    ]);
  });

  it("returns empty result when no signals exist", () => {
    const businessBrain = createBusinessBrain();

    const result = new DefaultBusinessInsightGenerator()
      .generate(businessBrain.toSnapshot())
      .toSnapshot();

    expect(result).toEqual({
      insights: [],
      generatedAt: createdAt,
      summary:
        "No business insight signals are available in the current Business Brain snapshot.",
    });
  });

  it("returns empty result when signals do not meet generation thresholds", () => {
    const businessBrain = createBusinessBrain();
    addObservation(businessBrain, "observation-1", "2026-06-29T01:00:00.000Z");

    const result = new DefaultBusinessInsightGenerator()
      .generate(businessBrain.toSnapshot())
      .toSnapshot();

    expect(result).toEqual({
      insights: [],
      generatedAt: "2026-06-29T01:00:00.000Z",
      summary:
        "No business insights were generated from the current Business Brain signals.",
    });
  });

  it("uses deterministic IDs and does not mutate BusinessBrain", () => {
    const businessBrain = createBusinessBrain();
    addOpportunity(businessBrain);
    const before = businessBrain.toSnapshot();
    const generator = new DefaultBusinessInsightGenerator();

    const first = generator.generate(businessBrain.toSnapshot()).toSnapshot();
    const second = generator.generate(businessBrain.toSnapshot()).toSnapshot();

    expect(first.insights[0]?.id).toBe(
      "generated-insight:growth:opportunity-1"
    );
    expect(second).toEqual(first);
    expect(businessBrain.toSnapshot()).toEqual(before);
  });

  it("exports insight generation through public barrels", () => {
    expect(PublicInsightGenerationResult).toBe(InsightGenerationResult);
    expect(PublicDefaultBusinessInsightGenerator).toBe(
      DefaultBusinessInsightGenerator
    );
  });
});
