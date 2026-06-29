import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";
import type { CampaignId, CampaignStatus } from ".";

export type CampaignScheduleId = Brand<string, "CampaignScheduleId">;

export type CampaignScheduleStatus = "scheduled" | "cancelled";

export interface CampaignScheduleSnapshot {
  readonly scheduleId: CampaignScheduleId;
  readonly campaignId: CampaignId;
  readonly businessId: BusinessId;
  readonly scheduledFor: Timestamp;
  readonly status: CampaignScheduleStatus;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly rescheduledAt?: Timestamp;
  readonly cancelledAt?: Timestamp;
}

export interface ScheduleCampaignLaunchInput {
  readonly scheduleId: CampaignScheduleId;
  readonly campaignId: CampaignId;
  readonly businessId: BusinessId;
  readonly campaignStatus: CampaignStatus;
  readonly scheduledFor: Timestamp;
  readonly createdAt: Timestamp;
}

export interface RescheduleCampaignLaunchInput {
  readonly campaignStatus: CampaignStatus;
  readonly scheduledFor: Timestamp;
  readonly rescheduledAt: Timestamp;
}

export type CampaignScheduleEventType =
  | "CampaignLaunchScheduled"
  | "CampaignLaunchRescheduled"
  | "CampaignLaunchScheduleCancelled";

export interface CampaignScheduleEventMetadata {
  readonly eventId: EventId;
  readonly eventType: CampaignScheduleEventType;
  readonly aggregateId: CampaignScheduleId;
  readonly aggregateType: "CampaignSchedule";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export interface CampaignLaunchScheduledEvent
  extends CampaignScheduleEventMetadata {
  readonly eventType: "CampaignLaunchScheduled";
  readonly payload: {
    readonly scheduleId: CampaignScheduleId;
    readonly campaignId: CampaignId;
    readonly businessId: BusinessId;
    readonly scheduledFor: Timestamp;
  };
}

export interface CampaignLaunchRescheduledEvent
  extends CampaignScheduleEventMetadata {
  readonly eventType: "CampaignLaunchRescheduled";
  readonly payload: {
    readonly scheduleId: CampaignScheduleId;
    readonly campaignId: CampaignId;
    readonly previousScheduledFor: Timestamp;
    readonly scheduledFor: Timestamp;
  };
}

export interface CampaignLaunchScheduleCancelledEvent
  extends CampaignScheduleEventMetadata {
  readonly eventType: "CampaignLaunchScheduleCancelled";
  readonly payload: {
    readonly scheduleId: CampaignScheduleId;
    readonly campaignId: CampaignId;
    readonly cancelledAt: Timestamp;
  };
}

export type CampaignScheduleDomainEvent =
  | CampaignLaunchScheduledEvent
  | CampaignLaunchRescheduledEvent
  | CampaignLaunchScheduleCancelledEvent;

type CampaignScheduleEventDraft =
  | {
      readonly eventType: "CampaignLaunchScheduled";
      readonly occurredAt: Timestamp;
      readonly payload: CampaignLaunchScheduledEvent["payload"];
    }
  | {
      readonly eventType: "CampaignLaunchRescheduled";
      readonly occurredAt: Timestamp;
      readonly payload: CampaignLaunchRescheduledEvent["payload"];
    }
  | {
      readonly eventType: "CampaignLaunchScheduleCancelled";
      readonly occurredAt: Timestamp;
      readonly payload: CampaignLaunchScheduleCancelledEvent["payload"];
    };

export class CampaignSchedule {
  private readonly pendingEvents: CampaignScheduleDomainEvent[] = [];

  private constructor(private readonly snapshot: CampaignScheduleSnapshot) {}

  static schedule(input: ScheduleCampaignLaunchInput): CampaignSchedule {
    assertCampaignCanBeScheduled(input.campaignStatus);

    const createdAt = createTimestamp(input.createdAt, "createdAt");
    const scheduledFor = createFutureTimestamp(
      input.scheduledFor,
      createdAt,
      "scheduledFor"
    );
    const schedule = new CampaignSchedule({
      scheduleId: input.scheduleId,
      campaignId: input.campaignId,
      businessId: input.businessId,
      scheduledFor,
      status: "scheduled",
      createdAt,
      updatedAt: createdAt,
    });

    schedule.record({
      eventType: "CampaignLaunchScheduled",
      occurredAt: createdAt,
      payload: {
        scheduleId: input.scheduleId,
        campaignId: input.campaignId,
        businessId: input.businessId,
        scheduledFor,
      },
    });

    return schedule;
  }

