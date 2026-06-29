import type { Brand, Timestamp } from "@nextshift/shared";

export type BusinessBrainId = Brand<string, "BusinessBrainId">;
export type BusinessProfileId = Brand<string, "BusinessProfileId">;
export type ObservationId = Brand<string, "ObservationId">;
export type BusinessInsightId = Brand<string, "BusinessInsightId">;
export type OpportunityId = Brand<string, "OpportunityId">;
export type RiskId = Brand<string, "RiskId">;
export type BrainSnapshotId = Brand<string, "BrainSnapshotId">;

export interface Observation {
  readonly id: ObservationId;
  readonly source: string;
  readonly summary: string;
  readonly observedAt: Timestamp;
}

export interface BusinessInsight {
  readonly id: BusinessInsightId;
  readonly title: string;
  readonly summary: string;
  readonly createdAt: Timestamp;
}

export interface Opportunity {
  readonly id: OpportunityId;
  readonly title: string;
  readonly summary: string;
  readonly createdAt: Timestamp;
}

export interface Risk {
  readonly id: RiskId;
  readonly title: string;
  readonly summary: string;
  readonly createdAt: Timestamp;
}

export interface BrainSnapshot {
  readonly id: BrainSnapshotId;
  readonly capturedAt: Timestamp;
  readonly observations: readonly Observation[];
  readonly insights: readonly BusinessInsight[];
  readonly opportunities: readonly Opportunity[];
  readonly risks: readonly Risk[];
}

export interface BusinessBrainSnapshot {
  readonly id: BusinessBrainId;
  readonly businessProfileId: BusinessProfileId;
  readonly observations: readonly Observation[];
  readonly insights: readonly BusinessInsight[];
  readonly opportunities: readonly Opportunity[];
  readonly risks: readonly Risk[];
  readonly snapshots: readonly BrainSnapshot[];
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface CreateBusinessBrainInput {
  readonly id: BusinessBrainId;
  readonly businessProfileId: BusinessProfileId;
  readonly createdAt: Timestamp;
}

export interface ObservationInput {
  readonly id: ObservationId;
  readonly source: string;
  readonly summary: string;
  readonly observedAt: Timestamp;
}

export interface BusinessInsightInput {
  readonly id: BusinessInsightId;
  readonly title: string;
  readonly summary: string;
  readonly createdAt: Timestamp;
}

export interface OpportunityInput {
  readonly id: OpportunityId;
  readonly title: string;
  readonly summary: string;
  readonly createdAt: Timestamp;
}

export interface RiskInput {
  readonly id: RiskId;
  readonly title: string;
  readonly summary: string;
  readonly createdAt: Timestamp;
}

export interface CreateBrainSnapshotInput {
  readonly id: BrainSnapshotId;
  readonly capturedAt: Timestamp;
}

export class BusinessBrain {
  private constructor(private snapshot: BusinessBrainSnapshot) {}

  static create(input: CreateBusinessBrainInput): BusinessBrain {
    const createdAt = createTimestamp(input.createdAt, "createdAt");

    return new BusinessBrain({
      id: createBusinessBrainId(input.id),
      businessProfileId: createBusinessProfileId(input.businessProfileId),
      observations: Object.freeze([]),
      insights: Object.freeze([]),
      opportunities: Object.freeze([]),
      risks: Object.freeze([]),
      snapshots: Object.freeze([]),
      createdAt,
      updatedAt: createdAt,
    });
  }

  static rehydrate(snapshot: BusinessBrainSnapshot): BusinessBrain {
    validateBusinessBrainSnapshot(snapshot);
    return new BusinessBrain(cloneBusinessBrainSnapshot(snapshot));
  }

  get id(): BusinessBrainId {
    return this.snapshot.id;
  }

  get businessProfileId(): BusinessProfileId {
    return this.snapshot.businessProfileId;
  }

  ingestObservation(input: ObservationInput): void {
    const observation = createObservation(input);
    this.assertMutationTimestamp(observation.observedAt);

    this.replace({
      ...this.snapshot,
      observations: Object.freeze([
        ...this.snapshot.observations,
        observation,
      ]),
      updatedAt: observation.observedAt,
    });
  }

