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
  ContentPerformanceId,
  ContentPerformanceSummary,
} from "./performance";
import type { ContentVariantSetId } from "./variant";

export type ContentInsightSetId = Brand<string, "ContentInsightSetId">;
export type ContentInsightId = Brand<string, "ContentInsightId">;
export type ContentInsightMessage = Brand<string, "ContentInsightMessage">;

export type ContentInsightSetStatus = "active" | "archived";
export type ContentInsightStatus = "open" | "resolved" | "archived";
export type ContentInsightType = "winner" | "underperformer" | "trend";
export type ContentInsightSeverity = "low" | "medium" | "high";
export type ContentInsightAction =
  | "amplify"
  | "iterate"
  | "repurpose"
  | "monitor"
  | "retire";

export interface ContentInsightEvidenceSnapshot {
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

export interface ContentInsightSnapshot {
  readonly insightId: ContentInsightId;
  readonly platform: ContentPlatform;
  readonly type: ContentInsightType;
  readonly severity: ContentInsightSeverity;
  readonly action: ContentInsightAction;
  readonly message: ContentInsightMessage;
  readonly evidence: ContentInsightEvidenceSnapshot;
  readonly status: ContentInsightStatus;
  readonly createdAt: Timestamp;
  readonly resolvedAt?: Timestamp;
  readonly archivedAt?: Timestamp;
}

export interface ContentInsightSetSnapshot {
  readonly insightSetId: ContentInsightSetId;
  readonly businessId: BusinessId;
  readonly performanceId: ContentPerformanceId;
  readonly variantSetId: ContentVariantSetId;
  readonly contentId: ContentId;
  readonly status: ContentInsightSetStatus;
  readonly insights: readonly ContentInsightSnapshot[];
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly archivedAt?: Timestamp;
}

export interface CreateContentInsightSetInput {
  readonly insightSetId: ContentInsightSetId;
  readonly businessId: BusinessId;
  readonly performanceId: ContentPerformanceId;
  readonly variantSetId: ContentVariantSetId;
  readonly contentId: ContentId;
  readonly createdAt: Timestamp;
}

export interface RecordContentInsightInput {
  readonly insightId: ContentInsightId;
  readonly platform: string;
  readonly type: string;
  readonly severity: string;
  readonly action: string;
  readonly message: string;
  readonly evidence: ContentInsightEvidenceSnapshot;
  readonly createdAt: Timestamp;
}

export interface ContentInsightEventMetadata {
  readonly eventId: EventId;
  readonly eventType: ContentInsightEventType;
  readonly aggregateId: ContentInsightSetId;
  readonly aggregateType: "ContentInsightSet";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type ContentInsightEventType =
  | "ContentInsightSetCreated"
  | "ContentInsightRecorded"
  | "ContentInsightResolved"
  | "ContentInsightArchived"
  | "ContentInsightSetArchived"
  | "ContentInsightSetRestored";

export interface ContentInsightSetCreatedEvent
  extends ContentInsightEventMetadata {
  readonly eventType: "ContentInsightSetCreated";
  readonly payload: {
    readonly insightSetId: ContentInsightSetId;
    readonly businessId: BusinessId;
    readonly performanceId: ContentPerformanceId;
    readonly variantSetId: ContentVariantSetId;
    readonly contentId: ContentId;
    readonly createdAt: Timestamp;
  };
}

export interface ContentInsightRecordedEvent
  extends ContentInsightEventMetadata {
  readonly eventType: "ContentInsightRecorded";
  readonly payload: ContentInsightSnapshot;
}

export interface ContentInsightResolvedEvent
  extends ContentInsightEventMetadata {
  readonly eventType: "ContentInsightResolved";
  readonly payload: {
    readonly insightId: ContentInsightId;
    readonly resolvedAt: Timestamp;
  };
}

export interface ContentInsightArchivedEvent
  extends ContentInsightEventMetadata {
  readonly eventType: "ContentInsightArchived";
  readonly payload: {
    readonly insightId: ContentInsightId;
    readonly archivedAt: Timestamp;
  };
}

export interface ContentInsightSetArchivedEvent
  extends ContentInsightEventMetadata {
  readonly eventType: "ContentInsightSetArchived";
  readonly payload: {
    readonly insightSetId: ContentInsightSetId;
    readonly archivedAt: Timestamp;
  };
}

export interface ContentInsightSetRestoredEvent
  extends ContentInsightEventMetadata {
  readonly eventType: "ContentInsightSetRestored";
  readonly payload: {
    readonly insightSetId: ContentInsightSetId;
    readonly restoredAt: Timestamp;
  };
}

export type ContentInsightDomainEvent =
  | ContentInsightSetCreatedEvent
  | ContentInsightRecordedEvent
  | ContentInsightResolvedEvent
  | ContentInsightArchivedEvent
  | ContentInsightSetArchivedEvent
  | ContentInsightSetRestoredEvent;

export class ContentInsightSet {
  private constructor(private snapshot: ContentInsightSetSnapshot) {}

