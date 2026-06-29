import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";
import type { ContentId } from ".";
import { createContentPlatform, type ContentPlatform } from "./calendar";
import type {
  ContentRecommendationId,
  ContentRecommendationSetId,
} from "./recommendation";
import type { ContentVariantSetId } from "./variant";

export type ContentExecutionId = Brand<string, "ContentExecutionId">;
export type ContentExecutionNote = Brand<string, "ContentExecutionNote">;

export type ContentExecutionStatus =
  | "planned"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled"
  | "archived";

export interface ContentExecutionSnapshot {
  readonly executionId: ContentExecutionId;
  readonly businessId: BusinessId;
  readonly recommendationSetId: ContentRecommendationSetId;
  readonly recommendationId: ContentRecommendationId;
  readonly variantSetId: ContentVariantSetId;
  readonly contentId: ContentId;
  readonly platform: ContentPlatform;
  readonly status: ContentExecutionStatus;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly scheduledFor?: Timestamp;
  readonly scheduledAt?: Timestamp;
  readonly startedAt?: Timestamp;
  readonly completedAt?: Timestamp;
  readonly failedAt?: Timestamp;
  readonly cancelledAt?: Timestamp;
  readonly archivedAt?: Timestamp;
  readonly note?: ContentExecutionNote;
}

export interface CreateContentExecutionInput {
  readonly executionId: ContentExecutionId;
  readonly businessId: BusinessId;
  readonly recommendationSetId: ContentRecommendationSetId;
  readonly recommendationId: ContentRecommendationId;
  readonly variantSetId: ContentVariantSetId;
  readonly contentId: ContentId;
  readonly platform: string;
  readonly createdAt: Timestamp;
}

export interface ContentExecutionEventMetadata {
  readonly eventId: EventId;
  readonly eventType: ContentExecutionEventType;
  readonly aggregateId: ContentExecutionId;
  readonly aggregateType: "ContentExecution";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type ContentExecutionEventType =
  | "ContentExecutionCreated"
  | "ContentExecutionScheduled"
  | "ContentExecutionStarted"
  | "ContentExecutionCompleted"
  | "ContentExecutionFailed"
  | "ContentExecutionCancelled"
  | "ContentExecutionArchived"
  | "ContentExecutionRestored";

export interface ContentExecutionCreatedEvent
  extends ContentExecutionEventMetadata {
  readonly eventType: "ContentExecutionCreated";
  readonly payload: ContentExecutionSnapshot;
}

export interface ContentExecutionScheduledEvent
  extends ContentExecutionEventMetadata {
  readonly eventType: "ContentExecutionScheduled";
  readonly payload: {
    readonly executionId: ContentExecutionId;
    readonly scheduledFor: Timestamp;
    readonly scheduledAt: Timestamp;
  };
}

export interface ContentExecutionStartedEvent
  extends ContentExecutionEventMetadata {
  readonly eventType: "ContentExecutionStarted";
  readonly payload: {
    readonly executionId: ContentExecutionId;
    readonly startedAt: Timestamp;
  };
}

export interface ContentExecutionCompletedEvent
  extends ContentExecutionEventMetadata {
  readonly eventType: "ContentExecutionCompleted";
  readonly payload: {
    readonly executionId: ContentExecutionId;
    readonly completedAt: Timestamp;
    readonly note?: ContentExecutionNote;
  };
}

export interface ContentExecutionFailedEvent
  extends ContentExecutionEventMetadata {
  readonly eventType: "ContentExecutionFailed";
  readonly payload: {
    readonly executionId: ContentExecutionId;
    readonly failedAt: Timestamp;
    readonly note: ContentExecutionNote;
  };
}

export interface ContentExecutionCancelledEvent
  extends ContentExecutionEventMetadata {
  readonly eventType: "ContentExecutionCancelled";
  readonly payload: {
    readonly executionId: ContentExecutionId;
    readonly cancelledAt: Timestamp;
    readonly note?: ContentExecutionNote;
  };
}

export interface ContentExecutionArchivedEvent
  extends ContentExecutionEventMetadata {
  readonly eventType: "ContentExecutionArchived";
  readonly payload: {
    readonly executionId: ContentExecutionId;
    readonly archivedAt: Timestamp;
  };
}

export interface ContentExecutionRestoredEvent
  extends ContentExecutionEventMetadata {
  readonly eventType: "ContentExecutionRestored";
  readonly payload: {
    readonly executionId: ContentExecutionId;
    readonly restoredAt: Timestamp;
  };
}

export type ContentExecutionDomainEvent =
  | ContentExecutionCreatedEvent
  | ContentExecutionScheduledEvent
  | ContentExecutionStartedEvent
  | ContentExecutionCompletedEvent
  | ContentExecutionFailedEvent
  | ContentExecutionCancelledEvent
  | ContentExecutionArchivedEvent
  | ContentExecutionRestoredEvent;

export class ContentExecution {
  private constructor(private snapshot: ContentExecutionSnapshot) {}