  addInsight(input: BusinessInsightInput): void {
    const insight = createBusinessInsight(input);
    this.assertMutationTimestamp(insight.createdAt);

    this.replace({
      ...this.snapshot,
      insights: Object.freeze([...this.snapshot.insights, insight]),
      updatedAt: insight.createdAt,
    });
  }

  addOpportunity(input: OpportunityInput): void {
    const opportunity = createOpportunity(input);
    this.assertMutationTimestamp(opportunity.createdAt);

    this.replace({
      ...this.snapshot,
      opportunities: Object.freeze([
        ...this.snapshot.opportunities,
        opportunity,
      ]),
      updatedAt: opportunity.createdAt,
    });
  }

  addRisk(input: RiskInput): void {
    const risk = createRisk(input);
    this.assertMutationTimestamp(risk.createdAt);

    this.replace({
      ...this.snapshot,
      risks: Object.freeze([...this.snapshot.risks, risk]),
      updatedAt: risk.createdAt,
    });
  }

  createSnapshot(input: CreateBrainSnapshotInput): BrainSnapshot {
    const capturedAt = createTimestamp(input.capturedAt, "capturedAt");
    this.assertMutationTimestamp(capturedAt);

    const brainSnapshot = createBrainSnapshot({
      id: input.id,
      capturedAt,
      observations: this.snapshot.observations,
      insights: this.snapshot.insights,
      opportunities: this.snapshot.opportunities,
      risks: this.snapshot.risks,
    });

    this.replace({
      ...this.snapshot,
      snapshots: Object.freeze([...this.snapshot.snapshots, brainSnapshot]),
      updatedAt: capturedAt,
    });

    return cloneBrainSnapshot(brainSnapshot);
  }

  getObservations(): readonly Observation[] {
    return cloneObservations(this.snapshot.observations);
  }

  getInsights(): readonly BusinessInsight[] {
    return cloneBusinessInsights(this.snapshot.insights);
  }

  getOpportunities(): readonly Opportunity[] {
    return cloneOpportunities(this.snapshot.opportunities);
  }

  getRisks(): readonly Risk[] {
    return cloneRisks(this.snapshot.risks);
  }

  getSnapshots(): readonly BrainSnapshot[] {
    return cloneBrainSnapshots(this.snapshot.snapshots);
  }

  toSnapshot(): BusinessBrainSnapshot {
    return cloneBusinessBrainSnapshot(this.snapshot);
  }

  private assertMutationTimestamp(timestamp: Timestamp): void {
    if (timestamp === this.snapshot.updatedAt) {
      throw new Error(
        "BusinessBrain updatedAt must change when aggregate changes."
      );
    }
  }

