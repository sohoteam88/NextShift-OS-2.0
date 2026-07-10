import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";
import type { RevenueForecastSnapshot } from "../revenue-forecast";
import type { RevenueTargetId } from "../revenue-target";

export type RevenueForecastReviewId = Brand<string, "RevenueForecastReviewId">;

export type RevenueForecastReviewStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "archived";

export interface RevenueForecastReviewSnapshot {
  readonly reviewId: RevenueForecastReviewId;
  readonly businessId: BusinessId;
  readonly revenueTargetId: RevenueTargetId;
  readonly forecast: RevenueForecastSnapshot;
  readonly status: RevenueForecastReviewStatus;
  readonly reviewNotes?: string;
  readonly reviewer?: string;
  readonly decisionReason?: string;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly submittedAt?: Timestamp;
  readonly approvedAt?: Timestamp;
  readonly rejectedAt?: Timestamp;
  readonly archivedAt?: Timestamp;
}

export interface CreateRevenueForecastReviewInput {
  readonly reviewId: RevenueForecastReviewId;
  readonly businessId: BusinessId;
  readonly forecast: RevenueForecastSnapshot;
  readonly reviewNotes?: string;
  readonly createdAt: Timestamp;
}

export interface RevenueForecastReviewDecisionInput {
  readonly reviewer: string;
  readonly reason?: string;
  readonly decidedAt: Timestamp;
}

export interface RevenueForecastReviewEventMetadata {
  readonly eventId: EventId;
  readonly eventType: RevenueForecastReviewEventType;
  readonly aggregateId: RevenueForecastReviewId;
  readonly aggregateType: "RevenueForecastReview";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type RevenueForecastReviewEventType =
  | "RevenueForecastReviewCreated"
  | "RevenueForecastReviewSubmitted"
  | "RevenueForecastReviewApproved"
  | "RevenueForecastReviewRejected"
  | "RevenueForecastReviewArchived";

export interface RevenueForecastReviewCreatedEvent
  extends RevenueForecastReviewEventMetadata {
  readonly eventType: "RevenueForecastReviewCreated";
  readonly payload: {
    readonly reviewId: RevenueForecastReviewId;
    readonly businessId: BusinessId;
    readonly revenueTargetId: RevenueTargetId;
    readonly forecast: RevenueForecastSnapshot;
    readonly reviewNotes?: string;
    readonly createdAt: Timestamp;
  };
}

export interface RevenueForecastReviewSubmittedEvent
  extends RevenueForecastReviewEventMetadata {
  readonly eventType: "RevenueForecastReviewSubmitted";
  readonly payload: {
    readonly reviewId: RevenueForecastReviewId;
    readonly submittedAt: Timestamp;
  };
}

export interface RevenueForecastReviewApprovedEvent
  extends RevenueForecastReviewEventMetadata {
  readonly eventType: "RevenueForecastReviewApproved";
  readonly payload: {
    readonly reviewId: RevenueForecastReviewId;
    readonly reviewer: string;
    readonly reason?: string;
    readonly approvedAt: Timestamp;
  };
}

export interface RevenueForecastReviewRejectedEvent
  extends RevenueForecastReviewEventMetadata {
  readonly eventType: "RevenueForecastReviewRejected";
  readonly payload: {
    readonly reviewId: RevenueForecastReviewId;
    readonly reviewer: string;
    readonly reason?: string;
    readonly rejectedAt: Timestamp;
  };
}

export interface RevenueForecastReviewArchivedEvent
  extends RevenueForecastReviewEventMetadata {
  readonly eventType: "RevenueForecastReviewArchived";
  readonly payload: {
    readonly reviewId: RevenueForecastReviewId;
    readonly archivedAt: Timestamp;
  };
}

export type RevenueForecastReviewDomainEvent =
  | RevenueForecastReviewCreatedEvent
  | RevenueForecastReviewSubmittedEvent
  | RevenueForecastReviewApprovedEvent
  | RevenueForecastReviewRejectedEvent
  | RevenueForecastReviewArchivedEvent;

export class RevenueForecastReview {
  private constructor(private snapshot: RevenueForecastReviewSnapshot) {}