  static create(input: CreateContentExecutionInput): ContentExecution {
    const timestamp = createTimestamp(input.createdAt, "createdAt");

    return new ContentExecution({
      executionId: input.executionId,
      businessId: input.businessId,
      recommendationSetId: input.recommendationSetId,
      recommendationId: input.recommendationId,
      variantSetId: input.variantSetId,
      contentId: input.contentId,
      platform: createContentPlatform(input.platform),
      status: "planned",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static rehydrate(snapshot: ContentExecutionSnapshot): ContentExecution {
    validateSnapshot(snapshot);
    return new ContentExecution(cloneSnapshot(snapshot));
  }

  get executionId(): ContentExecutionId {
    return this.snapshot.executionId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get recommendationSetId(): ContentRecommendationSetId {
    return this.snapshot.recommendationSetId;
  }

  get recommendationId(): ContentRecommendationId {
    return this.snapshot.recommendationId;
  }

  get variantSetId(): ContentVariantSetId {
    return this.snapshot.variantSetId;
  }

  get contentId(): ContentId {
    return this.snapshot.contentId;
  }

  get status(): ContentExecutionStatus {
    return this.snapshot.status;
  }

  schedule(scheduledFor: Timestamp, scheduledAt: Timestamp): void {
    this.assertStatus(["planned", "scheduled"]);

    const nextScheduledFor = createTimestamp(scheduledFor, "scheduledFor");
    const nextScheduledAt = createTimestamp(scheduledAt, "scheduledAt");

    this.replace({
      ...this.snapshot,
      status: "scheduled",
      scheduledFor: nextScheduledFor,
      scheduledAt: nextScheduledAt,
      updatedAt: nextScheduledAt,
    });
  }

  start(startedAt: Timestamp): void {
    this.assertStatus(["planned", "scheduled"]);

    const timestamp = createTimestamp(startedAt, "startedAt");

    this.replace({
      ...this.snapshot,
      status: "in_progress",
      startedAt: timestamp,
      updatedAt: timestamp,
    });
  }

  complete(completedAt: Timestamp, note?: string): void {
    this.assertStatus(["in_progress"]);

    const timestamp = createTimestamp(completedAt, "completedAt");

    this.replace({
      ...this.snapshot,
      status: "completed",
      completedAt: timestamp,
      note: note === undefined ? this.snapshot.note : createOptionalNote(note),
      updatedAt: timestamp,
    });
  }

  fail(failedAt: Timestamp, note: string): void {
    this.assertStatus(["scheduled", "in_progress"]);

    const timestamp = createTimestamp(failedAt, "failedAt");

    this.replace({
      ...this.snapshot,
      status: "failed",
      failedAt: timestamp,
      note: createRequiredNote(note, "failure note"),
      updatedAt: timestamp,
    });
  }

  cancel(cancelledAt: Timestamp, note?: string): void {
    this.assertStatus(["planned", "scheduled"]);

    const timestamp = createTimestamp(cancelledAt, "cancelledAt");

    this.replace({
      ...this.snapshot,
      status: "cancelled",
      cancelledAt: timestamp,
      note: note === undefined ? this.snapshot.note : createOptionalNote(note),
      updatedAt: timestamp,
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

  restore(restoredAt: Timestamp): void {
    if (this.snapshot.status !== "archived") {
      return;
    }

    const timestamp = createTimestamp(restoredAt, "restoredAt");

    this.replace({
      ...this.snapshot,
      status: "planned",
      archivedAt: undefined,
      updatedAt: timestamp,
    });
  }

  isActive(): boolean {
    return ["planned", "scheduled", "in_progress"].includes(
      this.snapshot.status
    );
  }

  toSnapshot(): ContentExecutionSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  private assertStatus(allowed: readonly ContentExecutionStatus[]): void {
    if (!allowed.includes(this.snapshot.status)) {
      throw new Error(
        `Content execution cannot transition from ${this.snapshot.status}.`
      );
    }
  }

  private replace(snapshot: ContentExecutionSnapshot): void {
    validateSnapshot(snapshot);
    this.snapshot = cloneSnapshot(snapshot);
  }
}

export function createContentExecutionNote(
  note: string
): ContentExecutionNote {
  return createRequiredNote(note, "note");
}

function createRequiredNote(
  note: string,
  field: string
): ContentExecutionNote {
  const normalized = note.trim();

  if (normalized.length === 0) {
    throw new Error(`Content execution ${field} is required.`);
  }

  return normalized as ContentExecutionNote;
}

function createOptionalNote(note: string): ContentExecutionNote | undefined {
  const normalized = note.trim();
  return normalized.length === 0
    ? undefined
    : (normalized as ContentExecutionNote);
}

function createTimestamp(value: Timestamp, field: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`Content execution ${field} must be a valid timestamp.`);
  }

  return value;
}

function validateSnapshot(snapshot: ContentExecutionSnapshot): void {
  createContentPlatform(snapshot.platform);
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");

  if (snapshot.scheduledFor) createTimestamp(snapshot.scheduledFor, "scheduledFor");
  if (snapshot.scheduledAt) createTimestamp(snapshot.scheduledAt, "scheduledAt");
  if (snapshot.startedAt) createTimestamp(snapshot.startedAt, "startedAt");
  if (snapshot.completedAt) createTimestamp(snapshot.completedAt, "completedAt");
  if (snapshot.failedAt) createTimestamp(snapshot.failedAt, "failedAt");
  if (snapshot.cancelledAt) createTimestamp(snapshot.cancelledAt, "cancelledAt");
  if (snapshot.archivedAt) createTimestamp(snapshot.archivedAt, "archivedAt");
  if (snapshot.note) createContentExecutionNote(snapshot.note);

  if (snapshot.status === "scheduled" && !snapshot.scheduledFor) {
    throw new Error("Scheduled content executions require scheduledFor.");
  }

  if (snapshot.status === "in_progress" && !snapshot.startedAt) {
    throw new Error("In-progress content executions require startedAt.");
  }

  if (snapshot.status === "completed" && !snapshot.completedAt) {
    throw new Error("Completed content executions require completedAt.");
  }

  if (snapshot.status === "failed" && (!snapshot.failedAt || !snapshot.note)) {
    throw new Error("Failed content executions require failedAt and note.");
  }

  if (snapshot.status === "cancelled" && !snapshot.cancelledAt) {
    throw new Error("Cancelled content executions require cancelledAt.");
  }

  if (snapshot.status === "archived" && !snapshot.archivedAt) {
    throw new Error("Archived content executions require archivedAt.");
  }
}

function cloneSnapshot(
  snapshot: ContentExecutionSnapshot
): ContentExecutionSnapshot {
  return { ...snapshot };
}
