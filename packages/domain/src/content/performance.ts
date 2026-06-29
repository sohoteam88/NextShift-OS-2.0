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
import type { ContentVariantSetId } from "./variant";

export type ContentPerformanceId = Brand<string, "ContentPerformanceId">;
export type ContentPerformanceStatus = "active" | "archived";

export interface ContentMetricSnapshot {
  readonly platform: ContentPlatform;
  readonly measuredAt: Timestamp;
  readonly impressions: number;
  readonly reach: number;
  readonly engagements: number;
  readonly clicks: number;
  readonly saves: number;
  readonly shares: number;
  readonly comments: number;
  readonly leads: number;
  readonly conversions: number;
  readonly recordedAt: Timestamp;
}

export interface ContentPerformanceSnapshot {
  readonly performanceId: ContentPerformanceId;
  readonly businessId: BusinessId;
  readonly variantSetId: ContentVariantSetId;
  readonly contentId: ContentId;
  readonly status: ContentPerformanceStatus;
  readonly metrics: readonly ContentMetricSnapshot[];
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly archivedAt?: Timestamp;
}

export interface ContentPerformanceSummary {
  readonly platform: ContentPlatform;
  readonly impressions: number;
  readonly reach: number;
  readonly engagements: number;
  readonly clicks: number;
  readonly saves: number;
  readonly shares: number;
  readonly comments: number;
  readonly leads: number;
  readonly conversions: number;
}

export interface CreateContentPerformanceInput {
  readonly performanceId: ContentPerformanceId;
  readonly businessId: BusinessId;
  readonly variantSetId: ContentVariantSetId;
  readonly contentId: ContentId;
  readonly createdAt: Timestamp;
}

export interface RecordContentMetricsInput {
  readonly platform: string;
  readonly measuredAt: Timestamp;
  readonly impressions?: number;
  readonly reach?: number;
  readonly engagements?: number;
  readonly clicks?: number;
  readonly saves?: number;
  readonly shares?: number;
  readonly comments?: number;
  readonly leads?: number;
  readonly conversions?: number;
  readonly recordedAt: Timestamp;
}

export interface ContentPerformanceEventMetadata {
  readonly eventId: EventId;
  readonly eventType: ContentPerformanceEventType;
  readonly aggregateId: ContentPerformanceId;
  readonly aggregateType: "ContentPerformance";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type ContentPerformanceEventType =
  | "ContentPerformanceCreated"
  | "ContentMetricsRecorded"
  | "ContentPerformanceArchived"
  | "ContentPerformanceRestored";

export interface ContentPerformanceCreatedEvent
  extends ContentPerformanceEventMetadata {
  readonly eventType: "ContentPerformanceCreated";
  readonly payload: {
    readonly performanceId: ContentPerformanceId;
    readonly businessId: BusinessId;
    readonly variantSetId: ContentVariantSetId;
    readonly contentId: ContentId;
    readonly createdAt: Timestamp;
  };
}

export interface ContentMetricsRecordedEvent
  extends ContentPerformanceEventMetadata {
  readonly eventType: "ContentMetricsRecorded";
  readonly payload: ContentMetricSnapshot;
}

export interface ContentPerformanceArchivedEvent
  extends ContentPerformanceEventMetadata {
  readonly eventType: "ContentPerformanceArchived";
  readonly payload: {
    readonly performanceId: ContentPerformanceId;
    readonly archivedAt: Timestamp;
  };
}

export interface ContentPerformanceRestoredEvent
  extends ContentPerformanceEventMetadata {
  readonly eventType: "ContentPerformanceRestored";
  readonly payload: {
    readonly performanceId: ContentPerformanceId;
    readonly restoredAt: Timestamp;
  };
}

export type ContentPerformanceDomainEvent =
  | ContentPerformanceCreatedEvent
  | ContentMetricsRecordedEvent
  | ContentPerformanceArchivedEvent
  | ContentPerformanceRestoredEvent;

export class ContentPerformance {
  private constructor(private snapshot: ContentPerformanceSnapshot) {}

