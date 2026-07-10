import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";

export type AnalyticsInsightReviewId = Brand<string, "AnalyticsInsightReviewId">;
export type AnalyticsInsightReviewTitle = Brand<
  string,
  "AnalyticsInsightReviewTitle"
>;
export type AnalyticsInsightReviewSummary = Brand<
  string,
  "AnalyticsInsightReviewSummary"
>;

export type AnalyticsInsightReviewCategory =
  | "crm"
  | "content"
  | "opportunity"
  | "campaign"
  | "revenue"
  | "customer"
  | "operational"
  | "strategic";

export type AnalyticsInsightReviewPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type AnalyticsInsightReviewSourceType =
  | "crm"
  | "content"
  | "opportunity"
  | "campaign"
  | "revenue_forecast"
  | "analytics"
  | "manual"
  | "system";

export type AnalyticsInsightReviewStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "dismissed"
  | "archived";

export interface AnalyticsInsightReviewSourceSnapshot {
  readonly type: AnalyticsInsightReviewSourceType;
  readonly referenceId: string;
  readonly summary: string;
}

export interface AnalyticsInsightReviewSnapshot {
  readonly reviewId: AnalyticsInsightReviewId;
  readonly businessId: BusinessId;
  readonly title: AnalyticsInsightReviewTitle;
  readonly summary: AnalyticsInsightReviewSummary;
  readonly category: AnalyticsInsightReviewCategory;
  readonly priority: AnalyticsInsightReviewPriority;
  readonly sources: readonly AnalyticsInsightReviewSourceSnapshot[];
  readonly status: AnalyticsInsightReviewStatus;
  readonly reviewer?: string;
  readonly approvalReason?: string;
  readonly dismissalReason?: string;
  readonly submittedAt?: Timestamp;
  readonly approvedAt?: Timestamp;
  readonly dismissedAt?: Timestamp;
  readonly archivedAt?: Timestamp;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface CreateAnalyticsInsightReviewInput {
  readonly reviewId: AnalyticsInsightReviewId;
  readonly businessId: BusinessId;
  readonly title: string;
  readonly summary: string;
  readonly category: AnalyticsInsightReviewCategory;
  readonly priority: AnalyticsInsightReviewPriority;
  readonly sources: readonly AnalyticsInsightReviewSourceSnapshot[];
  readonly createdAt: Timestamp;
}

export interface ApproveAnalyticsInsightReviewInput {
  readonly reviewer: string;
  readonly reason?: string;
  readonly approvedAt: Timestamp;
}

export interface DismissAnalyticsInsightReviewInput {
  readonly reviewer: string;
  readonly reason: string;
  readonly dismissedAt: Timestamp;
}

export interface AnalyticsInsightReviewEventMetadata {
  readonly eventId: EventId;
  readonly eventType: AnalyticsInsightReviewEventType;
  readonly aggregateId: AnalyticsInsightReviewId;
  readonly aggregateType: "AnalyticsInsightReview";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type AnalyticsInsightReviewEventType =
  | "AnalyticsInsightReviewCreated"
  | "AnalyticsInsightReviewSubmitted"
  | "AnalyticsInsightReviewApproved"
  | "AnalyticsInsightReviewDismissed"
  | "AnalyticsInsightReviewArchived";

export interface AnalyticsInsightReviewCreatedEvent
  extends AnalyticsInsightReviewEventMetadata {
  readonly eventType: "AnalyticsInsightReviewCreated";
  readonly payload: {
    readonly reviewId: AnalyticsInsightReviewId;
    readonly businessId: BusinessId;
    readonly title: AnalyticsInsightReviewTitle;
    readonly summary: AnalyticsInsightReviewSummary;
    readonly category: AnalyticsInsightReviewCategory;
    readonly priority: AnalyticsInsightReviewPriority;
    readonly sources: readonly AnalyticsInsightReviewSourceSnapshot[];
    readonly createdAt: Timestamp;
  };
}

export interface AnalyticsInsightReviewSubmittedEvent
  extends AnalyticsInsightReviewEventMetadata {
  readonly eventType: "AnalyticsInsightReviewSubmitted";
  readonly payload: {
    readonly reviewId: AnalyticsInsightReviewId;
    readonly submittedAt: Timestamp;
  };
}

export interface AnalyticsInsightReviewApprovedEvent
  extends AnalyticsInsightReviewEventMetadata {
  readonly eventType: "AnalyticsInsightReviewApproved";
  readonly payload: {
    readonly reviewId: AnalyticsInsightReviewId;
    readonly reviewer: string;
    readonly reason?: string;
    readonly approvedAt: Timestamp;
  };
}

export interface AnalyticsInsightReviewDismissedEvent
  extends AnalyticsInsightReviewEventMetadata {
  readonly eventType: "AnalyticsInsightReviewDismissed";
  readonly payload: {
    readonly reviewId: AnalyticsInsightReviewId;
    readonly reviewer: string;
    readonly reason: string;
    readonly dismissedAt: Timestamp;
  };
}

export interface AnalyticsInsightReviewArchivedEvent
  extends AnalyticsInsightReviewEventMetadata {
  readonly eventType: "AnalyticsInsightReviewArchived";
  readonly payload: {
    readonly reviewId: AnalyticsInsightReviewId;
    readonly archivedAt: Timestamp;
  };
}

export type AnalyticsInsightReviewDomainEvent =
  | AnalyticsInsightReviewCreatedEvent
  | AnalyticsInsightReviewSubmittedEvent
  | AnalyticsInsightReviewApprovedEvent
  | AnalyticsInsightReviewDismissedEvent
  | AnalyticsInsightReviewArchivedEvent;

export class AnalyticsInsightReview {
  private constructor(private snapshot: AnalyticsInsightReviewSnapshot) {}

