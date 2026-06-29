import type {
  Brand,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";
import type { CustomerId } from "../customer";
import type { InteractionId } from "../interaction";

export type FollowUpId = Brand<string, "FollowUpId">;
export type DueTimestamp = Timestamp;

export type FollowUpPriority = "low" | "medium" | "high" | "urgent";
export type FollowUpStatus = "pending" | "completed" | "cancelled";

export interface FollowUpSnapshot {
  readonly followUpId: FollowUpId;
  readonly customerId: CustomerId;
  readonly interactionId?: InteractionId;
  readonly title: string;
  readonly description?: string;
  readonly priority: FollowUpPriority;
  readonly status: FollowUpStatus;
  readonly dueAt: DueTimestamp;
  readonly completedAt?: Timestamp;
  readonly cancelledAt?: Timestamp;
  readonly assignedTo?: string;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface ScheduleFollowUpInput {
  readonly followUpId: FollowUpId;
  readonly customerId: CustomerId;
  readonly interactionId?: InteractionId;
  readonly title: string;
  readonly description?: string;
  readonly priority?: string;
  readonly dueAt: Timestamp;
  readonly assignedTo?: string;
  readonly createdAt: Timestamp;
}

export interface UpdateFollowUpInput {
  readonly title?: string;
  readonly description?: string;
  readonly priority?: string;
  readonly dueAt?: Timestamp;
  readonly assignedTo?: string;
  readonly updatedAt: Timestamp;
}

export interface FollowUpEventMetadata {
  readonly eventId: EventId;
  readonly eventType: FollowUpEventType;
  readonly aggregateId: FollowUpId;
  readonly aggregateType: "FollowUp";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type FollowUpEventType =
  | "FollowUpScheduled"
  | "FollowUpUpdated"
  | "FollowUpCompleted"
  | "FollowUpCancelled"
  | "FollowUpOverdue";

export interface FollowUpScheduledPayload {
  readonly followUpId: FollowUpId;
  readonly customerId: CustomerId;
  readonly interactionId?: InteractionId;
  readonly title: string;
  readonly priority: FollowUpPriority;
  readonly dueAt: Timestamp;
  readonly assignedTo?: string;
  readonly scheduledAt: Timestamp;
}

export interface FollowUpUpdatedPayload {
  readonly followUpId: FollowUpId;
  readonly updatedFields: readonly string[];
  readonly updatedAt: Timestamp;
}

export interface FollowUpCompletedPayload {
  readonly followUpId: FollowUpId;
  readonly completedAt: Timestamp;
}

export interface FollowUpCancelledPayload {
  readonly followUpId: FollowUpId;
  readonly cancelledAt: Timestamp;
}

export interface FollowUpOverduePayload {
  readonly followUpId: FollowUpId;
  readonly customerId: CustomerId;
  readonly dueAt: Timestamp;
  readonly detectedAt: Timestamp;
}

export interface FollowUpScheduledEvent extends FollowUpEventMetadata {
  readonly eventType: "FollowUpScheduled";
  readonly payload: FollowUpScheduledPayload;
}

export interface FollowUpUpdatedEvent extends FollowUpEventMetadata {
  readonly eventType: "FollowUpUpdated";
  readonly payload: FollowUpUpdatedPayload;
}

export interface FollowUpCompletedEvent extends FollowUpEventMetadata {
  readonly eventType: "FollowUpCompleted";
  readonly payload: FollowUpCompletedPayload;
}

export interface FollowUpCancelledEvent extends FollowUpEventMetadata {
  readonly eventType: "FollowUpCancelled";
  readonly payload: FollowUpCancelledPayload;
}

export interface FollowUpOverdueEvent extends FollowUpEventMetadata {
  readonly eventType: "FollowUpOverdue";
  readonly payload: FollowUpOverduePayload;
}

export type FollowUpDomainEvent =
  | FollowUpScheduledEvent
  | FollowUpUpdatedEvent
  | FollowUpCompletedEvent
  | FollowUpCancelledEvent
  | FollowUpOverdueEvent;

export class FollowUp {
  private constructor(private readonly snapshot: FollowUpSnapshot) {}

  static schedule(input: ScheduleFollowUpInput): FollowUp {
    const snapshot: FollowUpSnapshot = {
      followUpId: input.followUpId,
      customerId: input.customerId,
      interactionId: input.interactionId,
      title: normalizeTitle(input.title),
      description: normalizeOptionalText(input.description),
      priority: createFollowUpPriority(input.priority ?? "medium"),
      status: "pending",
      dueAt: createDueTimestamp(input.dueAt),
      assignedTo: normalizeOptionalText(input.assignedTo),
      createdAt: createTimestamp(input.createdAt, "createdAt"),
      updatedAt: createTimestamp(input.createdAt, "updatedAt"),
    };

    validateSnapshot(snapshot);
    return new FollowUp(snapshot);
  }

  static rehydrate(snapshot: FollowUpSnapshot): FollowUp {
    validateSnapshot(snapshot);
    return new FollowUp(cloneSnapshot(snapshot));
  }

  get followUpId(): FollowUpId {
    return this.snapshot.followUpId;
  }

  get customerId(): CustomerId {
    return this.snapshot.customerId;
  }

  get status(): FollowUpStatus {
    return this.snapshot.status;
  }

  update(input: UpdateFollowUpInput): void {
    this.assertMutable();

    const nextSnapshot: FollowUpSnapshot = {
      ...this.snapshot,
      title:
        input.title === undefined
          ? this.snapshot.title
          : normalizeTitle(input.title),
      description:
        input.description === undefined
          ? this.snapshot.description
          : normalizeOptionalText(input.description),
      priority:
        input.priority === undefined
          ? this.snapshot.priority
          : createFollowUpPriority(input.priority),
      dueAt:
        input.dueAt === undefined
          ? this.snapshot.dueAt
          : createDueTimestamp(input.dueAt),
      assignedTo:
        input.assignedTo === undefined
          ? this.snapshot.assignedTo
          : normalizeOptionalText(input.assignedTo),
      updatedAt: createTimestamp(input.updatedAt, "updatedAt"),
    };

    validateSnapshot(nextSnapshot);
    replaceSnapshot(this.snapshot, nextSnapshot);
  }

  complete(completedAt: Timestamp): void {
    if (this.snapshot.status === "completed") {
      return;
    }

    if (this.snapshot.status === "cancelled") {
      throw new Error("Cancelled follow-ups cannot be completed.");
    }

    const timestamp = createTimestamp(completedAt, "completedAt");
    const nextSnapshot: FollowUpSnapshot = {
      ...this.snapshot,
      status: "completed",
      completedAt: timestamp,
      updatedAt: timestamp,
    };

    validateSnapshot(nextSnapshot);
    replaceSnapshot(this.snapshot, nextSnapshot);
  }

  cancel(cancelledAt: Timestamp): void {
    if (this.snapshot.status === "cancelled") {
      return;
    }

    if (this.snapshot.status === "completed") {
      throw new Error("Completed follow-ups cannot be modified.");
    }

    const timestamp = createTimestamp(cancelledAt, "cancelledAt");
    const nextSnapshot: FollowUpSnapshot = {
      ...this.snapshot,
      status: "cancelled",
      cancelledAt: timestamp,
      updatedAt: timestamp,
    };

    validateSnapshot(nextSnapshot);
    replaceSnapshot(this.snapshot, nextSnapshot);
  }

  isOverdue(asOf: Timestamp): boolean {
    return (
      this.snapshot.status === "pending" &&
      Date.parse(this.snapshot.dueAt) < Date.parse(createTimestamp(asOf, "asOf"))
    );
  }

  toSnapshot(): FollowUpSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  private assertMutable(): void {
    if (this.snapshot.status === "completed") {
      throw new Error("Completed follow-ups cannot be modified.");
    }

    if (this.snapshot.status === "cancelled") {
      throw new Error("Cancelled follow-ups cannot be modified.");
    }
  }
}

export function createFollowUpPriority(priority: string): FollowUpPriority {
  const normalized = priority.trim().toLowerCase();

  if (
    normalized !== "low" &&
    normalized !== "medium" &&
    normalized !== "high" &&
    normalized !== "urgent"
  ) {
    throw new Error("Follow-up priority must be low, medium, high, or urgent.");
  }

  return normalized;
}

export function createDueTimestamp(dueAt: Timestamp): DueTimestamp {
  return createTimestamp(dueAt, "dueAt");
}

function normalizeTitle(title: string): string {
  const normalized = title.trim();

  if (normalized.length === 0) {
    throw new Error("Follow-up title is required.");
  }

  return normalized;
}

function normalizeOptionalText(
  value: string | undefined
): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function createTimestamp(value: Timestamp, fieldName: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`Follow-up ${fieldName} must be a valid timestamp.`);
  }

  return value;
}

function validateSnapshot(snapshot: FollowUpSnapshot): void {
  normalizeTitle(snapshot.title);
  createFollowUpPriority(snapshot.priority);
  createDueTimestamp(snapshot.dueAt);
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");

  if (snapshot.status === "completed" && !snapshot.completedAt) {
    throw new Error("Completed follow-ups require completedAt.");
  }

  if (snapshot.status === "cancelled" && !snapshot.cancelledAt) {
    throw new Error("Cancelled follow-ups require cancelledAt.");
  }

  if (snapshot.completedAt) {
    createTimestamp(snapshot.completedAt, "completedAt");
  }

  if (snapshot.cancelledAt) {
    createTimestamp(snapshot.cancelledAt, "cancelledAt");
  }
}

function cloneSnapshot(snapshot: FollowUpSnapshot): FollowUpSnapshot {
  return { ...snapshot };
}

function replaceSnapshot(target: FollowUpSnapshot, source: FollowUpSnapshot): void {
  Object.assign(target, cloneSnapshot(source));
}

export * from "./follow-up-repository";
export * from "./in-memory-follow-up-repository";
