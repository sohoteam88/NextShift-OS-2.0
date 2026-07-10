import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";

export type OpportunityEvaluationId = Brand<string, "OpportunityEvaluationId">;
export type OpportunityEvaluationTitle = Brand<
  string,
  "OpportunityEvaluationTitle"
>;
export type OpportunityEvaluationSummary = Brand<
  string,
  "OpportunityEvaluationSummary"
>;

export type OpportunityEvaluationStatus =
  | "draft"
  | "evaluated"
  | "accepted"
  | "rejected"
  | "archived";

export type OpportunityEvaluationPriority = "low" | "medium" | "high" | "critical";

export type OpportunityEvaluationSourceType =
  | "lead"
  | "customer"
  | "content"
  | "campaign"
  | "manual"
  | "system";

export interface OpportunitySourceSnapshot {
  readonly type: OpportunityEvaluationSourceType;
  readonly referenceId: string;
  readonly summary: string;
}

export interface OpportunityScoreSnapshot {
  readonly marketFit: number;
  readonly businessValue: number;
  readonly urgency: number;
  readonly effort: number;
  readonly confidence: number;
  readonly total: number;
  readonly priority: OpportunityEvaluationPriority;
}

export interface OpportunityEvaluationSnapshot {
  readonly evaluationId: OpportunityEvaluationId;
  readonly businessId: BusinessId;
  readonly title: OpportunityEvaluationTitle;
  readonly summary: OpportunityEvaluationSummary;
  readonly source: OpportunitySourceSnapshot;
  readonly status: OpportunityEvaluationStatus;
  readonly score?: OpportunityScoreSnapshot;
  readonly decisionReason?: string;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly evaluatedAt?: Timestamp;
  readonly acceptedAt?: Timestamp;
  readonly rejectedAt?: Timestamp;
  readonly archivedAt?: Timestamp;
}

export interface CreateOpportunityEvaluationInput {
  readonly evaluationId: OpportunityEvaluationId;
  readonly businessId: BusinessId;
  readonly title: string;
  readonly summary: string;
  readonly source: OpportunitySourceSnapshot;
  readonly createdAt: Timestamp;
}

export interface EvaluateOpportunityInput {
  readonly marketFit: number;
  readonly businessValue: number;
  readonly urgency: number;
  readonly effort: number;
  readonly confidence: number;
  readonly evaluatedAt: Timestamp;
}

export interface DecideOpportunityInput {
  readonly reason?: string;
  readonly decidedAt: Timestamp;
}

export interface OpportunityEvaluationEventMetadata {
  readonly eventId: EventId;
  readonly eventType: OpportunityEvaluationEventType;
  readonly aggregateId: OpportunityEvaluationId;
  readonly aggregateType: "OpportunityEvaluation";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type OpportunityEvaluationEventType =
  | "OpportunityEvaluationCreated"
  | "OpportunityEvaluated"
  | "OpportunityAccepted"
  | "OpportunityRejected"
  | "OpportunityEvaluationArchived";

export interface OpportunityEvaluationCreatedEvent
  extends OpportunityEvaluationEventMetadata {
  readonly eventType: "OpportunityEvaluationCreated";
  readonly payload: {
    readonly evaluationId: OpportunityEvaluationId;
    readonly businessId: BusinessId;
    readonly title: OpportunityEvaluationTitle;
    readonly summary: OpportunityEvaluationSummary;
    readonly source: OpportunitySourceSnapshot;
    readonly createdAt: Timestamp;
  };
}

export interface OpportunityEvaluatedEvent
  extends OpportunityEvaluationEventMetadata {
  readonly eventType: "OpportunityEvaluated";
  readonly payload: {
    readonly evaluationId: OpportunityEvaluationId;
    readonly score: OpportunityScoreSnapshot;
    readonly evaluatedAt: Timestamp;
  };
}

export interface OpportunityAcceptedEvent
  extends OpportunityEvaluationEventMetadata {
  readonly eventType: "OpportunityAccepted";
  readonly payload: {
    readonly evaluationId: OpportunityEvaluationId;
    readonly reason?: string;
    readonly acceptedAt: Timestamp;
  };
}

export interface OpportunityRejectedEvent
  extends OpportunityEvaluationEventMetadata {
  readonly eventType: "OpportunityRejected";
  readonly payload: {
    readonly evaluationId: OpportunityEvaluationId;
    readonly reason?: string;
    readonly rejectedAt: Timestamp;
  };
}

export interface OpportunityEvaluationArchivedEvent
  extends OpportunityEvaluationEventMetadata {
  readonly eventType: "OpportunityEvaluationArchived";
  readonly payload: {
    readonly evaluationId: OpportunityEvaluationId;
    readonly archivedAt: Timestamp;
  };
}

export type OpportunityEvaluationDomainEvent =
  | OpportunityEvaluationCreatedEvent
  | OpportunityEvaluatedEvent
  | OpportunityAcceptedEvent
  | OpportunityRejectedEvent
  | OpportunityEvaluationArchivedEvent;

export class OpportunityEvaluation {
  private constructor(private snapshot: OpportunityEvaluationSnapshot) {}

