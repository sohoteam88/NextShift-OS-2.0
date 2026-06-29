import type { Brand, BusinessId, EventId, Timestamp } from "@nextshift/shared";
import type { RevenueDomainEvent, RevenueEventDraft } from "./events";

export type RevenueId = Brand<string, "RevenueId">;

export type RevenueStatus = "draft" | "recorded" | "recognized" | "archived";

export type RevenueSource =
  | "subscription"
  | "one_time"
  | "service"
  | "product"
  | "affiliate"
  | "other";

export interface RevenuePeriod {
  readonly start: Timestamp;
  readonly end: Timestamp;
}

export interface RevenueSummary {
  readonly amount: number;
  readonly currency: string;
  readonly transactionCount: number;
}

export interface RevenueSnapshot {
  readonly revenueId: RevenueId;
  readonly businessId: BusinessId;
  readonly source: RevenueSource;
  readonly period: RevenuePeriod;
  readonly summary: RevenueSummary;
  readonly status: RevenueStatus;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly recordedAt?: Timestamp;
  readonly recognizedAt?: Timestamp;
  readonly archivedAt?: Timestamp;
}

export interface CreateRevenueInput {
  readonly revenueId: RevenueId;
  readonly businessId: BusinessId;
  readonly source: string;
  readonly period: RevenuePeriod;
  readonly summary: RevenueSummary;
  readonly createdAt: Timestamp;
}

export class Revenue {
  private readonly pendingEvents: RevenueDomainEvent[] = [];

  private constructor(private readonly snapshot: RevenueSnapshot) {}

  static create(input: CreateRevenueInput): Revenue {
    const createdAt = createTimestamp(input.createdAt, "createdAt");
    const revenue = new Revenue({
      revenueId: input.revenueId,
      businessId: input.businessId,
      source: createRevenueSource(input.source),
      period: createRevenuePeriod(input.period),
      summary: createRevenueSummary(input.summary),
      status: "draft",
      createdAt,
      updatedAt: createdAt,
    });

    revenue.recordEvent({
      eventType: "RevenueCreated",
      occurredAt: createdAt,
      payload: {
        revenueId: revenue.snapshot.revenueId,
        businessId: revenue.snapshot.businessId,
        source: revenue.snapshot.source,
        period: revenue.snapshot.period,
        summary: revenue.snapshot.summary,
        createdAt,
      },
    });

    return revenue;
  }

  static rehydrate(snapshot: RevenueSnapshot): Revenue {
    validateSnapshot(snapshot);
    return new Revenue(cloneSnapshot(snapshot));
  }

