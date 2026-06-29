import type { Brand, BusinessId, EventId, Timestamp } from "@nextshift/shared";
import type {
  RevenueTargetDomainEvent,
  RevenueTargetEventDraft,
} from "./events";

export type RevenueTargetId = Brand<string, "RevenueTargetId">;
export type RevenueTargetName = Brand<string, "RevenueTargetName">;

export type RevenueTargetStatus = "active" | "archived";

export interface RevenueTargetPeriod {
  readonly start: Timestamp;
  readonly end: Timestamp;
}

export interface RevenueTargetSummary {
  readonly targetAmount: number;
  readonly currency: string;
}

export interface RevenueTargetSnapshot {
  readonly revenueTargetId: RevenueTargetId;
  readonly businessId: BusinessId;
  readonly name: RevenueTargetName;
  readonly period: RevenueTargetPeriod;
  readonly summary: RevenueTargetSummary;
  readonly status: RevenueTargetStatus;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly archivedAt?: Timestamp;
}

export interface CreateRevenueTargetInput {
  readonly revenueTargetId: RevenueTargetId;
  readonly businessId: BusinessId;
  readonly name: string;
  readonly period: RevenueTargetPeriod;
  readonly summary: RevenueTargetSummary;
  readonly createdAt: Timestamp;
}

export interface UpdateRevenueTargetInput {
  readonly name?: string;
  readonly period?: RevenueTargetPeriod;
  readonly summary?: RevenueTargetSummary;
  readonly updatedAt: Timestamp;
}

export class RevenueTarget {
  private readonly pendingEvents: RevenueTargetDomainEvent[] = [];

  private constructor(private readonly snapshot: RevenueTargetSnapshot) {}

  static create(input: CreateRevenueTargetInput): RevenueTarget {
    const createdAt = createTimestamp(input.createdAt, "createdAt");
    const target = new RevenueTarget({
      revenueTargetId: input.revenueTargetId,
      businessId: input.businessId,
      name: createRevenueTargetName(input.name),
      period: createRevenueTargetPeriod(input.period),
      summary: createRevenueTargetSummary(input.summary),
      status: "active",
      createdAt,
      updatedAt: createdAt,
    });

    target.recordEvent({
      eventType: "RevenueTargetCreated",
      occurredAt: createdAt,
      payload: {
        revenueTargetId: target.snapshot.revenueTargetId,
        businessId: target.snapshot.businessId,
        name: target.snapshot.name,
        period: target.snapshot.period,
        summary: target.snapshot.summary,
        createdAt,
      },
    });

    return target;
  }

  static rehydrate(snapshot: RevenueTargetSnapshot): RevenueTarget {
    validateSnapshot(snapshot);
    return new RevenueTarget(cloneSnapshot(snapshot));
  }

  get revenueTargetId(): RevenueTargetId {
    return this.snapshot.revenueTargetId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get status(): RevenueTargetStatus {
    return this.snapshot.status;
  }

  update(input: UpdateRevenueTargetInput): void {
    this.assertMutable();

    const updatedAt = createTimestamp(input.updatedAt, "updatedAt");
    const updatedFields: string[] = [];
    const nextSnapshot: RevenueTargetSnapshot = {
      ...this.snapshot,
      name:
        input.name === undefined
          ? this.snapshot.name
          : createRevenueTargetName(input.name),
      period:
        input.period === undefined
          ? this.snapshot.period
          : createRevenueTargetPeriod(input.period),
      summary:
        input.summary === undefined
          ? this.snapshot.summary
          : createRevenueTargetSummary(input.summary),
      updatedAt,
    };

    if (input.name !== undefined) updatedFields.push("name");
    if (input.period !== undefined) updatedFields.push("period");
    if (input.summary !== undefined) updatedFields.push("summary");

    this.replace(nextSnapshot);

    if (updatedFields.length > 0) {
      this.recordEvent({
        eventType: "RevenueTargetUpdated",
        occurredAt: updatedAt,
        payload: {
          revenueTargetId: this.snapshot.revenueTargetId,
          updatedFields: Object.freeze([...updatedFields]),
          updatedAt,
        },
      });
    }
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

    this.recordEvent({
      eventType: "RevenueTargetArchived",
      occurredAt: timestamp,
      payload: {
        revenueTargetId: this.snapshot.revenueTargetId,
        archivedAt: timestamp,
      },
    });
  }

  pullDomainEvents(): readonly RevenueTargetDomainEvent[] {
    const events = Object.freeze([...this.pendingEvents]);
    this.pendingEvents.length = 0;
    return events;
  }

  toSnapshot(): RevenueTargetSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  private assertMutable(): void {
    if (this.snapshot.status === "archived") {
      throw new Error("Archived revenue targets cannot be modified.");
    }
  }

  private replace(snapshot: RevenueTargetSnapshot): void {
    validateSnapshot(snapshot);
    Object.assign(this.snapshot, cloneSnapshot(snapshot));
  }

  private recordEvent(event: RevenueTargetEventDraft): void {
    this.pendingEvents.push({
      ...event,
      eventId: crypto.randomUUID() as EventId,
      aggregateId: this.snapshot.revenueTargetId,
      aggregateType: "RevenueTarget",
      occurredAt: event.occurredAt,
      version: 1,
    } as RevenueTargetDomainEvent);
  }
}

export function createRevenueTargetName(name: string): RevenueTargetName {
  const normalized = name.trim();

  if (normalized.length === 0) {
    throw new Error("Revenue target name is required.");
  }

  return normalized as RevenueTargetName;
}

export function createRevenueTargetPeriod(
  period: RevenueTargetPeriod
): RevenueTargetPeriod {
  const start = createTimestamp(period.start, "period.start");
  const end = createTimestamp(period.end, "period.end");

  if (Date.parse(end) <= Date.parse(start)) {
    throw new Error("Revenue target period end must be after start.");
  }

  return Object.freeze({ start, end });
}

export function createRevenueTargetSummary(
  summary: RevenueTargetSummary
): RevenueTargetSummary {
  if (!Number.isFinite(summary.targetAmount) || summary.targetAmount <= 0) {
    throw new Error(
      "Revenue target amount must be a positive finite number."
    );
  }

  const currency = summary.currency.trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error("Revenue target currency must be a three-letter code.");
  }

  return Object.freeze({
    targetAmount: summary.targetAmount,
    currency,
  });
}

function createTimestamp(value: Timestamp, field: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`Revenue target ${field} must be a valid timestamp.`);
  }

  return value;
}

function validateSnapshot(snapshot: RevenueTargetSnapshot): void {
  createRevenueTargetName(snapshot.name);
  createRevenueTargetPeriod(snapshot.period);
  createRevenueTargetSummary(snapshot.summary);
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");

  if (snapshot.archivedAt) createTimestamp(snapshot.archivedAt, "archivedAt");

  if (snapshot.status === "archived" && !snapshot.archivedAt) {
    throw new Error("Archived revenue targets require archivedAt.");
  }
}

function cloneSnapshot(snapshot: RevenueTargetSnapshot): RevenueTargetSnapshot {
  return {
    ...snapshot,
    period: createRevenueTargetPeriod(snapshot.period),
    summary: createRevenueTargetSummary(snapshot.summary),
  };
}
