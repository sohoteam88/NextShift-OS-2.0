import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";
import type { ContentId } from ".";
import type {
  ContentInsightAction,
  ContentInsightId,
  ContentInsightSetId,
  ContentInsightSnapshot,
} from "./insight";
import type { ContentPerformanceId } from "./performance";
import type { ContentVariantSetId } from "./variant";

export type ContentRecommendationSetId = Brand<
  string,
  "ContentRecommendationSetId"
>;
export type ContentRecommendationId = Brand<string, "ContentRecommendationId">;
export type ContentRecommendationRationale = Brand<
  string,
  "ContentRecommendationRationale"
>;

export type ContentRecommendationSetStatus = "active" | "archived";
export type ContentRecommendationStatus =
  | "open"
  | "applied"
  | "dismissed"
  | "archived";
export type ContentRecommendationPriority = "low" | "medium" | "high";

export interface ContentRecommendationSnapshot {
  readonly recommendationId: ContentRecommendationId;
  readonly insightId: ContentInsightId;
  readonly action: ContentInsightAction;
  readonly priority: ContentRecommendationPriority;
  readonly rationale: ContentRecommendationRationale;
  readonly status: ContentRecommendationStatus;
  readonly createdAt: Timestamp;
  readonly appliedAt?: Timestamp;
  readonly dismissedAt?: Timestamp;
  readonly archivedAt?: Timestamp;
}

export interface ContentRecommendationSetSnapshot {
  readonly recommendationSetId: ContentRecommendationSetId;
  readonly businessId: BusinessId;
  readonly insightSetId: ContentInsightSetId;
  readonly performanceId: ContentPerformanceId;
  readonly variantSetId: ContentVariantSetId;
  readonly contentId: ContentId;
  readonly status: ContentRecommendationSetStatus;
  readonly recommendations: readonly ContentRecommendationSnapshot[];
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly archivedAt?: Timestamp;
}

export interface CreateContentRecommendationSetInput {
  readonly recommendationSetId: ContentRecommendationSetId;
  readonly businessId: BusinessId;
  readonly insightSetId: ContentInsightSetId;
  readonly performanceId: ContentPerformanceId;
  readonly variantSetId: ContentVariantSetId;
  readonly contentId: ContentId;
  readonly createdAt: Timestamp;
}

export interface RecordContentRecommendationInput {
  readonly recommendationId: ContentRecommendationId;
  readonly insightId: ContentInsightId;
  readonly action: ContentInsightAction;
  readonly priority: ContentRecommendationPriority;
  readonly rationale: string;
  readonly createdAt: Timestamp;
}

export interface ContentRecommendationEventMetadata {
  readonly eventId: EventId;
  readonly eventType: ContentRecommendationEventType;
  readonly aggregateId: ContentRecommendationSetId;
  readonly aggregateType: "ContentRecommendationSet";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type ContentRecommendationEventType =
  | "ContentRecommendationSetCreated"
  | "ContentRecommendationRecorded"
  | "ContentRecommendationApplied"
  | "ContentRecommendationDismissed"
  | "ContentRecommendationArchived"
  | "ContentRecommendationSetArchived"
  | "ContentRecommendationSetRestored";

export interface ContentRecommendationSetCreatedEvent
  extends ContentRecommendationEventMetadata {
  readonly eventType: "ContentRecommendationSetCreated";
  readonly payload: {
    readonly recommendationSetId: ContentRecommendationSetId;
    readonly businessId: BusinessId;
    readonly insightSetId: ContentInsightSetId;
    readonly performanceId: ContentPerformanceId;
    readonly variantSetId: ContentVariantSetId;
    readonly contentId: ContentId;
    readonly createdAt: Timestamp;
  };
}

export interface ContentRecommendationRecordedEvent
  extends ContentRecommendationEventMetadata {
  readonly eventType: "ContentRecommendationRecorded";
  readonly payload: ContentRecommendationSnapshot;
}

export interface ContentRecommendationAppliedEvent
  extends ContentRecommendationEventMetadata {
  readonly eventType: "ContentRecommendationApplied";
  readonly payload: {
    readonly recommendationId: ContentRecommendationId;
    readonly appliedAt: Timestamp;
  };
}

export interface ContentRecommendationDismissedEvent
  extends ContentRecommendationEventMetadata {
  readonly eventType: "ContentRecommendationDismissed";
  readonly payload: {
    readonly recommendationId: ContentRecommendationId;
    readonly dismissedAt: Timestamp;
  };
}

export interface ContentRecommendationArchivedEvent
  extends ContentRecommendationEventMetadata {
  readonly eventType: "ContentRecommendationArchived";
  readonly payload: {
    readonly recommendationId: ContentRecommendationId;
    readonly archivedAt: Timestamp;
  };
}

export interface ContentRecommendationSetArchivedEvent
  extends ContentRecommendationEventMetadata {
  readonly eventType: "ContentRecommendationSetArchived";
  readonly payload: {
    readonly recommendationSetId: ContentRecommendationSetId;
    readonly archivedAt: Timestamp;
  };
}

export interface ContentRecommendationSetRestoredEvent
  extends ContentRecommendationEventMetadata {
  readonly eventType: "ContentRecommendationSetRestored";
  readonly payload: {
    readonly recommendationSetId: ContentRecommendationSetId;
    readonly restoredAt: Timestamp;
  };
}

export type ContentRecommendationDomainEvent =
  | ContentRecommendationSetCreatedEvent
  | ContentRecommendationRecordedEvent
  | ContentRecommendationAppliedEvent
  | ContentRecommendationDismissedEvent
  | ContentRecommendationArchivedEvent
  | ContentRecommendationSetArchivedEvent
  | ContentRecommendationSetRestoredEvent;

export class ContentRecommendationSet {
  private constructor(private snapshot: ContentRecommendationSetSnapshot) {}

