import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";
import type { ContentId } from ".";

export type ContentCalendarId = Brand<string, "ContentCalendarId">;
export type ContentCalendarName = Brand<string, "ContentCalendarName">;

export type ContentPlatform =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "xiaohongshu";

export type ContentCalendarStatus = "active" | "archived";
export type ScheduledContentStatus = "scheduled" | "published" | "cancelled";

export interface ScheduledContentSnapshot {
  readonly contentId: ContentId;
  readonly platform: ContentPlatform;
  readonly scheduledFor: Timestamp;
  readonly status: ScheduledContentStatus;
  readonly scheduledAt: Timestamp;
  readonly publishedAt?: Timestamp;
  readonly cancelledAt?: Timestamp;
}

export interface ContentCalendarSnapshot {
  readonly calendarId: ContentCalendarId;
  readonly businessId: BusinessId;
  readonly name: ContentCalendarName;
  readonly status: ContentCalendarStatus;
  readonly entries: readonly ScheduledContentSnapshot[];
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly archivedAt?: Timestamp;
}

export interface CreateContentCalendarInput {
  readonly calendarId: ContentCalendarId;
  readonly businessId: BusinessId;
  readonly name: string;
  readonly createdAt: Timestamp;
}

export interface ScheduleContentInput {
  readonly contentId: ContentId;
  readonly platform: string;
  readonly scheduledFor: Timestamp;
  readonly scheduledAt: Timestamp;
}

export interface ContentCalendarEventMetadata {
  readonly eventId: EventId;
  readonly eventType: ContentCalendarEventType;
  readonly aggregateId: ContentCalendarId;
  readonly aggregateType: "ContentCalendar";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type ContentCalendarEventType =
  | "ContentCalendarCreated"
  | "ContentScheduled"
  | "ContentRescheduled"
  | "ScheduledContentPublished"
  | "ScheduledContentCancelled"
  | "ContentCalendarArchived"
  | "ContentCalendarRestored";

export interface ContentCalendarCreatedEvent
  extends ContentCalendarEventMetadata {
  readonly eventType: "ContentCalendarCreated";
  readonly payload: {
    readonly calendarId: ContentCalendarId;
    readonly businessId: BusinessId;
    readonly name: ContentCalendarName;
    readonly createdAt: Timestamp;
  };
}

export interface ContentScheduledEvent extends ContentCalendarEventMetadata {
  readonly eventType: "ContentScheduled";
  readonly payload: ScheduledContentSnapshot;
}

export interface ContentRescheduledEvent extends ContentCalendarEventMetadata {
  readonly eventType: "ContentRescheduled";
  readonly payload: {
    readonly contentId: ContentId;
    readonly platform: ContentPlatform;
    readonly scheduledFor: Timestamp;
    readonly rescheduledAt: Timestamp;
  };
}

export interface ScheduledContentPublishedEvent
  extends ContentCalendarEventMetadata {
  readonly eventType: "ScheduledContentPublished";
  readonly payload: {
    readonly contentId: ContentId;
    readonly platform: ContentPlatform;
    readonly publishedAt: Timestamp;
  };
}

export interface ScheduledContentCancelledEvent
  extends ContentCalendarEventMetadata {
  readonly eventType: "ScheduledContentCancelled";
  readonly payload: {
    readonly contentId: ContentId;
    readonly platform: ContentPlatform;
    readonly cancelledAt: Timestamp;
  };
}

export interface ContentCalendarArchivedEvent
  extends ContentCalendarEventMetadata {
  readonly eventType: "ContentCalendarArchived";
  readonly payload: {
    readonly calendarId: ContentCalendarId;
    readonly archivedAt: Timestamp;
  };
}

export interface ContentCalendarRestoredEvent
  extends ContentCalendarEventMetadata {
  readonly eventType: "ContentCalendarRestored";
  readonly payload: {
    readonly calendarId: ContentCalendarId;
    readonly restoredAt: Timestamp;
  };
}

export type ContentCalendarDomainEvent =
  | ContentCalendarCreatedEvent
  | ContentScheduledEvent
  | ContentRescheduledEvent
  | ScheduledContentPublishedEvent
  | ScheduledContentCancelledEvent
  | ContentCalendarArchivedEvent
  | ContentCalendarRestoredEvent;

export class ContentCalendar {
  private constructor(private snapshot: ContentCalendarSnapshot) {}