  static create(input: CreateRevenueForecastReviewInput): RevenueForecastReview {
    const timestamp = createTimestamp(input.createdAt, "createdAt");
    validateForecast(input.forecast, input.businessId);

    return new RevenueForecastReview({
      reviewId: input.reviewId,
      businessId: input.businessId,
      revenueTargetId: input.forecast.revenueTargetId,
      forecast: cloneForecast(input.forecast),
      status: "draft",
      reviewNotes:
        input.reviewNotes === undefined
          ? undefined
          : createRequiredString(input.reviewNotes, "Revenue forecast review notes"),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static rehydrate(snapshot: RevenueForecastReviewSnapshot): RevenueForecastReview {
    validateSnapshot(snapshot);
    return new RevenueForecastReview(cloneSnapshot(snapshot));
  }

  get reviewId(): RevenueForecastReviewId {
    return this.snapshot.reviewId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get revenueTargetId(): RevenueTargetId {
    return this.snapshot.revenueTargetId;
  }

  get status(): RevenueForecastReviewStatus {
    return this.snapshot.status;
  }

  submit(submittedAt: Timestamp): void {
    this.assertStatus("draft", "pending_review");

    const timestamp = createTimestamp(submittedAt, "submittedAt");

    this.replace({
      ...this.snapshot,
      status: "pending_review",
      submittedAt: timestamp,
      updatedAt: timestamp,
    });
  }

  approve(input: RevenueForecastReviewDecisionInput): void {
    this.assertStatus("pending_review", "approved");

    const approvedAt = createTimestamp(input.decidedAt, "approvedAt");

    this.replace({
      ...this.snapshot,
      status: "approved",
      reviewer: createRequiredString(input.reviewer, "Revenue forecast reviewer"),
      decisionReason:
        input.reason === undefined
          ? undefined
          : createRequiredString(input.reason, "Revenue forecast review reason"),
      approvedAt,
      rejectedAt: undefined,
      updatedAt: approvedAt,
    });
  }

  reject(input: RevenueForecastReviewDecisionInput): void {
    this.assertStatus("pending_review", "rejected");

    const rejectedAt = createTimestamp(input.decidedAt, "rejectedAt");

    this.replace({
      ...this.snapshot,
      status: "rejected",
      reviewer: createRequiredString(input.reviewer, "Revenue forecast reviewer"),
      decisionReason:
        input.reason === undefined
          ? undefined
          : createRequiredString(input.reason, "Revenue forecast review reason"),
      rejectedAt,
      approvedAt: undefined,
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

  toSnapshot(): RevenueForecastReviewSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  private assertStatus(
    expected: RevenueForecastReviewStatus,
    next: RevenueForecastReviewStatus
  ): void {
    if (this.snapshot.status === "archived") {
      throw new Error("Archived revenue forecast reviews cannot be mutated.");
    }

    if (this.snapshot.status !== expected) {
      throw new Error(
        `Only ${expected} revenue forecast reviews can transition to ${next}.`
      );
    }
  }

  private replace(snapshot: RevenueForecastReviewSnapshot): void {
    validateSnapshot(snapshot);
    this.snapshot = cloneSnapshot(snapshot);
  }
}

function validateSnapshot(snapshot: RevenueForecastReviewSnapshot): void {
  validateForecast(snapshot.forecast, snapshot.businessId);
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");

  if (snapshot.revenueTargetId !== snapshot.forecast.revenueTargetId) {
    throw new Error("Revenue forecast review target must match forecast target.");
  }

  if (snapshot.reviewNotes !== undefined) {
    createRequiredString(snapshot.reviewNotes, "Revenue forecast review notes");
  }
  if (snapshot.reviewer !== undefined) {
    createRequiredString(snapshot.reviewer, "Revenue forecast reviewer");
  }
  if (snapshot.decisionReason !== undefined) {
    createRequiredString(snapshot.decisionReason, "Revenue forecast review reason");
  }
  if (snapshot.submittedAt) createTimestamp(snapshot.submittedAt, "submittedAt");
  if (snapshot.approvedAt) createTimestamp(snapshot.approvedAt, "approvedAt");
  if (snapshot.rejectedAt) createTimestamp(snapshot.rejectedAt, "rejectedAt");
  if (snapshot.archivedAt) createTimestamp(snapshot.archivedAt, "archivedAt");

  if (snapshot.status === "pending_review" && !snapshot.submittedAt) {
    throw new Error("Pending revenue forecast reviews require submittedAt.");
  }

  if (snapshot.status === "approved" && !snapshot.approvedAt) {
    throw new Error("Approved revenue forecast reviews require approvedAt.");
  }

  if (snapshot.status === "rejected" && !snapshot.rejectedAt) {
    throw new Error("Rejected revenue forecast reviews require rejectedAt.");
  }

  if (snapshot.status === "archived" && !snapshot.archivedAt) {
    throw new Error("Archived revenue forecast reviews require archivedAt.");
  }
}

function validateForecast(
  forecast: RevenueForecastSnapshot,
  businessId: BusinessId
): void {
  if (forecast.businessId !== businessId) {
    throw new Error("Revenue forecast review business must match forecast business.");
  }

  createTimestamp(forecast.asOf, "forecast.asOf");
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
    throw new Error(`Revenue forecast review ${field} must be a valid timestamp.`);
  }

  return value;
}

function cloneSnapshot(
  snapshot: RevenueForecastReviewSnapshot
): RevenueForecastReviewSnapshot {
  return {
    ...snapshot,
    forecast: cloneForecast(snapshot.forecast),
  };
}

function cloneForecast(forecast: RevenueForecastSnapshot): RevenueForecastSnapshot {
  return {
    ...forecast,
    targetPeriod: Object.freeze({ ...forecast.targetPeriod }),
  };
}
