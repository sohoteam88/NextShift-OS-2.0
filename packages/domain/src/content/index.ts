import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";

export type ContentId = Brand<string, "ContentId">;
export type ContentTitle = Brand<string, "ContentTitle">;
export type ContentBody = Brand<string, "ContentBody">;

export type ContentType =
  | "article"
  | "video"
  | "image"
  | "email"
  | "landing_page"
  | "social_post";

export type ContentCategory =
  | "education"
  | "story"
  | "authority"
  | "offer"
  | "community";

export type ContentStatus = "draft" | "published" | "archived";

export interface ContentAssetSnapshot {
  readonly contentId: ContentId;
  readonly businessId: BusinessId;
  readonly type: ContentType;
  readonly category: ContentCategory;
  readonly title: ContentTitle;
  readonly body?: ContentBody;
  readonly status: ContentStatus;
  readonly tags: readonly string[];
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly publishedAt?: Timestamp;
  readonly archivedAt?: Timestamp;
}

export interface CreateContentAssetInput {
  readonly contentId: ContentId;
  readonly businessId: BusinessId;
  readonly type: string;
  readonly category?: string;
  readonly title: string;
  readonly body?: string;
  readonly tags?: readonly string[];
  readonly createdAt: Timestamp;
}

export interface UpdateContentAssetInput {
  readonly type?: string;
  readonly category?: string;
  readonly title?: string;
  readonly body?: string;
  readonly tags?: readonly string[];
  readonly updatedAt: Timestamp;
}

export interface ContentEventMetadata {
  readonly eventId: EventId;
  readonly eventType: ContentEventType;
  readonly aggregateId: ContentId;
  readonly aggregateType: "ContentAsset";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type ContentEventType =
  | "ContentAssetCreated"
  | "ContentAssetUpdated"
  | "ContentAssetPublished"
  | "ContentAssetArchived"
  | "ContentAssetRestored";

export interface ContentAssetCreatedPayload {
  readonly contentId: ContentId;
  readonly businessId: BusinessId;
  readonly type: ContentType;
  readonly category: ContentCategory;
  readonly title: ContentTitle;
  readonly status: ContentStatus;
  readonly createdAt: Timestamp;
}

export interface ContentAssetUpdatedPayload {
  readonly contentId: ContentId;
  readonly updatedFields: readonly string[];
  readonly updatedAt: Timestamp;
}

export interface ContentAssetPublishedPayload {
  readonly contentId: ContentId;
  readonly publishedAt: Timestamp;
}

export interface ContentAssetArchivedPayload {
  readonly contentId: ContentId;
  readonly archivedAt: Timestamp;
  readonly reason?: string;
}

export interface ContentAssetRestoredPayload {
  readonly contentId: ContentId;
  readonly restoredAt: Timestamp;
}

export interface ContentAssetCreatedEvent extends ContentEventMetadata {
  readonly eventType: "ContentAssetCreated";
  readonly payload: ContentAssetCreatedPayload;
}

export interface ContentAssetUpdatedEvent extends ContentEventMetadata {
  readonly eventType: "ContentAssetUpdated";
  readonly payload: ContentAssetUpdatedPayload;
}

export interface ContentAssetPublishedEvent extends ContentEventMetadata {
  readonly eventType: "ContentAssetPublished";
  readonly payload: ContentAssetPublishedPayload;
}

export interface ContentAssetArchivedEvent extends ContentEventMetadata {
  readonly eventType: "ContentAssetArchived";
  readonly payload: ContentAssetArchivedPayload;
}

export interface ContentAssetRestoredEvent extends ContentEventMetadata {
  readonly eventType: "ContentAssetRestored";
  readonly payload: ContentAssetRestoredPayload;
}

export type ContentDomainEvent =
  | ContentAssetCreatedEvent
  | ContentAssetUpdatedEvent
  | ContentAssetPublishedEvent
  | ContentAssetArchivedEvent
  | ContentAssetRestoredEvent;

export class ContentAsset {
  private constructor(private readonly snapshot: ContentAssetSnapshot) {}

