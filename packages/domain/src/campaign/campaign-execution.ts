import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";
import type { CampaignId, CampaignStatus } from ".";

export type CampaignExecutionId = Brand<string, "CampaignExecutionId">;

export type CampaignExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface CampaignExecutionSnapshot {
  readonly executionId: CampaignExecutionId;
  readonly campaignId: CampaignId;
  readonly businessId: BusinessId;
  readonly status: CampaignExecutionStatus;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly startedAt?: Timestamp;
  readonly completedAt?: Timestamp;
  readonly failedAt?: Timestamp;
  readonly cancelledAt?: Timestamp;
  readonly failureReason?: string;
}

export interface CreateCampaignExecutionInput {
  readonly executionId: CampaignExecutionId;
  readonly campaignId: CampaignId;
  readonly businessId: BusinessId;
  readonly createdAt: Timestamp;
}

export interface CampaignExecutionEligibilityInput {
  readonly campaignStatus: CampaignStatus;
  readonly hasActiveSchedule: boolean;
  readonly explicitlyEligible?: boolean;
}

export type CampaignExecutionEventType =
  | "CampaignExecutionStarted"
  | "CampaignExecutionCompleted"
  | "CampaignExecutionFailed"
  | "CampaignExecutionCancelled";

export interface CampaignExecutionEventMetadata {
  readonly eventId: EventId;
  readonly eventType: CampaignExecutionEventType;
  readonly aggregateId: CampaignExecutionId;
  readonly aggregateType: "CampaignExecution";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export interface CampaignExecutionStartedEvent
  extends CampaignExecutionEventMetadata {
  readonly eventType: "CampaignExecutionStarted";
  readonly payload: {
    readonly executionId: CampaignExecutionId;
    readonly campaignId: CampaignId;
    readonly businessId: BusinessId;
    readonly startedAt: Timestamp;
  };
}

export interface CampaignExecutionCompletedEvent
  extends CampaignExecutionEventMetadata {
  readonly eventType: "CampaignExecutionCompleted";
  readonly payload: {
    readonly executionId: CampaignExecutionId;
    readonly campaignId: CampaignId;
    readonly completedAt: Timestamp;
  };
}

export interface CampaignExecutionFailedEvent
  extends CampaignExecutionEventMetadata {
  readonly eventType: "CampaignExecutionFailed";
  readonly payload: {
    readonly executionId: CampaignExecutionId;
    readonly campaignId: CampaignId;
    readonly failedAt: Timestamp;
    readonly failureReason?: string;
  };
}

export interface CampaignExecutionCancelledEvent
  extends CampaignExecutionEventMetadata {
  readonly eventType: "CampaignExecutionCancelled";
  readonly payload: {
    readonly executionId: CampaignExecutionId;
    readonly campaignId: CampaignId;
    readonly cancelledAt: Timestamp;
  };
}

export type CampaignExecutionDomainEvent =
  | CampaignExecutionStartedEvent
  | CampaignExecutionCompletedEvent
  | CampaignExecutionFailedEvent
  | CampaignExecutionCancelledEvent;

type CampaignExecutionEventDraft =
  | {
      readonly eventType: "CampaignExecutionStarted";
      readonly occurredAt: Timestamp;
      readonly payload: CampaignExecutionStartedEvent["payload"];
    }
  | {
      readonly eventType: "CampaignExecutionCompleted";
      readonly occurredAt: Timestamp;
      readonly payload: CampaignExecutionCompletedEvent["payload"];
    }
  | {
      readonly eventType: "CampaignExecutionFailed";
      readonly occurredAt: Timestamp;
      readonly payload: CampaignExecutionFailedEvent["payload"];
    }
  | {
      readonly eventType: "CampaignExecutionCancelled";
      readonly occurredAt: Timestamp;
      readonly payload: CampaignExecutionCancelledEvent["payload"];
    };

export class CampaignExecution {
  private readonly pendingEvents: CampaignExecutionDomainEvent[] = [];

  private constructor(private readonly snapshot: CampaignExecutionSnapshot) {}

  static create(input: CreateCampaignExecutionInput): CampaignExecution {
    const createdAt = createTimestamp(input.createdAt, "createdAt");

    return new CampaignExecution({
      executionId: input.executionId,
      campaignId: input.campaignId,
      businessId: input.businessId,
      status: "pending",
      createdAt,
      updatedAt: createdAt,
    });
  }

  static rehydrate(snapshot: CampaignExecutionSnapshot): CampaignExecution {
    validateSnapshot(snapshot);
    return new CampaignExecution(cloneSnapshot(snapshot));
  }

  get executionId(): CampaignExecutionId {
    return this.snapshot.executionId;
  }