  static create(input: CreateOpportunityEvaluationInput): OpportunityEvaluation {
    const timestamp = createTimestamp(input.createdAt, "createdAt");

    return new OpportunityEvaluation({
      evaluationId: input.evaluationId,
      businessId: input.businessId,
      title: createOpportunityEvaluationTitle(input.title),
      summary: createOpportunityEvaluationSummary(input.summary),
      source: createOpportunityEvaluationSource(input.source),
      status: "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static rehydrate(
    snapshot: OpportunityEvaluationSnapshot
  ): OpportunityEvaluation {
    validateSnapshot(snapshot);
    return new OpportunityEvaluation(cloneSnapshot(snapshot));
  }

  get evaluationId(): OpportunityEvaluationId {
    return this.snapshot.evaluationId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get status(): OpportunityEvaluationStatus {
    return this.snapshot.status;
  }

  get priority(): OpportunityEvaluationPriority | null {
    return this.snapshot.score?.priority ?? null;
  }

  evaluate(input: EvaluateOpportunityInput): void {
    this.assertMutable();

    const evaluatedAt = createTimestamp(input.evaluatedAt, "evaluatedAt");
    const score = createOpportunityScore(input);

    this.replace({
      ...this.snapshot,
      status: "evaluated",
      score,
      evaluatedAt,
      updatedAt: evaluatedAt,
      acceptedAt: undefined,
      rejectedAt: undefined,
      decisionReason: undefined,
    });
  }

  accept(input: DecideOpportunityInput): void {
    this.assertEvaluated();

    const acceptedAt = createTimestamp(input.decidedAt, "acceptedAt");

    this.replace({
      ...this.snapshot,
      status: "accepted",
      decisionReason:
        input.reason === undefined
          ? undefined
          : createRequiredString(input.reason, "Opportunity decision reason"),
      acceptedAt,
      rejectedAt: undefined,
      updatedAt: acceptedAt,
    });
  }

  reject(input: DecideOpportunityInput): void {
    this.assertEvaluated();

    const rejectedAt = createTimestamp(input.decidedAt, "rejectedAt");

    this.replace({
      ...this.snapshot,
      status: "rejected",
      decisionReason:
        input.reason === undefined
          ? undefined
          : createRequiredString(input.reason, "Opportunity decision reason"),
      rejectedAt,
      acceptedAt: undefined,
      updatedAt: rejectedAt,
    });
  }

  archive(archivedAt: Timestamp): void {
    if (this.snapshot.status === "archived") {
      return;
    }

    const timestamp = createTimestamp(archivedAt, "archivedAt");

    this.replace({
      ...this.snapshot,
      status: "archived",
      archivedAt: timestamp,
      updatedAt: timestamp,
    });
  }

  toSnapshot(): OpportunityEvaluationSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  private assertMutable(): void {
    if (this.snapshot.status === "archived") {
      throw new Error("Archived opportunity evaluations cannot be modified.");
    }
  }

  private assertEvaluated(): void {
    this.assertMutable();

    if (this.snapshot.status !== "evaluated") {
      throw new Error("Only evaluated opportunities can receive decisions.");
    }
  }

  private replace(snapshot: OpportunityEvaluationSnapshot): void {
    validateSnapshot(snapshot);
    this.snapshot = cloneSnapshot(snapshot);
  }
}

export function createOpportunityEvaluationTitle(
  value: string
): OpportunityEvaluationTitle {
  return createRequiredString(
    value,
    "Opportunity evaluation title"
  ) as OpportunityEvaluationTitle;
}

export function createOpportunityEvaluationSummary(
  value: string
): OpportunityEvaluationSummary {
  return createRequiredString(
    value,
    "Opportunity evaluation summary"
  ) as OpportunityEvaluationSummary;
}

export function createOpportunityEvaluationSource(
  source: OpportunitySourceSnapshot
): OpportunitySourceSnapshot {
  if (!isOpportunityEvaluationSourceType(source.type)) {
    throw new Error(`Unsupported opportunity source type: ${source.type}.`);
  }

  return Object.freeze({
    type: source.type,
    referenceId: createRequiredString(
      source.referenceId,
      "Opportunity source referenceId"
    ),
    summary: createRequiredString(source.summary, "Opportunity source summary"),
  });
}

export function createOpportunityScore(
  input: Omit<EvaluateOpportunityInput, "evaluatedAt">
): OpportunityScoreSnapshot {
  const marketFit = createScoreComponent(input.marketFit, "marketFit");
  const businessValue = createScoreComponent(input.businessValue, "businessValue");
  const urgency = createScoreComponent(input.urgency, "urgency");
  const effort = createScoreComponent(input.effort, "effort");
  const confidence = createScoreComponent(input.confidence, "confidence");
  const total = Math.round(
    (marketFit + businessValue + urgency + confidence + (100 - effort)) / 5
  );

  return Object.freeze({
    marketFit,
    businessValue,
    urgency,
    effort,
    confidence,
    total,
    priority: deriveOpportunityEvaluationPriority(total),
  });
}

export function deriveOpportunityEvaluationPriority(total: number): OpportunityEvaluationPriority {
  const score = createScoreComponent(total, "total");

  if (score < 40) {
    return "low";
  }

  if (score < 70) {
    return "medium";
  }

  if (score < 90) {
    return "high";
  }

  return "critical";
}

function validateSnapshot(snapshot: OpportunityEvaluationSnapshot): void {
  createOpportunityEvaluationTitle(snapshot.title);
  createOpportunityEvaluationSummary(snapshot.summary);
  createOpportunityEvaluationSource(snapshot.source);
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");

  if (snapshot.score) {
    createOpportunityScore(snapshot.score);
  }

  if (snapshot.evaluatedAt !== undefined) {
    createTimestamp(snapshot.evaluatedAt, "evaluatedAt");
  }

  if (snapshot.acceptedAt !== undefined) {
    createTimestamp(snapshot.acceptedAt, "acceptedAt");
  }

  if (snapshot.rejectedAt !== undefined) {
    createTimestamp(snapshot.rejectedAt, "rejectedAt");
  }

  if (snapshot.archivedAt !== undefined) {
    createTimestamp(snapshot.archivedAt, "archivedAt");
  }

  if (snapshot.status === "evaluated" && !snapshot.score) {
    throw new Error("Evaluated opportunities require a score.");
  }

  if (snapshot.status === "accepted" && !snapshot.acceptedAt) {
    throw new Error("Accepted opportunities require acceptedAt.");
  }

  if (snapshot.status === "rejected" && !snapshot.rejectedAt) {
    throw new Error("Rejected opportunities require rejectedAt.");
  }

  if (snapshot.status === "archived" && !snapshot.archivedAt) {
    throw new Error("Archived opportunity evaluations require archivedAt.");
  }

  if (snapshot.decisionReason !== undefined) {
    createRequiredString(snapshot.decisionReason, "Opportunity decision reason");
  }
}

function createScoreComponent(value: number, field: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Opportunity score ${field} must be numeric.`);
  }

  if (!Number.isFinite(value)) {
    throw new Error(`Opportunity score ${field} must be finite.`);
  }

  if (value < 0 || value > 100) {
    throw new Error(`Opportunity score ${field} must be between 0 and 100.`);
  }

  return value;
}

function isOpportunityEvaluationSourceType(
  value: string
): value is OpportunityEvaluationSourceType {
  return ["lead", "customer", "content", "campaign", "manual", "system"].includes(
    value
  );
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
    throw new Error(`Opportunity evaluation ${field} must be a valid timestamp.`);
  }

  return value;
}

function cloneSnapshot(
  snapshot: OpportunityEvaluationSnapshot
): OpportunityEvaluationSnapshot {
  return {
    ...snapshot,
    source: { ...snapshot.source },
    score: snapshot.score === undefined ? undefined : { ...snapshot.score },
  };
}