  static create(input: CreateContentAssetInput): ContentAsset {
    const timestamp = createTimestamp(input.createdAt, "createdAt");

    return new ContentAsset({
      contentId: input.contentId,
      businessId: input.businessId,
      type: createContentType(input.type),
      category: createContentCategory(input.category ?? "education"),
      title: createContentTitle(input.title),
      body:
        input.body === undefined ? undefined : createOptionalContentBody(input.body),
      status: "draft",
      tags: normalizeTags(input.tags),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static rehydrate(snapshot: ContentAssetSnapshot): ContentAsset {
    validateSnapshot(snapshot);
    return new ContentAsset(cloneSnapshot(snapshot));
  }

  get contentId(): ContentId {
    return this.snapshot.contentId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get status(): ContentStatus {
    return this.snapshot.status;
  }

  update(input: UpdateContentAssetInput): void {
    this.assertMutable();

    const updatedAt = createTimestamp(input.updatedAt, "updatedAt");
    const nextSnapshot: ContentAssetSnapshot = {
      ...this.snapshot,
      type:
        input.type === undefined
          ? this.snapshot.type
          : createContentType(input.type),
      category:
        input.category === undefined
          ? this.snapshot.category
          : createContentCategory(input.category),
      title:
        input.title === undefined
          ? this.snapshot.title
          : createContentTitle(input.title),
      body:
        input.body === undefined
          ? this.snapshot.body
          : createOptionalContentBody(input.body),
      tags: input.tags === undefined ? this.snapshot.tags : normalizeTags(input.tags),
      updatedAt,
    };

    validateSnapshot(nextSnapshot);
    replaceSnapshot(this.snapshot, nextSnapshot);
  }

  publish(publishedAt: Timestamp): void {
    this.assertMutable();

    const timestamp = createTimestamp(publishedAt, "publishedAt");
    const nextSnapshot: ContentAssetSnapshot = {
      ...this.snapshot,
      status: "published",
      publishedAt: timestamp,
      updatedAt: timestamp,
    };

    validateSnapshot(nextSnapshot);
    replaceSnapshot(this.snapshot, nextSnapshot);
  }

  archive(archivedAt: Timestamp): void {
    if (this.snapshot.status === "archived") {
      return;
    }

    const timestamp = createTimestamp(archivedAt, "archivedAt");
    const nextSnapshot: ContentAssetSnapshot = {
      ...this.snapshot,
      status: "archived",
      archivedAt: timestamp,
      updatedAt: timestamp,
    };

    validateSnapshot(nextSnapshot);
    replaceSnapshot(this.snapshot, nextSnapshot);
  }

  restore(restoredAt: Timestamp): void {
    if (this.snapshot.status !== "archived") {
      return;
    }

    const timestamp = createTimestamp(restoredAt, "restoredAt");
    const nextSnapshot: ContentAssetSnapshot = {
      ...this.snapshot,
      status: this.snapshot.publishedAt ? "published" : "draft",
      archivedAt: undefined,
      updatedAt: timestamp,
    };

    validateSnapshot(nextSnapshot);
    replaceSnapshot(this.snapshot, nextSnapshot);
  }

  toSnapshot(): ContentAssetSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  private assertMutable(): void {
    if (this.snapshot.status === "archived") {
      throw new Error("Archived content assets cannot be modified.");
    }
  }
}

export function createContentType(type: string): ContentType {
  const normalized = type.trim().toLowerCase();

  if (!isContentType(normalized)) {
    throw new Error(`Unsupported content type: ${type}.`);
  }

  return normalized;
}

export function createContentCategory(category: string): ContentCategory {
  const normalized = category.trim().toLowerCase();

  if (!isContentCategory(normalized)) {
    throw new Error(`Unsupported content category: ${category}.`);
  }

  return normalized;
}

export function createContentTitle(title: string): ContentTitle {
  const normalized = title.trim();

  if (normalized.length === 0) {
    throw new Error("Content title is required.");
  }

  return normalized as ContentTitle;
}

function createOptionalContentBody(body: string): ContentBody | undefined {
  const normalized = body.trim();
  return normalized.length === 0 ? undefined : (normalized as ContentBody);
}

function isContentType(value: string): value is ContentType {
  return [
    "article",
    "video",
    "image",
    "email",
    "landing_page",
    "social_post",
  ].includes(value);
}

function isContentCategory(value: string): value is ContentCategory {
  return ["education", "story", "authority", "offer", "community"].includes(
    value
  );
}

function createTimestamp(value: Timestamp, field: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`Content ${field} must be a valid timestamp.`);
  }

  return value;
}

function normalizeTags(tags: readonly string[] | undefined): readonly string[] {
  return Object.freeze([
    ...new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean)),
  ]);
}

function validateSnapshot(snapshot: ContentAssetSnapshot): void {
  createContentType(snapshot.type);
  createContentCategory(snapshot.category);
  createContentTitle(snapshot.title);
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");

  if (snapshot.status === "published" && !snapshot.publishedAt) {
    throw new Error("Published content assets require publishedAt.");
  }

  if (snapshot.status === "archived" && !snapshot.archivedAt) {
    throw new Error("Archived content assets require archivedAt.");
  }
}

function cloneSnapshot(snapshot: ContentAssetSnapshot): ContentAssetSnapshot {
  return {
    ...snapshot,
    tags: Object.freeze([...snapshot.tags]),
  };
}

function replaceSnapshot(
  target: ContentAssetSnapshot,
  source: ContentAssetSnapshot
): void {
  Object.assign(target, cloneSnapshot(source));
}

export * from "./content-repository";
export * from "./in-memory-content-repository";
export * from "./calendar";
export * from "./content-calendar-repository";
export * from "./in-memory-content-calendar-repository";
export * from "./plan";
export * from "./content-plan-repository";
export * from "./in-memory-content-plan-repository";
export * from "./variant";
export * from "./content-variant-repository";
export * from "./in-memory-content-variant-repository";
export * from "./performance";
export * from "./content-performance-repository";
export * from "./in-memory-content-performance-repository";
export * from "./insight";
export * from "./content-insight-repository";
export * from "./in-memory-content-insight-repository";
export * from "./recommendation";
export * from "./content-recommendation-repository";
export * from "./in-memory-content-recommendation-repository";
export * from "./execution";
export * from "./content-execution-repository";
export * from "./in-memory-content-execution-repository";