  static rehydrate(snapshot: CampaignScheduleSnapshot): CampaignSchedule {
    validateSnapshot(snapshot);
    return new CampaignSchedule(cloneSnapshot(snapshot));
  }

  get scheduleId(): CampaignScheduleId {
    return this.snapshot.scheduleId;
  }

  get campaignId(): CampaignId {
    return this.snapshot.campaignId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get status(): CampaignScheduleStatus {
    return this.snapshot.status;
  }

  get scheduledFor(): Timestamp {
    return this.snapshot.scheduledFor;
  }

  reschedule(input: RescheduleCampaignLaunchInput): void {
    this.assertScheduled();
    assertCampaignCanBeScheduled(input.campaignStatus);

    const rescheduledAt = createTimestamp(input.rescheduledAt, "rescheduledAt");
    const previousScheduledFor = this.snapshot.scheduledFor;
    const scheduledFor = createFutureTimestamp(
      input.scheduledFor,
      rescheduledAt,
      "scheduledFor"
    );

    this.replace({
      ...this.snapshot,
      scheduledFor,
      updatedAt: rescheduledAt,
      rescheduledAt,
    });

    this.record({
      eventType: "CampaignLaunchRescheduled",
      occurredAt: rescheduledAt,
      payload: {
        scheduleId: this.snapshot.scheduleId,
        campaignId: this.snapshot.campaignId,
        previousScheduledFor,
        scheduledFor,
      },
    });
  }

  cancel(cancelledAt: Timestamp): void {
    this.assertScheduled();

    const timestamp = createTimestamp(cancelledAt, "cancelledAt");

    this.replace({
      ...this.snapshot,
      status: "cancelled",
      cancelledAt: timestamp,
      updatedAt: timestamp,
    });

    this.record({
      eventType: "CampaignLaunchScheduleCancelled",
      occurredAt: timestamp,
      payload: {
        scheduleId: this.snapshot.scheduleId,
        campaignId: this.snapshot.campaignId,
        cancelledAt: timestamp,
      },
    });
  }

  isPending(asOf: Timestamp): boolean {
    const timestamp = createTimestamp(asOf, "asOf");
    return (
      this.snapshot.status === "scheduled" &&
      Date.parse(this.snapshot.scheduledFor) > Date.parse(timestamp)
    );
  }

  pullDomainEvents(): readonly CampaignScheduleDomainEvent[] {
    const events = Object.freeze([...this.pendingEvents]);
    this.pendingEvents.length = 0;
    return events;
  }

  toSnapshot(): CampaignScheduleSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  private assertScheduled(): void {
    if (this.snapshot.status !== "scheduled") {
      throw new Error("Only active campaign launch schedules may be changed.");
    }
  }

  private replace(snapshot: CampaignScheduleSnapshot): void {
    validateSnapshot(snapshot);
    Object.assign(this.snapshot, cloneSnapshot(snapshot));
  }

  private record(event: CampaignScheduleEventDraft): void {
    this.pendingEvents.push({
      ...event,
      eventId: crypto.randomUUID() as EventId,
      aggregateId: this.snapshot.scheduleId,
      aggregateType: "CampaignSchedule",
      occurredAt: event.occurredAt,
      version: 1,
    } as CampaignScheduleDomainEvent);
  }
}

export function assertCampaignCanBeScheduled(
  status: CampaignStatus
): void {
  if (status === "archived") {
    throw new Error("Archived campaigns cannot be scheduled.");
  }

  if (status === "completed") {
    throw new Error("Completed campaigns cannot be scheduled.");
  }
}

function createFutureTimestamp(
  value: Timestamp,
  asOf: Timestamp,
  field: string
): Timestamp {
  const timestamp = createTimestamp(value, field);

  if (Date.parse(timestamp) <= Date.parse(asOf)) {
    throw new Error("Scheduled launch time must be in the future.");
  }

  return timestamp;
}

function createTimestamp(value: Timestamp, field: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`Campaign schedule ${field} must be a valid timestamp.`);
  }

  return value;
}

function validateSnapshot(snapshot: CampaignScheduleSnapshot): void {
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");
  createTimestamp(snapshot.scheduledFor, "scheduledFor");

  if (snapshot.rescheduledAt) {
    createTimestamp(snapshot.rescheduledAt, "rescheduledAt");
  }

  if (snapshot.cancelledAt) {
    createTimestamp(snapshot.cancelledAt, "cancelledAt");
  }

  if (snapshot.status === "cancelled" && !snapshot.cancelledAt) {
    throw new Error("Cancelled campaign launch schedules require cancelledAt.");
  }
}

function cloneSnapshot(
  snapshot: CampaignScheduleSnapshot
): CampaignScheduleSnapshot {
  return { ...snapshot };
}