  get revenueId(): RevenueId {
    return this.snapshot.revenueId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get source(): RevenueSource {
    return this.snapshot.source;
  }

  get status(): RevenueStatus {
    return this.snapshot.status;
  }

  record(recordedAt: Timestamp): void {
    if (this.snapshot.status !== "draft") {
      throw new Error("Only draft revenue may be recorded.");
    }

    const timestamp = createTimestamp(recordedAt, "recordedAt");

    this.replace({
      ...this.snapshot,
      status: "recorded",
      recordedAt: timestamp,
      updatedAt: timestamp,
    });

    this.recordEvent({
      eventType: "RevenueRecorded",
      occurredAt: timestamp,
      payload: {
        revenueId: this.snapshot.revenueId,
        recordedAt: timestamp,
      },
    });
  }

  recognize(recognizedAt: Timestamp): void {
    if (this.snapshot.status !== "recorded") {
      throw new Error("Only recorded revenue may be recognized.");
    }

    const timestamp = createTimestamp(recognizedAt, "recognizedAt");

    this.replace({
      ...this.snapshot,
      status: "recognized",
      recognizedAt: timestamp,
      updatedAt: timestamp,
    });

    this.recordEvent({
      eventType: "RevenueRecognized",
      occurredAt: timestamp,
      payload: {
        revenueId: this.snapshot.revenueId,
        recognizedAt: timestamp,
      },
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

    this.recordEvent({
      eventType: "RevenueArchived",
      occurredAt: timestamp,
      payload: {
        revenueId: this.snapshot.revenueId,
        archivedAt: timestamp,
      },
    });
  }

  sameIdentityAs(other: Revenue): boolean {
    return this.snapshot.revenueId === other.revenueId;
  }

  pullDomainEvents(): readonly RevenueDomainEvent[] {
    const events = Object.freeze([...this.pendingEvents]);
    this.pendingEvents.length = 0;
    return events;
  }

  toSnapshot(): RevenueSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  private replace(snapshot: RevenueSnapshot): void {
    validateSnapshot(snapshot);
    Object.assign(this.snapshot, cloneSnapshot(snapshot));
  }

  private recordEvent(event: RevenueEventDraft): void {
    this.pendingEvents.push({
      ...event,
      eventId: crypto.randomUUID() as EventId,
      aggregateId: this.snapshot.revenueId,
      aggregateType: "Revenue",
      occurredAt: event.occurredAt,
      version: 1,
    } as RevenueDomainEvent);
  }
}

export function createRevenueSource(source: string): RevenueSource {
  const normalized = source.trim().toLowerCase();

  if (!isRevenueSource(normalized)) {
    throw new Error(`Unsupported revenue source: ${source}.`);
  }

  return normalized;
}

export function createRevenuePeriod(period: RevenuePeriod): RevenuePeriod {
  const start = createTimestamp(period.start, "period.start");
  const end = createTimestamp(period.end, "period.end");

  if (Date.parse(end) <= Date.parse(start)) {
    throw new Error("Revenue period end must be after start.");
  }

  return Object.freeze({ start, end });
}

export function createRevenueSummary(
  summary: RevenueSummary
): RevenueSummary {
  if (!Number.isFinite(summary.amount) || summary.amount < 0) {
    throw new Error("Revenue amount must be a non-negative finite number.");
  }

  const currency = summary.currency.trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error("Revenue currency must be a three-letter code.");
  }

  if (
    !Number.isInteger(summary.transactionCount) ||
    summary.transactionCount < 1
  ) {
    throw new Error("Revenue transaction count must be a positive integer.");
  }

  return Object.freeze({
    amount: summary.amount,
    currency,
    transactionCount: summary.transactionCount,
  });
}

function isRevenueSource(value: string): value is RevenueSource {
  return [
    "subscription",
    "one_time",
    "service",
    "product",
    "affiliate",
    "other",
  ].includes(value);
}

function createTimestamp(value: Timestamp, field: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`Revenue ${field} must be a valid timestamp.`);
  }

  return value;
}

function validateSnapshot(snapshot: RevenueSnapshot): void {
  createRevenueSource(snapshot.source);
  createRevenuePeriod(snapshot.period);
  createRevenueSummary(snapshot.summary);
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");

  if (snapshot.recordedAt) createTimestamp(snapshot.recordedAt, "recordedAt");
  if (snapshot.recognizedAt) {
    createTimestamp(snapshot.recognizedAt, "recognizedAt");
  }
  if (snapshot.archivedAt) createTimestamp(snapshot.archivedAt, "archivedAt");

  if (snapshot.status === "recorded" && !snapshot.recordedAt) {
    throw new Error("Recorded revenue requires recordedAt.");
  }

  if (snapshot.status === "recognized" && !snapshot.recognizedAt) {
    throw new Error("Recognized revenue requires recognizedAt.");
  }

  if (snapshot.status === "archived" && !snapshot.archivedAt) {
    throw new Error("Archived revenue requires archivedAt.");
  }
}

function cloneSnapshot(snapshot: RevenueSnapshot): RevenueSnapshot {
  return {
    ...snapshot,
    period: createRevenuePeriod(snapshot.period),
    summary: createRevenueSummary(snapshot.summary),
  };
}
