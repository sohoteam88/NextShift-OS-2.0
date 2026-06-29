import { describe, expect, it } from "vitest";
import {
  BusinessBrain,
  InMemoryBusinessBrainRepository,
  type BrainSnapshotId,
  type BusinessBrainId,
  type BusinessInsightId,
  type BusinessProfileId,
  type ObservationId,
  type OpportunityId,
  type RiskId,
} from "../src/business-brain";

const businessBrainId = "business-brain-1" as BusinessBrainId;
const businessProfileId = "business-profile-1" as BusinessProfileId;
const createdAt = "2026-06-29T00:00:00.000Z";

function createBusinessBrain(
  id: BusinessBrainId = businessBrainId
): BusinessBrain {
  return BusinessBrain.create({
    id,
    businessProfileId,
    createdAt,
  });
}

function ingestObservation(
  businessBrain: BusinessBrain,
  observedAt = "2026-06-29T01:00:00.000Z"
): void {
  businessBrain.ingestObservation({
    id: "observation-1" as ObservationId,
    source: "analytics",
    summary: "Lead conversion improved after campaign optimization.",
    observedAt,
  });
}

function addInsight(
  businessBrain: BusinessBrain,
  created = "2026-06-29T02:00:00.000Z"
): void {
  businessBrain.addInsight({
    id: "insight-1" as BusinessInsightId,
    title: "Campaign quality is improving",
    summary: "Recent campaign data shows stronger conversion efficiency.",
    createdAt: created,
  });
}

function addOpportunity(
  businessBrain: BusinessBrain,
  created = "2026-06-29T03:00:00.000Z"
): void {
  businessBrain.addOpportunity({
    id: "opportunity-1" as OpportunityId,
    title: "Scale webinar follow-up",
    summary: "Follow-up speed can convert more qualified webinar leads.",
    createdAt: created,
  });
}

function addRisk(
  businessBrain: BusinessBrain,
  created = "2026-06-29T04:00:00.000Z"
): void {
  businessBrain.addRisk({
    id: "risk-1" as RiskId,
    title: "Revenue concentration",
    summary: "Revenue remains concentrated in one offer segment.",
    createdAt: created,
  });
}