  static create(input: CreateContentInsightSetInput): ContentInsightSet {
    const timestamp = createTimestamp(input.createdAt, "createdAt");

    return new ContentInsightSet({
      insightSetId: input.insightSetId,
      businessId: input.businessId,
      performanceId: input.performanceId,
      variantSetId: input.variantSetId,
      contentId: input.contentId,
      status: "active",
      insights: Object.freeze([]),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static rehydrate(snapshot: ContentInsightSetSnapshot): ContentInsightSet {
    validateSnapshot(snapshot);
    return new ContentInsightSet(cloneSnapshot(snapshot));
  }

  get insightSetId(): ContentInsightSetId {
    return this.snapshot.insightSetId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get performanceId(): ContentPerformanceId {
    return this.snapshot.performanceId;
  }

  get variantSetId(): ContentVariantSetId {
    return this.snapshot.variantSetId;
  }

  get contentId(): ContentId {
    return this.snapshot.contentId;
  }

  get status(): ContentInsightSetStatus {
    return this.snapshot.status;
  }

  recordInsight(input: RecordContentInsightInput): void {
    this.assertActive();
    this.assertNoOpenInsight(input.platform, input.action);

    const createdAt = createTimestamp(input.createdAt, "createdAt");
    const insight: ContentInsightSnapshot = {
      insightId: input.insightId,
      platform: createContentPlatform(input.platform),
      type: createContentInsightType(input.type),
      severity: createContentInsightSeverity(input.severity),
      action: createContentInsightAction(input.action),
      message: createContentInsightMessage(input.message),
      evidence: createEvidence(input.evidence),
      status: "open",
      createdAt,
    };

    this.replace({
      ...this.snapshot,
      insights: Object.freeze([...this.snapshot.insights, insight]),
      updatedAt: createdAt,
    });
  }

  resolveInsight(insightId: ContentInsightId, resolvedAt: Timestamp): void {
    this.assertActive();

    const insight = this.findInsight(insightId, "open");
    const timestamp = createTimestamp(resolvedAt, "resolvedAt");

    this.replaceInsight(insight, {
      ...insight,
      status: "resolved",
      resolvedAt: timestamp,
    });
  }

  archiveInsight(insightId: ContentInsightId, archivedAt: Timestamp): void {
    this.assertActive();

    const insight = this.findInsight(insightId);
    const timestamp = createTimestamp(archivedAt, "archivedAt");

    this.replaceInsight(insight, {
      ...insight,
      status: "archived",
      archivedAt: timestamp,
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
      status: "active",
      archivedAt: undefined,
      updatedAt: timestamp,
    });
  }

  getInsight(insightId: ContentInsightId): ContentInsightSnapshot | null {
    const insight = this.snapshot.insights.find(
      (candidate) => candidate.insightId === insightId
    );

    return insight ? cloneInsight(insight) : null;
  }

  listInsights(): readonly ContentInsightSnapshot[] {
    return cloneInsights(this.snapshot.insights);
  }

  toSnapshot(): ContentInsightSetSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  private assertActive(): void {
    if (this.snapshot.status === "archived") {
      throw new Error("Archived content insight sets cannot be modified.");
    }
  }

  private assertNoOpenInsight(platform: string, action: string): void {
    const normalizedPlatform = createContentPlatform(platform);
    const normalizedAction = createContentInsightAction(action);

    if (
      this.snapshot.insights.some(
        (insight) =>
          insight.platform === normalizedPlatform &&
          insight.action === normalizedAction &&
          insight.status === "open"
      )
    ) {
      throw new Error("An open content insight already exists for this platform and action.");
    }
  }

  private findInsight(
    insightId: ContentInsightId,
    status?: ContentInsightStatus
  ): ContentInsightSnapshot {
    const insight = this.snapshot.insights.find(
      (candidate) =>
        candidate.insightId === insightId &&
        (status === undefined ? true : candidate.status === status)
    );

    if (!insight) {
      throw new Error("Content insight was not found.");
    }

    return insight;
  }

  private replaceInsight(
    current: ContentInsightSnapshot,
    next: ContentInsightSnapshot
  ): void {
    const updatedAt = next.resolvedAt ?? next.archivedAt ?? next.createdAt;

    this.replace({
      ...this.snapshot,
      insights: Object.freeze(
        this.snapshot.insights.map((insight) =>
          insight === current ? next : insight
        )
      ),
      updatedAt,
    });
  }

  private replace(snapshot: ContentInsightSetSnapshot): void {
    validateSnapshot(snapshot);
    this.snapshot = cloneSnapshot(snapshot);
  }
}

export function createInsightFromSummary(
  insightId: ContentInsightId,
  summary: ContentPerformanceSummary,
  createdAt: Timestamp
): RecordContentInsightInput {
  if (summary.conversions > 0 || summary.leads > 0) {
    return {
      insightId,
      platform: summary.platform,
      type: "winner",
      severity: "high",
      action: "amplify",
      message: "Content is generating leads or conversions. Amplify this platform variant.",
      evidence: createEvidenceFromSummary(summary),
      createdAt,
    };
  }

  if (summary.impressions > 0 && summary.engagements === 0) {
    return {
      insightId,
      platform: summary.platform,
      type: "underperformer",
      severity: "medium",
      action: "iterate",
      message: "Content has reach but no engagement. Iterate the hook or CTA.",
      evidence: createEvidenceFromSummary(summary),
      createdAt,
    };
  }

  return {
    insightId,
    platform: summary.platform,
    type: "trend",
    severity: "low",
    action: "monitor",
    message: "Content does not yet show a decisive performance pattern. Continue monitoring.",
    evidence: createEvidenceFromSummary(summary),
    createdAt,
  };
}

export function createContentInsightMessage(
  message: string
): ContentInsightMessage {
  const normalized = message.trim();

  if (normalized.length === 0) {
    throw new Error("Content insight message is required.");
  }

  return normalized as ContentInsightMessage;
}

export function createContentInsightType(type: string): ContentInsightType {
  const normalized = type.trim().toLowerCase();

  if (!isContentInsightType(normalized)) {
    throw new Error(`Unsupported content insight type: ${type}.`);
  }

  return normalized;
}

export function createContentInsightSeverity(
  severity: string
): ContentInsightSeverity {
  const normalized = severity.trim().toLowerCase();

  if (!isContentInsightSeverity(normalized)) {
    throw new Error(`Unsupported content insight severity: ${severity}.`);
  }

  return normalized;
}

export function createContentInsightAction(
  action: string
): ContentInsightAction {
  const normalized = action.trim().toLowerCase();

  if (!isContentInsightAction(normalized)) {
    throw new Error(`Unsupported content insight action: ${action}.`);
  }

  return normalized;
}

function isContentInsightType(value: string): value is ContentInsightType {
  return ["winner", "underperformer", "trend"].includes(value);
}

function isContentInsightSeverity(
  value: string
): value is ContentInsightSeverity {
  return ["low", "medium", "high"].includes(value);
}

function isContentInsightAction(value: string): value is ContentInsightAction {
  return ["amplify", "iterate", "repurpose", "monitor", "retire"].includes(
    value
  );
}

function createEvidenceFromSummary(
  summary: ContentPerformanceSummary
): ContentInsightEvidenceSnapshot {
  return {
    impressions: summary.impressions,
    reach: summary.reach,
    engagements: summary.engagements,
    clicks: summary.clicks,
    saves: summary.saves,
    shares: summary.shares,
    comments: summary.comments,
    leads: summary.leads,
    conversions: summary.conversions,
  };
}

function createEvidence(
  evidence: ContentInsightEvidenceSnapshot
): ContentInsightEvidenceSnapshot {
  return {
    impressions: createMetricValue(evidence.impressions, "impressions"),
    reach: createMetricValue(evidence.reach, "reach"),
    engagements: createMetricValue(evidence.engagements, "engagements"),
    clicks: createMetricValue(evidence.clicks, "clicks"),
    saves: createMetricValue(evidence.saves, "saves"),
    shares: createMetricValue(evidence.shares, "shares"),
    comments: createMetricValue(evidence.comments, "comments"),
    leads: createMetricValue(evidence.leads, "leads"),
    conversions: createMetricValue(evidence.conversions, "conversions"),
  };
}

function createMetricValue(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Content insight ${field} must be a non-negative integer.`);
  }

  return value;
}

function createTimestamp(value: Timestamp, field: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`Content insight ${field} must be a valid timestamp.`);
  }

  return value;
}

function validateSnapshot(snapshot: ContentInsightSetSnapshot): void {
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");

  if (snapshot.status === "archived" && !snapshot.archivedAt) {
    throw new Error("Archived content insight sets require archivedAt.");
  }

  for (const insight of snapshot.insights) {
    createContentPlatform(insight.platform);
    createContentInsightType(insight.type);
    createContentInsightSeverity(insight.severity);
    createContentInsightAction(insight.action);
    createContentInsightMessage(insight.message);
    createEvidence(insight.evidence);
    createTimestamp(insight.createdAt, "createdAt");

    if (insight.status === "resolved" && !insight.resolvedAt) {
      throw new Error("Resolved content insights require resolvedAt.");
    }

    if (insight.status === "archived" && !insight.archivedAt) {
      throw new Error("Archived content insights require archivedAt.");
    }
  }
}

function cloneSnapshot(snapshot: ContentInsightSetSnapshot): ContentInsightSetSnapshot {
  return {
    ...snapshot,
    insights: cloneInsights(snapshot.insights),
  };
}

function cloneInsights(
  insights: readonly ContentInsightSnapshot[]
): readonly ContentInsightSnapshot[] {
  return Object.freeze(insights.map((insight) => cloneInsight(insight)));
}

function cloneInsight(insight: ContentInsightSnapshot): ContentInsightSnapshot {
  return {
    ...insight,
    evidence: { ...insight.evidence },
  };
}