  static create(input: CreateContentCalendarInput): ContentCalendar {
    const timestamp = createTimestamp(input.createdAt, "createdAt");

    return new ContentCalendar({
      calendarId: input.calendarId,
      businessId: input.businessId,
      name: createContentCalendarName(input.name),
      status: "active",
      entries: Object.freeze([]),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static rehydrate(snapshot: ContentCalendarSnapshot): ContentCalendar {
    validateSnapshot(snapshot);
    return new ContentCalendar(cloneSnapshot(snapshot));
  }

  get calendarId(): ContentCalendarId {
    return this.snapshot.calendarId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get status(): ContentCalendarStatus {
    return this.snapshot.status;
  }

  scheduleContent(input: ScheduleContentInput): void {
    this.assertActive();

    const platform = createContentPlatform(input.platform);
    this.assertNoActiveEntry(input.contentId, platform);

    const entry: ScheduledContentSnapshot = {
      contentId: input.contentId,
      platform,
      scheduledFor: createTimestamp(input.scheduledFor, "scheduledFor"),
      status: "scheduled",
      scheduledAt: createTimestamp(input.scheduledAt, "scheduledAt"),
    };

    this.replace({
      ...this.snapshot,
      entries: Object.freeze([...this.snapshot.entries, entry]),
      updatedAt: entry.scheduledAt,
    });
  }

  rescheduleContent(
    contentId: ContentId,
    platform: string,
    scheduledFor: Timestamp,
    updatedAt: Timestamp
  ): void {
    this.assertActive();

    const normalizedPlatform = createContentPlatform(platform);
    const entry = this.findScheduledEntry(contentId, normalizedPlatform);
    const timestamp = createTimestamp(updatedAt, "updatedAt");

    this.replaceEntry(entry, {
      ...entry,
      scheduledFor: createTimestamp(scheduledFor, "scheduledFor"),
      scheduledAt: timestamp,
    });
  }

  markPublished(
    contentId: ContentId,
    platform: string,
    publishedAt: Timestamp
  ): void {
    this.assertActive();

    const normalizedPlatform = createContentPlatform(platform);
    const entry = this.findScheduledEntry(contentId, normalizedPlatform);
    const timestamp = createTimestamp(publishedAt, "publishedAt");

    this.replaceEntry(entry, {
      ...entry,
      status: "published",
      publishedAt: timestamp,
    });
  }

  cancelScheduledContent(
    contentId: ContentId,
    platform: string,
    cancelledAt: Timestamp
  ): void {
    this.assertActive();

    const normalizedPlatform = createContentPlatform(platform);
    const entry = this.findScheduledEntry(contentId, normalizedPlatform);
    const timestamp = createTimestamp(cancelledAt, "cancelledAt");

    this.replaceEntry(entry, {
      ...entry,
      status: "cancelled",
      cancelledAt: timestamp,
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

  listEntries(): readonly ScheduledContentSnapshot[] {
    return cloneEntries(this.snapshot.entries);
  }

  toSnapshot(): ContentCalendarSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  private assertActive(): void {
    if (this.snapshot.status === "archived") {
      throw new Error("Archived content calendars cannot be modified.");
    }
  }

  private assertNoActiveEntry(
    contentId: ContentId,
    platform: ContentPlatform
  ): void {
    if (
      this.snapshot.entries.some(
        (entry) =>
          entry.contentId === contentId &&
          entry.platform === platform &&
          entry.status !== "cancelled"
      )
    ) {
      throw new Error("Content is already scheduled for this platform.");
    }
  }

  private findScheduledEntry(
    contentId: ContentId,
    platform: ContentPlatform
  ): ScheduledContentSnapshot {
    const entry = this.snapshot.entries.find(
      (candidate) =>
        candidate.contentId === contentId &&
        candidate.platform === platform &&
        candidate.status === "scheduled"
    );

    if (!entry) {
      throw new Error("Scheduled content entry was not found.");
    }

    return entry;
  }

  private replaceEntry(
    current: ScheduledContentSnapshot,
    next: ScheduledContentSnapshot
  ): void {
    this.replace({
      ...this.snapshot,
      entries: Object.freeze(
        this.snapshot.entries.map((entry) => (entry === current ? next : entry))
      ),
      updatedAt:
        next.publishedAt ?? next.cancelledAt ?? next.scheduledAt,
    });
  }

  private replace(snapshot: ContentCalendarSnapshot): void {
    validateSnapshot(snapshot);
    this.snapshot = cloneSnapshot(snapshot);
  }
}

export function createContentCalendarName(
  name: string
): ContentCalendarName {
  const normalized = name.trim();

  if (normalized.length === 0) {
    throw new Error("Content calendar name is required.");
  }

  return normalized as ContentCalendarName;
}

export function createContentPlatform(platform: string): ContentPlatform {
  const normalized = platform.trim().toLowerCase();

  if (!isContentPlatform(normalized)) {
    throw new Error(`Unsupported content platform: ${platform}.`);
  }

  return normalized;
}

function isContentPlatform(value: string): value is ContentPlatform {
  return ["facebook", "instagram", "tiktok", "xiaohongshu"].includes(value);
}

function createTimestamp(value: Timestamp, field: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`Content calendar ${field} must be a valid timestamp.`);
  }

  return value;
}

function validateSnapshot(snapshot: ContentCalendarSnapshot): void {
  createContentCalendarName(snapshot.name);
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");

  if (snapshot.status === "archived" && !snapshot.archivedAt) {
    throw new Error("Archived content calendars require archivedAt.");
  }

  for (const entry of snapshot.entries) {
    createContentPlatform(entry.platform);
    createTimestamp(entry.scheduledFor, "scheduledFor");
    createTimestamp(entry.scheduledAt, "scheduledAt");

    if (entry.status === "published" && !entry.publishedAt) {
      throw new Error("Published scheduled content requires publishedAt.");
    }

    if (entry.status === "cancelled" && !entry.cancelledAt) {
      throw new Error("Cancelled scheduled content requires cancelledAt.");
    }
  }
}

function cloneSnapshot(
  snapshot: ContentCalendarSnapshot
): ContentCalendarSnapshot {
  return {
    ...snapshot,
    entries: cloneEntries(snapshot.entries),
  };
}

function cloneEntries(
  entries: readonly ScheduledContentSnapshot[]
): readonly ScheduledContentSnapshot[] {
  return Object.freeze(entries.map((entry) => ({ ...entry })));
}
