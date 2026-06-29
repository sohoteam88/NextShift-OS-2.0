import { describe, expect, it } from "vitest";
import {
  BusinessBrain,
  DefaultOpportunityDetector,
  OpportunityDetectionResult,
  createDetectedOpportunity,
  createOpportunityConfidence,
  createOpportunitySource,
  deriveOpportunityPriority,
  type BusinessBrainId,
  type BusinessInsightId,
  type BusinessProfileId,
  type DetectedOpportunityId,
  type ObservationId,
  type OpportunityId,
  type RiskId,
} from "../src/business-brain";
import {
  DefaultOpportunityDetector as PublicDefaultOpportunityDetector,
  OpportunityDetectionResult as PublicOpportunityDetectionResult,
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
  timestamp = "2026-06-29T01:00:00.000Z"
): void {
  businessBrain.ingestObservation({
    id: "observation-1" as ObservationId,
    source: "analytics",
    summary: "Lead conversion improved.",
    observedAt: timestamp,
  });
}

function addInsight(
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
  id = "risk-1",
  timestamp = "2026-06-29T04:00:00.000Z"
): void {
  businessBrain.addRisk({
    id: id as RiskId,
    title: "Revenue concentration",
    summary: "Revenue remains concentrated in one offer.",
    createdAt: timestamp,
  });
}

describe("Opportunity detection model", () => {
  it("creates detected opportunities with derived priority", () => {
    const opportunity = createDetectedOpportunity({
      id: "detected-opportunity-1" as DetectedOpportunityId,
      title: "Scale follow-up workflow",
      summary: "Follow-up speed can improve conversion.",
      confidence: 0.8,
      source: {
        type: "manual",
        referenceId: "opportunity-1",
        summary: "Existing opportunity.",
      },
      detectedAt: "2026-06-29T06:00:00.000Z",
    });

    expect(opportunity).toEqual({
      id: "detected-opportunity-1",
      title: "Scale follow-up workflow",
      summary: "Follow-up speed can improve conversion.",
      priority: "high",
      confidence: 0.8,
      source: {
        type: "manual",
        referenceId: "opportunity-1",
        summary: "Existing opportunity.",
      },
      detectedAt: "2026-06-29T06:00:00.000Z",
    });
    expect(Object.isFrozen(opportunity)).toBe(true);
    expect(Object.isFrozen(opportunity.source)).toBe(true);
  });

  it("validates confidence", () => {
    expect(() => createOpportunityConfidence(Number.NaN)).toThrow(
      "Opportunity confidence must be numeric."
    );
    expect(() => createOpportunityConfidence(Number.POSITIVE_INFINITY)).toThrow(
      "Opportunity confidence must be finite."
    );
    expect(() => createOpportunityConfidence(1.01)).toThrow(
      "Opportunity confidence must be between 0 and 1."
    );
  });

  it("derives priority from confidence bands", () => {
    expect(deriveOpportunityPriority(0)).toBe("low");
    expect(deriveOpportunityPriority(0.39)).toBe("low");
    expect(deriveOpportunityPriority(0.4)).toBe("medium");
    expect(deriveOpportunityPriority(0.69)).toBe("medium");
    expect(deriveOpportunityPriority(0.7)).toBe("high");
    expect(deriveOpportunityPriority(0.89)).toBe("high");
    expect(deriveOpportunityPriority(0.9)).toBe("critical");
    expect(deriveOpportunityPriority(1)).toBe("critical");
  });

  it("validates opportunity source fields", () => {
    expect(() =>
      createOpportunitySource({
        type: "unsupported" as "manual",
        referenceId: "source-1",
        summary: "Unsupported source.",
      })
    ).toThrow("Unsupported opportunity source type: unsupported.");

    expect(() =>
      createOpportunitySource({
        type: "manual",
        referenceId: " ",
        summary: "Missing reference.",
      })
    ).toThrow("Opportunity source referenceId is required.");

    expect(() =>
      createOpportunitySource({
        type: "manual",
        referenceId: "source-1",
        summary: " ",
      })
    ).toThrow("Opportunity source summary is required.");
  });

  it("validates detection result fields and protects result mutation", () => {
    const opportunity = createDetectedOpportunity({
      id: "detected-opportunity-1" as DetectedOpportunityId,
      title: "Scale follow-up workflow",
      summary: "Follow-up speed can improve conversion.",
      confidence: 0.8,
      source: {
        type: "manual",
        referenceId: "opportunity-1",
        summary: "Existing opportunity.",
      },
      detectedAt: "2026-06-29T06:00:00.000Z",
    });
    const result = OpportunityDetectionResult.create({
      opportunities: [opportunity],
      detectedAt: "2026-06-29T06:00:00.000Z",
      summary: "1 opportunity detected.",
    });
    const snapshot = result.toSnapshot();

    expect(snapshot.opportunities).toHaveLength(1);
    expect(Object.isFrozen(snapshot.opportunities)).toBe(true);
    expect(Object.isFrozen(snapshot.opportunities[0]?.source)).toBe(true);
    expect(() =>
      OpportunityDetectionResult.create({
        opportunities: [],
        detectedAt: "not-a-date",
        summary: "Invalid timestamp.",
      })
    ).toThrow("Opportunity detection detectedAt must be a valid timestamp.");
    expect(() =>
      OpportunityDetectionResult.create({
        opportunities: [],
        detectedAt: "2026-06-29T06:00:00.000Z",
        summary: " ",
      })
    ).toThrow("OpportunityDetectionResult summary is required.");
  });
});