  static create(input: CreateContentPerformanceInput): ContentPerformance {
    const timestamp = createTimestamp(input.createdAt, "createdAt");

    return new ContentPerformance({
      performanceId: input.performanceId,
      businessId: input.businessId,
      variantSetId: input.variantSetId,
      contentId: input.contentId,
      status: "active",
      metrics: Object.freeze([]),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static rehydrate(snapshot: ContentPerformanceSnapshot): ContentPerformance {
    validateSnapshot(snapshot);
    return new ContentPerformance(cloneSnapshot(snapshot));
  }

  get performanceId(): ContentPerformanceId {
    return this.snapshot.performanceId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get variantSetId(): ContentVariantSetId {
    return this.snapshot.variantSetId;
  }

  get contentId(): ContentId {
    return this.snapshot.contentId;
  }

  get status(): ContentPerformanceStatus {
    return this.snapshot.status;
  }

  recordMetrics(input: RecordContentMetricsInput): void {
    this.assertActive();

    const metric = createMetricSnapshot(input);
    this.assertNoDuplicateMetric(metric.platform, metric.measuredAt);

    this.replace({
      ...this.snapshot,
      metrics: Object.freeze([...this.snapshot.metrics, metric]),
      updatedAt: metric.recordedAt,
    });
  }

  summarizePlatform(platform: string): ContentPerformanceSummary {
    const normalizedPlatform = createContentPlatform(platform);
    return this.snapshot.metrics
      .filter((metric) => metric.platform === normalizedPlatform)
      .reduce(
        (summary, metric) => ({
          platform: normalizedPlatform,
          impressions: summary.impressions + metric.impressions,
          reach: summary.reach + metric.reach,
          engagements: summary.engagements + metric.engagements,
          clicks: summary.clicks + metric.clicks,
          saves: summary.saves + metric.saves,
          shares: summary.shares + metric.shares,
          comments: summary.comments + metric.comments,
          leads: summary.leads + metric.leads,
          conversions: summary.conversions + metric.conversions,
        }),
        emptySummary(normalizedPlatform)
      );
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
      status: "active",
      archivedAt: undefined,
      updatedAt: timestamp,
    });
  }

  listMetrics(): readonly ContentMetricSnapshot[] {
    return cloneMetrics(this.snapshot.metrics);
  }

  toSnapshot(): ContentPerformanceSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  private assertActive(): void {
    if (this.snapshot.status === "archived") {
      throw new Error("Archived content performance cannot be modified.");
    }
  }

  private assertNoDuplicateMetric(
    platform: ContentPlatform,
    measuredAt: Timestamp
  ): void {
    if (
      this.snapshot.metrics.some(
        (metric) =>
          metric.platform === platform && metric.measuredAt === measuredAt
      )
    ) {
      throw new Error(
        "Content performance metrics already exist for this platform and timestamp."
      );
    }
  }

  private replace(snapshot: ContentPerformanceSnapshot): void {
    validateSnapshot(snapshot);
    this.snapshot = cloneSnapshot(snapshot);
  }
}

function createMetricSnapshot(
  input: RecordContentMetricsInput
): ContentMetricSnapshot {
  return {
    platform: createContentPlatform(input.platform),
    measuredAt: createTimestamp(input.measuredAt, "measuredAt"),
    impressions: createMetricValue(input.impressions ?? 0, "impressions"),
    reach: createMetricValue(input.reach ?? 0, "reach"),
    engagements: createMetricValue(input.engagements ?? 0, "engagements"),
    clicks: createMetricValue(input.clicks ?? 0, "clicks"),
    saves: createMetricValue(input.saves ?? 0, "saves"),
    shares: createMetricValue(input.shares ?? 0, "shares"),
    comments: createMetricValue(input.comments ?? 0, "comments"),
    leads: createMetricValue(input.leads ?? 0, "leads"),
    conversions: createMetricValue(input.conversions ?? 0, "conversions"),
    recordedAt: createTimestamp(input.recordedAt, "recordedAt"),
  };
}

function createMetricValue(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Content performance ${field} must be a non-negative integer.`);
  }

  return value;
}

function createTimestamp(value: Timestamp, field: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`Content performance ${field} must be a valid timestamp.`);
  }

  return value;
}

function emptySummary(platform: ContentPlatform): ContentPerformanceSummary {
  return {
    platform,
    impressions: 0,
    reach: 0,
    engagements: 0,
    clicks: 0,
    saves: 0,
    shares: 0,
    comments: 0,
    leads: 0,
    conversions: 0,
  };
}

function validateSnapshot(snapshot: ContentPerformanceSnapshot): void {
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");

  if (snapshot.status === "archived" && !snapshot.archivedAt) {
    throw new Error("Archived content performance requires archivedAt.");
  }

  for (const metric of snapshot.metrics) {
    createContentPlatform(metric.platform);
    createTimestamp(metric.measuredAt, "measuredAt");
    createMetricValue(metric.impressions, "impressions");
    createMetricValue(metric.reach, "reach");
    createMetricValue(metric.engagements, "engagements");
    createMetricValue(metric.clicks, "clicks");
    createMetricValue(metric.saves, "saves");
    createMetricValue(metric.shares, "shares");
    createMetricValue(metric.comments, "comments");
    createMetricValue(metric.leads, "leads");
    createMetricValue(metric.conversions, "conversions");
    createTimestamp(metric.recordedAt, "recordedAt");
  }
}

function cloneSnapshot(
  snapshot: ContentPerformanceSnapshot
): ContentPerformanceSnapshot {
  return {
    ...snapshot,
    metrics: cloneMetrics(snapshot.metrics),
  };
}

function cloneMetrics(
  metrics: readonly ContentMetricSnapshot[]
): readonly ContentMetricSnapshot[] {
  return Object.freeze(metrics.map((metric) => ({ ...metric })));
}