  static create(input: CreateAnalyticsInsightReviewInput): AnalyticsInsightReview {
    const timestamp = createTimestamp(input.createdAt, "createdAt");

    return new AnalyticsInsightReview({
      reviewId: input.reviewId,
      businessId: input.businessId,
      title: createAnalyticsInsightReviewTitle(input.title),
      summary: createAnalyticsInsightReviewSummary(input.summary),
      category: createAnalyticsInsightReviewCategory(input.category),
      priority: createAnalyticsInsightReviewPriority(input.priority),
      sources: createAnalyticsInsightReviewSources(input.sources),
      status: "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static rehydrate(
    snapshot: AnalyticsInsightReviewSnapshot
  ): AnalyticsInsightReview {
    validateSnapshot(snapshot);
    return new AnalyticsInsightReview(cloneSnapshot(snapshot));
  }

  get reviewId(): AnalyticsInsightReviewId {
    return this.snapshot.reviewId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get status(): AnalyticsInsightReviewStatus {
    return this.snapshot.status;
  }

  get priority(): AnalyticsInsightReviewPriority {
    return this.snapshot.priority;
  }

  get category(): AnalyticsInsightReviewCategory {
    return this.snapshot.category;
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

  approve(input: ApproveAnalyticsInsightReviewInput): void {
    this.assertStatus("pending_review", "approved");
    const approvedAt = createTimestamp(input.approvedAt, "approvedAt");

    this.replace({
      ...this.snapshot,
      status: "approved",
      reviewer: createRequiredString(input.reviewer, "Analytics insight reviewer"),
      approvalReason:
        input.reason === undefined
          ? undefined
          : createRequiredString(input.reason, "Analytics insight approval reason"),
      dismissalReason: undefined,
      approvedAt,
      dismissedAt: undefined,
      updatedAt: approvedAt,
    });
  }

  dismiss(input: DismissAnalyticsInsightReviewInput): void {
    this.assertStatus("pending_review", "dismissed");
    const dismissedAt = createTimestamp(input.dismissedAt, "dismissedAt");

    this.replace({
      ...this.snapshot,
      status: "dismissed",
      reviewer: createRequiredString(input.reviewer, "Analytics insight reviewer"),
      dismissalReason: createRequiredString(
        input.reason,
        "Analytics insight dismissal reason"
      ),
      approvalReason: undefined,
      dismissedAt,
      approvedAt: undefined,
      updatedAt: dismissedAt,
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

  toSnapshot(): AnalyticsInsightReviewSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  private assertStatus(
    expected: AnalyticsInsightReviewStatus,
    next: AnalyticsInsightReviewStatus
  ): void {
    if (this.snapshot.status === "archived") {
      throw new Error("Archived analytics insight reviews cannot be mutated.");
    }

    if (this.snapshot.status !== expected) {
      throw new Error(
        `Only ${expected} analytics insight reviews can transition to ${next}.`
      );
    }
  }

  private replace(snapshot: AnalyticsInsightReviewSnapshot): void {
    validateSnapshot(snapshot);
    this.snapshot = cloneSnapshot(snapshot);
  }
}

export function createAnalyticsInsightReviewTitle(
  value: string
): AnalyticsInsightReviewTitle {
  return createRequiredString(
    value,
    "Analytics insight title"
  ) as AnalyticsInsightReviewTitle;
}

export function createAnalyticsInsightReviewSummary(
  value: string
): AnalyticsInsightReviewSummary {
  return createRequiredString(
    value,
    "Analytics insight summary"
  ) as AnalyticsInsightReviewSummary;
}

export function createAnalyticsInsightReviewCategory(
  value: AnalyticsInsightReviewCategory
): AnalyticsInsightReviewCategory {
  if (!isAnalyticsInsightReviewCategory(value)) {
    throw new Error(`Unsupported analytics insight category: ${value}.`);
  }

  return value;
}

export function createAnalyticsInsightReviewPriority(
  value: AnalyticsInsightReviewPriority
): AnalyticsInsightReviewPriority {
  if (!isAnalyticsInsightReviewPriority(value)) {
    throw new Error(`Unsupported analytics insight priority: ${value}.`);
  }

  return value;
}

export function createAnalyticsInsightReviewSources(
  sources: readonly AnalyticsInsightReviewSourceSnapshot[]
): readonly AnalyticsInsightReviewSourceSnapshot[] {
  if (sources.length === 0) {
    throw new Error("At least one analytics insight source is required.");
  }

  return Object.freeze(sources.map(createAnalyticsInsightReviewSource));
}

export function createAnalyticsInsightReviewSource(
  source: AnalyticsInsightReviewSourceSnapshot
): AnalyticsInsightReviewSourceSnapshot {
  if (!isAnalyticsInsightReviewSourceType(source.type)) {
    throw new Error(`Unsupported analytics insight source type: ${source.type}.`);
  }

  return Object.freeze({
    type: source.type,
    referenceId: createRequiredString(
      source.referenceId,
      "Analytics insight source referenceId"
    ),
    summary: createRequiredString(
      source.summary,
      "Analytics insight source summary"
    ),
  });
}

function validateSnapshot(snapshot: AnalyticsInsightReviewSnapshot): void {
  createAnalyticsInsightReviewTitle(snapshot.title);
  createAnalyticsInsightReviewSummary(snapshot.summary);
  createAnalyticsInsightReviewCategory(snapshot.category);
  createAnalyticsInsightReviewPriority(snapshot.priority);
  createAnalyticsInsightReviewSources(snapshot.sources);
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");

  if (snapshot.reviewer !== undefined) {
    createRequiredString(snapshot.reviewer, "Analytics insight reviewer");
  }
  if (snapshot.approvalReason !== undefined) {
    createRequiredString(
      snapshot.approvalReason,
      "Analytics insight approval reason"
    );
  }
  if (snapshot.dismissalReason !== undefined) {
    createRequiredString(
      snapshot.dismissalReason,
      "Analytics insight dismissal reason"
    );
  }
  if (snapshot.submittedAt) createTimestamp(snapshot.submittedAt, "submittedAt");
  if (snapshot.approvedAt) createTimestamp(snapshot.approvedAt, "approvedAt");
  if (snapshot.dismissedAt) createTimestamp(snapshot.dismissedAt, "dismissedAt");
  if (snapshot.archivedAt) createTimestamp(snapshot.archivedAt, "archivedAt");

  if (snapshot.status === "pending_review" && !snapshot.submittedAt) {
    throw new Error("Pending analytics insight reviews require submittedAt.");
  }

  if (snapshot.status === "approved" && !snapshot.approvedAt) {
    throw new Error("Approved analytics insight reviews require approvedAt.");
  }

  if (snapshot.status === "dismissed") {
    if (!snapshot.dismissedAt) {
      throw new Error("Dismissed analytics insight reviews require dismissedAt.");
    }
    if (!snapshot.dismissalReason) {
      throw new Error(
        "Dismissed analytics insight reviews require dismissalReason."
      );
    }
  }

  if (snapshot.status === "archived" && !snapshot.archivedAt) {
    throw new Error("Archived analytics insight reviews require archivedAt.");
  }
}

function isAnalyticsInsightReviewCategory(
  value: string
): value is AnalyticsInsightReviewCategory {
  return [
    "crm",
    "content",
    "opportunity",
    "campaign",
    "revenue",
    "customer",
    "operational",
    "strategic",
  ].includes(value);
}

function isAnalyticsInsightReviewPriority(
  value: string
): value is AnalyticsInsightReviewPriority {
  return ["low", "medium", "high", "critical"].includes(value);
}

function isAnalyticsInsightReviewSourceType(
  value: string
): value is AnalyticsInsightReviewSourceType {
  return [
    "crm",
    "content",
    "opportunity",
    "campaign",
    "revenue_forecast",
    "analytics",
    "manual",
    "system",
  ].includes(value);
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
    throw new Error(`Analytics insight review ${field} must be a valid timestamp.`);
  }

  return value;
}

function cloneSnapshot(
  snapshot: AnalyticsInsightReviewSnapshot
): AnalyticsInsightReviewSnapshot {
  return {
    ...snapshot,
    sources: cloneSources(snapshot.sources),
  };
}

function cloneSources(
  sources: readonly AnalyticsInsightReviewSourceSnapshot[]
): readonly AnalyticsInsightReviewSourceSnapshot[] {
  return Object.freeze(sources.map((source) => ({ ...source })));
}