describe("DefaultOpportunityDetector", () => {
  it("converts existing opportunities into detected opportunities", () => {
    const businessBrain = createBusinessBrain();
    addOpportunity(businessBrain);

    const result = new DefaultOpportunityDetector()
      .detect(businessBrain.toSnapshot())
      .toSnapshot();

    expect(result).toMatchObject({
      detectedAt: "2026-06-29T03:00:00.000Z",
      summary: "1 opportunity detected from current Business Brain signals.",
    });
    expect(result.opportunities).toEqual([
      {
        id: "detected-opportunity:manual:opportunity-1",
        title: "Scale webinar follow-up",
        summary: "Webinar follow-up can create more qualified sales calls.",
        priority: "high",
        confidence: 0.8,
        source: {
          type: "manual",
          referenceId: "opportunity-1",
          summary: "Existing Business Brain opportunity.",
        },
        detectedAt: "2026-06-29T03:00:00.000Z",
      },
    ]);
  });

  it("generates insight-derived opportunity when no opportunities exist", () => {
    const businessBrain = createBusinessBrain();
    addObservation(businessBrain);
    addInsight(businessBrain);

    const result = new DefaultOpportunityDetector()
      .detect(businessBrain.toSnapshot())
      .toSnapshot();

    expect(result.opportunities).toEqual([
      {
        id: "detected-opportunity:insight:insight-1",
        title: "Act on insight: Conversion quality improved",
        summary: "Qualified conversion improved after campaign optimization.",
        priority: "medium",
        confidence: 0.65,
        source: {
          type: "insight",
          referenceId: "insight-1",
          summary: "Qualified conversion improved after campaign optimization.",
        },
        detectedAt: "2026-06-29T02:00:00.000Z",
      },
    ]);
  });

  it("generates risk mitigation opportunity when risks outnumber opportunities", () => {
    const businessBrain = createBusinessBrain();
    addOpportunity(businessBrain);
    addRisk(businessBrain, "risk-1", "2026-06-29T04:00:00.000Z");
    addRisk(businessBrain, "risk-2", "2026-06-29T05:00:00.000Z");

    const result = new DefaultOpportunityDetector()
      .detect(businessBrain.toSnapshot())
      .toSnapshot();

    expect(result.opportunities).toHaveLength(2);
    expect(result.opportunities[1]).toEqual({
      id: "detected-opportunity:risk:risk-2",
      title: "Mitigate risk: Revenue concentration",
      summary: "Revenue remains concentrated in one offer.",
      priority: "high",
      confidence: 0.7,
      source: {
        type: "risk",
        referenceId: "risk-2",
        summary: "Revenue remains concentrated in one offer.",
      },
      detectedAt: "2026-06-29T05:00:00.000Z",
    });
  });

  it("returns empty result when no signals exist", () => {
    const businessBrain = createBusinessBrain();

    const result = new DefaultOpportunityDetector()
      .detect(businessBrain.toSnapshot())
      .toSnapshot();

    expect(result).toEqual({
      opportunities: [],
      detectedAt: createdAt,
      summary:
        "No opportunity signals are available in the current Business Brain snapshot.",
    });
  });

  it("uses deterministic ids and does not mutate BusinessBrain", () => {
    const businessBrain = createBusinessBrain();
    addInsight(businessBrain);
    const before = businessBrain.toSnapshot();
    const detector = new DefaultOpportunityDetector();

    const first = detector.detect(businessBrain.toSnapshot()).toSnapshot();
    const second = detector.detect(businessBrain.toSnapshot()).toSnapshot();

    expect(first.opportunities[0]?.id).toBe(
      "detected-opportunity:insight:insight-1"
    );
    expect(second).toEqual(first);
    expect(businessBrain.toSnapshot()).toEqual(before);
  });

  it("exports opportunity detection through public barrels", () => {
    expect(PublicOpportunityDetectionResult).toBe(OpportunityDetectionResult);
    expect(PublicDefaultOpportunityDetector).toBe(DefaultOpportunityDetector);
  });
});