describe("BusinessBrain aggregate", () => {
  it("creates an empty business brain for one business profile", () => {
    const businessBrain = createBusinessBrain();

    expect(businessBrain.toSnapshot()).toEqual({
      id: businessBrainId,
      businessProfileId,
      observations: [],
      insights: [],
      opportunities: [],
      risks: [],
      snapshots: [],
      createdAt,
      updatedAt: createdAt,
    });
  });

  it("requires valid aggregate identity and business profile identity", () => {
    expect(() =>
      BusinessBrain.create({
        id: " " as BusinessBrainId,
        businessProfileId,
        createdAt,
      })
    ).toThrow("BusinessBrain id is required.");

    expect(() =>
      BusinessBrain.create({
        id: businessBrainId,
        businessProfileId: " " as BusinessProfileId,
        createdAt,
      })
    ).toThrow("BusinessProfileId is required.");
  });

  it("validates observation inputs", () => {
    const businessBrain = createBusinessBrain();

    expect(() =>
      businessBrain.ingestObservation({
        id: " " as ObservationId,
        source: "analytics",
        summary: "Qualified lead volume increased.",
        observedAt: "2026-06-29T01:00:00.000Z",
      })
    ).toThrow("Observation id is required.");

    expect(() =>
      businessBrain.ingestObservation({
        id: "observation-1" as ObservationId,
        source: " ",
        summary: "Qualified lead volume increased.",
        observedAt: "2026-06-29T01:00:00.000Z",
      })
    ).toThrow("Observation source is required.");

    expect(() =>
      businessBrain.ingestObservation({
        id: "observation-1" as ObservationId,
        source: "analytics",
        summary: " ",
        observedAt: "2026-06-29T01:00:00.000Z",
      })
    ).toThrow("Observation summary is required.");
  });

  it("ingests observations and updates updatedAt", () => {
    const businessBrain = createBusinessBrain();

    ingestObservation(businessBrain);

    expect(businessBrain.getObservations()).toEqual([
      {
        id: "observation-1",
        source: "analytics",
        summary: "Lead conversion improved after campaign optimization.",
        observedAt: "2026-06-29T01:00:00.000Z",
      },
    ]);
    expect(businessBrain.toSnapshot().updatedAt).toBe(
      "2026-06-29T01:00:00.000Z"
    );
  });

  it("adds insights, opportunities, and risks", () => {
    const businessBrain = createBusinessBrain();

    addInsight(businessBrain);
    addOpportunity(businessBrain);
    addRisk(businessBrain);

    expect(businessBrain.getInsights()).toHaveLength(1);
    expect(businessBrain.getOpportunities()).toHaveLength(1);
    expect(businessBrain.getRisks()).toHaveLength(1);
    expect(businessBrain.toSnapshot().updatedAt).toBe(
      "2026-06-29T04:00:00.000Z"
    );
  });

  it("requires valid insight, opportunity, and risk fields", () => {
    const businessBrain = createBusinessBrain();

    expect(() =>
      businessBrain.addInsight({
        id: "insight-1" as BusinessInsightId,
        title: " ",
        summary: "Insight summary.",
        createdAt: "2026-06-29T01:00:00.000Z",
      })
    ).toThrow("BusinessInsight title is required.");

    expect(() =>
      businessBrain.addOpportunity({
        id: "opportunity-1" as OpportunityId,
        title: "Expansion opportunity",
        summary: " ",
        createdAt: "2026-06-29T01:00:00.000Z",
      })
    ).toThrow("Opportunity summary is required.");

    expect(() =>
      businessBrain.addRisk({
        id: "risk-1" as RiskId,
        title: " ",
        summary: "Risk summary.",
        createdAt: "2026-06-29T01:00:00.000Z",
      })
    ).toThrow("Risk title is required.");
  });

  it("creates snapshots that capture aggregate state", () => {
    const businessBrain = createBusinessBrain();

    ingestObservation(businessBrain);
    addInsight(businessBrain);
    addOpportunity(businessBrain);
    addRisk(businessBrain);

    const snapshot = businessBrain.createSnapshot({
      id: "brain-snapshot-1" as BrainSnapshotId,
      capturedAt: "2026-06-29T05:00:00.000Z",
    });

    expect(snapshot).toMatchObject({
      id: "brain-snapshot-1",
      capturedAt: "2026-06-29T05:00:00.000Z",
    });
    expect(snapshot.observations).toHaveLength(1);
    expect(snapshot.insights).toHaveLength(1);
    expect(snapshot.opportunities).toHaveLength(1);
    expect(snapshot.risks).toHaveLength(1);
    expect(businessBrain.getSnapshots()).toHaveLength(1);
    expect(businessBrain.toSnapshot().updatedAt).toBe(
      "2026-06-29T05:00:00.000Z"
    );
  });

  it("requires updatedAt to change when the aggregate changes", () => {
    const businessBrain = createBusinessBrain();

    expect(() =>
      businessBrain.ingestObservation({
        id: "observation-1" as ObservationId,
        source: "analytics",
        summary: "Lead conversion improved.",
        observedAt: createdAt,
      })
    ).toThrow("BusinessBrain updatedAt must change when aggregate changes.");
  });

  it("does not expose mutable aggregate internals", () => {
    const businessBrain = createBusinessBrain();

    ingestObservation(businessBrain);

    const observations = businessBrain.getObservations();
    const snapshot = businessBrain.toSnapshot();

    expect(Object.isFrozen(observations)).toBe(true);
    expect(Object.isFrozen(observations[0])).toBe(true);
    expect(() =>
      (observations as unknown as unknown[]).push({
        id: "observation-2",
      })
    ).toThrow();
    expect(() => {
      (snapshot.observations[0] as unknown as { summary: string }).summary =
        "Mutated externally.";
    }).toThrow();
    expect(businessBrain.getObservations()[0]?.summary).toBe(
      "Lead conversion improved after campaign optimization."
    );
  });

  it("rehydrates only valid snapshots", () => {
    const snapshot = createBusinessBrain().toSnapshot();

    expect(BusinessBrain.rehydrate(snapshot).toSnapshot()).toEqual(snapshot);
    expect(() =>
      BusinessBrain.rehydrate({
        ...snapshot,
        id: " " as BusinessBrainId,
      })
    ).toThrow("BusinessBrain id is required.");
  });
});

describe("InMemoryBusinessBrainRepository", () => {
  it("saves and retrieves business brains by id", async () => {
    const repository = new InMemoryBusinessBrainRepository();
    const businessBrain = createBusinessBrain();

    await repository.save(businessBrain);

    expect((await repository.findById(businessBrainId))?.toSnapshot()).toEqual(
      businessBrain.toSnapshot()
    );
  });

  it("returns null when a business brain is not found", async () => {
    const repository = new InMemoryBusinessBrainRepository();

    expect(await repository.findById(businessBrainId)).toBeNull();
  });

  it("does not leak mutable state across repository boundaries", async () => {
    const repository = new InMemoryBusinessBrainRepository();
    const businessBrain = createBusinessBrain();

    ingestObservation(businessBrain);
    await repository.save(businessBrain);

    const retrieved = await repository.findById(businessBrainId);
    retrieved?.ingestObservation({
      id: "observation-2" as ObservationId,
      source: "crm",
      summary: "A new high-fit lead entered the pipeline.",
      observedAt: "2026-06-29T02:00:00.000Z",
    });

    const stored = await repository.findById(businessBrainId);

    expect(stored?.getObservations()).toHaveLength(1);
  });
});