  static create(
    input: CreateContentRecommendationSetInput
  ): ContentRecommendationSet {
    const timestamp = createTimestamp(input.createdAt, "createdAt");

    return new ContentRecommendationSet({
      recommendationSetId: input.recommendationSetId,
      businessId: input.businessId,
      insightSetId: input.insightSetId,
      performanceId: input.performanceId,
      variantSetId: input.variantSetId,
      contentId: input.contentId,
      status: "active",
      recommendations: Object.freeze([]),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static rehydrate(
    snapshot: ContentRecommendationSetSnapshot
  ): ContentRecommendationSet {
    validateSnapshot(snapshot);
    return new ContentRecommendationSet(cloneSnapshot(snapshot));
  }

  get recommendationSetId(): ContentRecommendationSetId {
    return this.snapshot.recommendationSetId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get insightSetId(): ContentInsightSetId {
    return this.snapshot.insightSetId;
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

  get status(): ContentRecommendationSetStatus {
    return this.snapshot.status;
  }

  recordRecommendation(input: RecordContentRecommendationInput): void {
    this.assertActive();
    this.assertNoOpenRecommendation(input.insightId, input.action);

    const createdAt = createTimestamp(input.createdAt, "createdAt");
    const recommendation: ContentRecommendationSnapshot = {
      recommendationId: input.recommendationId,
      insightId: input.insightId,
      action: input.action,
      priority: createContentRecommendationPriority(input.priority),
      rationale: createContentRecommendationRationale(input.rationale),
      status: "open",
      createdAt,
    };

    this.replace({
      ...this.snapshot,
      recommendations: Object.freeze([
        ...this.snapshot.recommendations,
        recommendation,
      ]),
      updatedAt: createdAt,
    });
  }

  applyRecommendation(
    recommendationId: ContentRecommendationId,
    appliedAt: Timestamp
  ): void {
    this.assertActive();

    const recommendation = this.findRecommendation(recommendationId, "open");
    const timestamp = createTimestamp(appliedAt, "appliedAt");

    this.replaceRecommendation(recommendation, {
      ...recommendation,
      status: "applied",
      appliedAt: timestamp,
    });
  }

  dismissRecommendation(
    recommendationId: ContentRecommendationId,
    dismissedAt: Timestamp
  ): void {
    this.assertActive();

    const recommendation = this.findRecommendation(recommendationId, "open");
    const timestamp = createTimestamp(dismissedAt, "dismissedAt");

    this.replaceRecommendation(recommendation, {
      ...recommendation,
      status: "dismissed",
      dismissedAt: timestamp,
    });
  }

  archiveRecommendation(
    recommendationId: ContentRecommendationId,
    archivedAt: Timestamp
  ): void {
    this.assertActive();

    const recommendation = this.findRecommendation(recommendationId);
    const timestamp = createTimestamp(archivedAt, "archivedAt");

    this.replaceRecommendation(recommendation, {
      ...recommendation,
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

  getRecommendation(
    recommendationId: ContentRecommendationId
  ): ContentRecommendationSnapshot | null {
    const recommendation = this.snapshot.recommendations.find(
      (candidate) => candidate.recommendationId === recommendationId
    );

    return recommendation ? { ...recommendation } : null;
  }

  listRecommendations(): readonly ContentRecommendationSnapshot[] {
    return cloneRecommendations(this.snapshot.recommendations);
  }

  toSnapshot(): ContentRecommendationSetSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  private assertActive(): void {
    if (this.snapshot.status === "archived") {
      throw new Error("Archived content recommendation sets cannot be modified.");
    }
  }

  private assertNoOpenRecommendation(
    insightId: ContentInsightId,
    action: ContentInsightAction
  ): void {
    if (
      this.snapshot.recommendations.some(
        (recommendation) =>
          recommendation.insightId === insightId &&
          recommendation.action === action &&
          recommendation.status === "open"
      )
    ) {
      throw new Error("An open content recommendation already exists for this insight and action.");
    }
  }

  private findRecommendation(
    recommendationId: ContentRecommendationId,
    status?: ContentRecommendationStatus
  ): ContentRecommendationSnapshot {
    const recommendation = this.snapshot.recommendations.find(
      (candidate) =>
        candidate.recommendationId === recommendationId &&
        (status === undefined ? true : candidate.status === status)
    );

    if (!recommendation) {
      throw new Error("Content recommendation was not found.");
    }

    return recommendation;
  }

  private replaceRecommendation(
    current: ContentRecommendationSnapshot,
    next: ContentRecommendationSnapshot
  ): void {
    const updatedAt =
      next.appliedAt ?? next.dismissedAt ?? next.archivedAt ?? next.createdAt;

    this.replace({
      ...this.snapshot,
      recommendations: Object.freeze(
        this.snapshot.recommendations.map((recommendation) =>
          recommendation === current ? next : recommendation
        )
      ),
      updatedAt,
    });
  }

  private replace(snapshot: ContentRecommendationSetSnapshot): void {
    validateSnapshot(snapshot);
    this.snapshot = cloneSnapshot(snapshot);
  }
}

export function createRecommendationFromInsight(
  recommendationId: ContentRecommendationId,
  insight: ContentInsightSnapshot,
  createdAt: Timestamp
): RecordContentRecommendationInput {
  return {
    recommendationId,
    insightId: insight.insightId,
    action: insight.action,
    priority: mapPriority(insight.action),
    rationale: createRationale(insight),
    createdAt,
  };
}

export function createContentRecommendationPriority(
  priority: string
): ContentRecommendationPriority {
  const normalized = priority.trim().toLowerCase();

  if (!isContentRecommendationPriority(normalized)) {
    throw new Error(`Unsupported content recommendation priority: ${priority}.`);
  }

  return normalized;
}

export function createContentRecommendationRationale(
  rationale: string
): ContentRecommendationRationale {
  const normalized = rationale.trim();

  if (normalized.length === 0) {
    throw new Error("Content recommendation rationale is required.");
  }

  return normalized as ContentRecommendationRationale;
}

function mapPriority(
  action: ContentInsightAction
): ContentRecommendationPriority {
  if (action === "amplify" || action === "retire") {
    return "high";
  }

  if (action === "iterate" || action === "repurpose") {
    return "medium";
  }

  return "low";
}

function createRationale(insight: ContentInsightSnapshot): string {
  return `Recommended action ${insight.action} because: ${insight.message}`;
}

function isContentRecommendationPriority(
  value: string
): value is ContentRecommendationPriority {
  return ["low", "medium", "high"].includes(value);
}

function createTimestamp(value: Timestamp, field: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`Content recommendation ${field} must be a valid timestamp.`);
  }

  return value;
}

function validateSnapshot(snapshot: ContentRecommendationSetSnapshot): void {
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");

  if (snapshot.status === "archived" && !snapshot.archivedAt) {
    throw new Error("Archived content recommendation sets require archivedAt.");
  }

  for (const recommendation of snapshot.recommendations) {
    createContentRecommendationPriority(recommendation.priority);
    createContentRecommendationRationale(recommendation.rationale);
    createTimestamp(recommendation.createdAt, "createdAt");

    if (recommendation.status === "applied" && !recommendation.appliedAt) {
      throw new Error("Applied content recommendations require appliedAt.");
    }

    if (
      recommendation.status === "dismissed" &&
      !recommendation.dismissedAt
    ) {
      throw new Error("Dismissed content recommendations require dismissedAt.");
    }

    if (recommendation.status === "archived" && !recommendation.archivedAt) {
      throw new Error("Archived content recommendations require archivedAt.");
    }
  }
}

function cloneSnapshot(
  snapshot: ContentRecommendationSetSnapshot
): ContentRecommendationSetSnapshot {
  return {
    ...snapshot,
    recommendations: cloneRecommendations(snapshot.recommendations),
  };
}

function cloneRecommendations(
  recommendations: readonly ContentRecommendationSnapshot[]
): readonly ContentRecommendationSnapshot[] {
  return Object.freeze(
    recommendations.map((recommendation) => ({ ...recommendation }))
  );
}