  get campaignId(): CampaignId {
    return this.snapshot.campaignId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get status(): CampaignExecutionStatus {
    return this.snapshot.status;
  }

  start(startedAt: Timestamp): void {
    if (this.snapshot.status !== "pending") {
      throw new Error("Only pending campaign executions may be started.");
    }

    const timestamp = createTimestamp(startedAt, "startedAt");

    this.replace({
      ...this.snapshot,
      status: "running",
      startedAt: timestamp,
      updatedAt: timestamp,
    });

    this.record({
      eventType: "CampaignExecutionStarted",
      occurredAt: timestamp,
      payload: {
        executionId: this.snapshot.executionId,
        campaignId: this.snapshot.campaignId,
        businessId: this.snapshot.businessId,
        startedAt: timestamp,
      },
    });
  }

  complete(completedAt: Timestamp): void {
    this.assertRunning("completed");

    const timestamp = createTimestamp(completedAt, "completedAt");

    this.replace({
      ...this.snapshot,
      status: "completed",
      completedAt: timestamp,
      updatedAt: timestamp,
    });

    this.record({
      eventType: "CampaignExecutionCompleted",
      occurredAt: timestamp,
      payload: {
        executionId: this.snapshot.executionId,
        campaignId: this.snapshot.campaignId,
        completedAt: timestamp,
      },
    });
  }

  fail(failedAt: Timestamp, failureReason?: string): void {
    this.assertRunning("failed");

    const timestamp = createTimestamp(failedAt, "failedAt");
    const reason = createOptionalFailureReason(failureReason);

    this.replace({
      ...this.snapshot,
      status: "failed",
      failedAt: timestamp,
      failureReason: reason,
      updatedAt: timestamp,
    });

    this.record({
      eventType: "CampaignExecutionFailed",
      occurredAt: timestamp,
      payload: {
        executionId: this.snapshot.executionId,
        campaignId: this.snapshot.campaignId,
        failedAt: timestamp,
        failureReason: reason,
      },
    });
  }

  cancel(cancelledAt: Timestamp): void {
    this.assertRunning("cancelled");

    const timestamp = createTimestamp(cancelledAt, "cancelledAt");

    this.replace({
      ...this.snapshot,
      status: "cancelled",
      cancelledAt: timestamp,
      updatedAt: timestamp,
    });

    this.record({
      eventType: "CampaignExecutionCancelled",
      occurredAt: timestamp,
      payload: {
        executionId: this.snapshot.executionId,
        campaignId: this.snapshot.campaignId,
        cancelledAt: timestamp,
      },
    });
  }

  isActive(): boolean {
    return ["pending", "running"].includes(this.snapshot.status);
  }

  pullDomainEvents(): readonly CampaignExecutionDomainEvent[] {
    const events = Object.freeze([...this.pendingEvents]);
    this.pendingEvents.length = 0;
    return events;
  }

  toSnapshot(): CampaignExecutionSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  private assertRunning(nextStatus: CampaignExecutionStatus): void {
    if (this.snapshot.status !== "running") {
      throw new Error(
        `Only running campaign executions may transition to ${nextStatus}.`
      );
    }
  }

  private replace(snapshot: CampaignExecutionSnapshot): void {
    validateSnapshot(snapshot);
    Object.assign(this.snapshot, cloneSnapshot(snapshot));
  }

  private record(event: CampaignExecutionEventDraft): void {
    this.pendingEvents.push({
      ...event,
      eventId: crypto.randomUUID() as EventId,
      aggregateId: this.snapshot.executionId,
      aggregateType: "CampaignExecution",
      occurredAt: event.occurredAt,
      version: 1,
    } as CampaignExecutionDomainEvent);
  }
}

export function assertCampaignCanStartExecution(
  input: CampaignExecutionEligibilityInput
): void {
  if (input.campaignStatus === "archived") {
    throw new Error("Archived campaigns cannot start execution.");
  }

  if (input.campaignStatus === "completed") {
    throw new Error("Completed campaigns cannot start execution.");
  }

  if (!input.hasActiveSchedule && input.explicitlyEligible !== true) {
    throw new Error(
      "Campaign execution requires an active schedule or explicit eligibility."
    );
  }
}

function createTimestamp(value: Timestamp, field: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`Campaign execution ${field} must be a valid timestamp.`);
  }

  return value;
}

function createOptionalFailureReason(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Error("Campaign execution failure reason cannot be blank.");
  }

  return normalized;
}

function validateSnapshot(snapshot: CampaignExecutionSnapshot): void {
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");

  if (snapshot.startedAt) createTimestamp(snapshot.startedAt, "startedAt");
  if (snapshot.completedAt) createTimestamp(snapshot.completedAt, "completedAt");
  if (snapshot.failedAt) createTimestamp(snapshot.failedAt, "failedAt");
  if (snapshot.cancelledAt) createTimestamp(snapshot.cancelledAt, "cancelledAt");
  if (snapshot.failureReason !== undefined) {
    createOptionalFailureReason(snapshot.failureReason);
  }

  if (snapshot.status === "running" && !snapshot.startedAt) {
    throw new Error("Running campaign executions require startedAt.");
  }

  if (snapshot.status === "completed" && !snapshot.completedAt) {
    throw new Error("Completed campaign executions require completedAt.");
  }

  if (snapshot.status === "failed" && !snapshot.failedAt) {
    throw new Error("Failed campaign executions require failedAt.");
  }

  if (snapshot.status === "cancelled" && !snapshot.cancelledAt) {
    throw new Error("Cancelled campaign executions require cancelledAt.");
  }
}

function cloneSnapshot(
  snapshot: CampaignExecutionSnapshot
): CampaignExecutionSnapshot {
  return { ...snapshot };
}