  private replace(snapshot: BusinessBrainSnapshot): void {
    validateBusinessBrainSnapshot(snapshot);
    this.snapshot = cloneBusinessBrainSnapshot(snapshot);
  }
}

export function createBusinessBrainId(id: BusinessBrainId): BusinessBrainId {
  return createRequiredString(id, "BusinessBrain id") as BusinessBrainId;
}

export function createBusinessProfileId(
  businessProfileId: BusinessProfileId
): BusinessProfileId {
  return createRequiredString(
    businessProfileId,
    "BusinessProfileId"
  ) as BusinessProfileId;
}

export function createObservation(input: ObservationInput): Observation {
  return Object.freeze({
    id: createRequiredString(input.id, "Observation id") as ObservationId,
    source: createRequiredString(input.source, "Observation source"),
    summary: createRequiredString(input.summary, "Observation summary"),
    observedAt: createTimestamp(input.observedAt, "observedAt"),
  });
}

export function createBusinessInsight(
  input: BusinessInsightInput
): BusinessInsight {
  return Object.freeze({
    id: createRequiredString(
      input.id,
      "BusinessInsight id"
    ) as BusinessInsightId,
    title: createRequiredString(input.title, "BusinessInsight title"),
    summary: createRequiredString(input.summary, "BusinessInsight summary"),
    createdAt: createTimestamp(input.createdAt, "insight.createdAt"),
  });
}

export function createOpportunity(input: OpportunityInput): Opportunity {
  return Object.freeze({
    id: createRequiredString(input.id, "Opportunity id") as OpportunityId,
    title: createRequiredString(input.title, "Opportunity title"),
    summary: createRequiredString(input.summary, "Opportunity summary"),
    createdAt: createTimestamp(input.createdAt, "opportunity.createdAt"),
  });
}

export function createRisk(input: RiskInput): Risk {
  return Object.freeze({
    id: createRequiredString(input.id, "Risk id") as RiskId,
    title: createRequiredString(input.title, "Risk title"),
    summary: createRequiredString(input.summary, "Risk summary"),
    createdAt: createTimestamp(input.createdAt, "risk.createdAt"),
  });
}

function createBrainSnapshot(input: {
  readonly id: BrainSnapshotId;
  readonly capturedAt: Timestamp;
  readonly observations: readonly Observation[];
  readonly insights: readonly BusinessInsight[];
  readonly opportunities: readonly Opportunity[];
  readonly risks: readonly Risk[];
}): BrainSnapshot {
  return Object.freeze({
    id: createRequiredString(input.id, "BrainSnapshot id") as BrainSnapshotId,
    capturedAt: createTimestamp(input.capturedAt, "capturedAt"),
    observations: cloneObservations(input.observations),
    insights: cloneBusinessInsights(input.insights),
    opportunities: cloneOpportunities(input.opportunities),
    risks: cloneRisks(input.risks),
  });
}

function validateBusinessBrainSnapshot(snapshot: BusinessBrainSnapshot): void {
  createBusinessBrainId(snapshot.id);
  createBusinessProfileId(snapshot.businessProfileId);
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");
  snapshot.observations.forEach(validateObservation);
  snapshot.insights.forEach(validateBusinessInsight);
  snapshot.opportunities.forEach(validateOpportunity);
  snapshot.risks.forEach(validateRisk);
  snapshot.snapshots.forEach(validateBrainSnapshot);
}

function validateObservation(observation: Observation): void {
  createObservation(observation);
}

function validateBusinessInsight(insight: BusinessInsight): void {
  createBusinessInsight(insight);
}

function validateOpportunity(opportunity: Opportunity): void {
  createOpportunity(opportunity);
}

function validateRisk(risk: Risk): void {
  createRisk(risk);
}

function validateBrainSnapshot(snapshot: BrainSnapshot): void {
  createBrainSnapshot(snapshot);
}

function createRequiredString(value: string, label: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function createTimestamp(value: Timestamp, field: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`BusinessBrain ${field} must be a valid timestamp.`);
  }

  return value;
}

function cloneBusinessBrainSnapshot(
  snapshot: BusinessBrainSnapshot
): BusinessBrainSnapshot {
  return {
    ...snapshot,
    observations: cloneObservations(snapshot.observations),
    insights: cloneBusinessInsights(snapshot.insights),
    opportunities: cloneOpportunities(snapshot.opportunities),
    risks: cloneRisks(snapshot.risks),
    snapshots: cloneBrainSnapshots(snapshot.snapshots),
  };
}

function cloneObservations(
  observations: readonly Observation[]
): readonly Observation[] {
  return Object.freeze(
    observations.map((observation) =>
      Object.freeze({
        ...observation,
      })
    )
  );
}

function cloneBusinessInsights(
  insights: readonly BusinessInsight[]
): readonly BusinessInsight[] {
  return Object.freeze(
    insights.map((insight) =>
      Object.freeze({
        ...insight,
      })
    )
  );
}

function cloneOpportunities(
  opportunities: readonly Opportunity[]
): readonly Opportunity[] {
  return Object.freeze(
    opportunities.map((opportunity) =>
      Object.freeze({
        ...opportunity,
      })
    )
  );
}

function cloneRisks(risks: readonly Risk[]): readonly Risk[] {
  return Object.freeze(
    risks.map((risk) =>
      Object.freeze({
        ...risk,
      })
    )
  );
}

function cloneBrainSnapshot(snapshot: BrainSnapshot): BrainSnapshot {
  return Object.freeze({
    ...snapshot,
    observations: cloneObservations(snapshot.observations),
    insights: cloneBusinessInsights(snapshot.insights),
    opportunities: cloneOpportunities(snapshot.opportunities),
    risks: cloneRisks(snapshot.risks),
  });
}

function cloneBrainSnapshots(
  snapshots: readonly BrainSnapshot[]
): readonly BrainSnapshot[] {
  return Object.freeze(snapshots.map(cloneBrainSnapshot));
}
