import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";
import type { ContentId } from ".";
import { createContentPlatform, type ContentCalendarId } from "./calendar";
import type { ContentPlatform } from "./calendar";

export type ContentPlanId = Brand<string, "ContentPlanId">;
export type ContentPlanName = Brand<string, "ContentPlanName">;

export type ContentPlanPriority = "low" | "medium" | "high";
export type ContentApprovalDecision = "approved" | "rejected" | "needs_revision";
export type ContentPlanStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "needs_revision"
  | "active"
  | "archived";
export type PlannedContentStatus = "planned" | "scheduled" | "removed";

export interface ContentApprovalSnapshot {
  readonly reviewer: string;
  readonly decision: ContentApprovalDecision;
  readonly reason?: string;
  readonly approvedAt: Timestamp;
}

export interface PlannedContentSnapshot {
  readonly contentId: ContentId;
  readonly platforms: readonly ContentPlatform[];
  readonly plannedFor: Timestamp;
  readonly status: PlannedContentStatus;
  readonly addedAt: Timestamp;
  readonly scheduledAt?: Timestamp;
  readonly removedAt?: Timestamp;
}

export interface ContentPlanSnapshot {
  readonly planId: ContentPlanId;
  readonly businessId: BusinessId;
  readonly calendarId?: ContentCalendarId;
  readonly name: ContentPlanName;
  readonly title?: string;
  readonly objective?: string;
  readonly audience?: string;
  readonly channel?: string;
  readonly priority?: ContentPlanPriority;
  readonly recommendedPublishDate?: Timestamp;
  readonly status: ContentPlanStatus;
  readonly entries: readonly PlannedContentSnapshot[];
  readonly approvalHistory?: readonly ContentApprovalSnapshot[];
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly submittedAt?: Timestamp;
  readonly archivedAt?: Timestamp;
}

export interface CreateContentPlanInput {
  readonly planId: ContentPlanId;
  readonly businessId: BusinessId;
  readonly calendarId: ContentCalendarId;
  readonly name: string;
  readonly createdAt: Timestamp;
}

export interface CreateApprovalContentPlanInput {
  readonly planId: ContentPlanId;
  readonly businessId: BusinessId;
  readonly title: string;
  readonly objective: string;
  readonly audience: string;
  readonly channel: string;
  readonly priority: ContentPlanPriority;
  readonly recommendedPublishDate: Timestamp;
  readonly createdAt: Timestamp;
}

export interface AddPlannedContentInput {
  readonly contentId: ContentId;
  readonly platforms: readonly string[];
  readonly plannedFor: Timestamp;
  readonly addedAt: Timestamp;
}

export interface ContentApprovalInput {
  readonly reviewer: string;
  readonly reason?: string;
  readonly approvedAt: Timestamp;
}

export interface ContentPlanEventMetadata {
  readonly eventId: EventId;
  readonly eventType: ContentPlanEventType;
  readonly aggregateId: ContentPlanId;
  readonly aggregateType: "ContentPlan";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type ContentPlanEventType =
  | "ContentPlanCreated"
  | "ContentSubmittedForReview"
  | "ContentApproved"
  | "ContentRejected"
  | "ContentRevisionRequested"
  | "PlannedContentAdded"
  | "PlannedContentScheduled"
  | "PlannedContentRemoved"
  | "ContentPlanArchived"
  | "ContentPlanRestored";

export interface ContentPlanCreatedEvent extends ContentPlanEventMetadata {
  readonly eventType: "ContentPlanCreated";
  readonly payload: {
    readonly planId: ContentPlanId;
    readonly businessId: BusinessId;
    readonly calendarId?: ContentCalendarId;
    readonly name: ContentPlanName;
    readonly title?: string;
    readonly objective?: string;
    readonly audience?: string;
    readonly channel?: string;
    readonly priority?: ContentPlanPriority;
    readonly recommendedPublishDate?: Timestamp;
    readonly createdAt: Timestamp;
  };
}

export interface ContentSubmittedForReviewEvent extends ContentPlanEventMetadata {
  readonly eventType: "ContentSubmittedForReview";
  readonly payload: {
    readonly planId: ContentPlanId;
    readonly submittedAt: Timestamp;
  };
}

export interface ContentApprovedEvent extends ContentPlanEventMetadata {
  readonly eventType: "ContentApproved";
  readonly payload: ContentApprovalSnapshot & {
    readonly planId: ContentPlanId;
  };
}

export interface ContentRejectedEvent extends ContentPlanEventMetadata {
  readonly eventType: "ContentRejected";
  readonly payload: ContentApprovalSnapshot & {
    readonly planId: ContentPlanId;
  };
}

export interface ContentRevisionRequestedEvent extends ContentPlanEventMetadata {
  readonly eventType: "ContentRevisionRequested";
  readonly payload: ContentApprovalSnapshot & {
    readonly planId: ContentPlanId;
  };
}

export interface PlannedContentAddedEvent extends ContentPlanEventMetadata {
  readonly eventType: "PlannedContentAdded";
  readonly payload: PlannedContentSnapshot;
}

export interface PlannedContentScheduledEvent extends ContentPlanEventMetadata {
  readonly eventType: "PlannedContentScheduled";
  readonly payload: {
    readonly contentId: ContentId;
    readonly calendarId: ContentCalendarId;
    readonly platforms: readonly ContentPlatform[];
    readonly plannedFor: Timestamp;
    readonly scheduledAt: Timestamp;
  };
}

export interface PlannedContentRemovedEvent extends ContentPlanEventMetadata {
  readonly eventType: "PlannedContentRemoved";
  readonly payload: {
    readonly contentId: ContentId;
    readonly removedAt: Timestamp;
  };
}

export interface ContentPlanArchivedEvent extends ContentPlanEventMetadata {
  readonly eventType: "ContentPlanArchived";
  readonly payload: {
    readonly planId: ContentPlanId;
    readonly archivedAt: Timestamp;
  };
}

export interface ContentPlanRestoredEvent extends ContentPlanEventMetadata {
  readonly eventType: "ContentPlanRestored";
  readonly payload: {
    readonly planId: ContentPlanId;
    readonly restoredAt: Timestamp;
  };
}

export type ContentPlanDomainEvent =
  | ContentPlanCreatedEvent
  | ContentSubmittedForReviewEvent
  | ContentApprovedEvent
  | ContentRejectedEvent
  | ContentRevisionRequestedEvent
  | PlannedContentAddedEvent
  | PlannedContentScheduledEvent
  | PlannedContentRemovedEvent
  | ContentPlanArchivedEvent
  | ContentPlanRestoredEvent;

export class ContentPlan {
  private constructor(private snapshot: ContentPlanSnapshot) {}

  static create(input: CreateContentPlanInput): ContentPlan {
    const timestamp = createTimestamp(input.createdAt, "createdAt");

    return new ContentPlan({
      planId: input.planId,
      businessId: input.businessId,
      calendarId: input.calendarId,
      name: createContentPlanName(input.name),
      status: "active",
      entries: Object.freeze([]),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static createApprovalPlan(input: CreateApprovalContentPlanInput): ContentPlan {
    const timestamp = createTimestamp(input.createdAt, "createdAt");
    const recommendedPublishDate = createTimestamp(
      input.recommendedPublishDate,
      "recommendedPublishDate"
    );
    const title = createRequiredText(input.title, "title");

    return new ContentPlan({
      planId: input.planId,
      businessId: input.businessId,
      name: createContentPlanName(title),
      title,
      objective: createRequiredText(input.objective, "objective"),
      audience: createRequiredText(input.audience, "audience"),
      channel: createRequiredText(input.channel, "channel"),
      priority: input.priority,
      recommendedPublishDate,
      status: "draft",
      entries: Object.freeze([]),
      approvalHistory: Object.freeze([]),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static rehydrate(snapshot: ContentPlanSnapshot): ContentPlan {
    validateSnapshot(snapshot);
    return new ContentPlan(cloneSnapshot(snapshot));
  }

  get planId(): ContentPlanId {
    return this.snapshot.planId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get calendarId(): ContentCalendarId {
    if (!this.snapshot.calendarId) {
      throw new Error("Content plan is not linked to a calendar.");
    }

    return this.snapshot.calendarId;
  }

  get linkedCalendarId(): ContentCalendarId | undefined {
    return this.snapshot.calendarId;
  }

  get status(): ContentPlanStatus {
    return this.snapshot.status;
  }

  addPlannedContent(input: AddPlannedContentInput): void {
    this.assertActive();
    this.assertNoActiveEntry(input.contentId);

    const addedAt = createTimestamp(input.addedAt, "addedAt");
    const entry: PlannedContentSnapshot = {
      contentId: input.contentId,
      platforms: normalizePlatforms(input.platforms),
      plannedFor: createTimestamp(input.plannedFor, "plannedFor"),
      status: "planned",
      addedAt,
    };

    this.replace({
      ...this.snapshot,
      entries: Object.freeze([...this.snapshot.entries, entry]),
      updatedAt: addedAt,
    });
  }

  markContentScheduled(contentId: ContentId, scheduledAt: Timestamp): void {
    this.assertActive();

    const entry = this.findEntry(contentId, "planned");
    const timestamp = createTimestamp(scheduledAt, "scheduledAt");

    this.replaceEntry(entry, {
      ...entry,
      status: "scheduled",
      scheduledAt: timestamp,
    });
  }

  removePlannedContent(contentId: ContentId, removedAt: Timestamp): void {
    this.assertActive();

    const entry = this.findEntry(contentId, "planned");
    const timestamp = createTimestamp(removedAt, "removedAt");

    this.replaceEntry(entry, {
      ...entry,
      status: "removed",
      removedAt: timestamp,
    });
  }

  submitForReview(submittedAt: Timestamp): void {
    if (
      this.snapshot.status !== "draft" &&
      this.snapshot.status !== "needs_revision"
    ) {
      throw new Error("Only draft or revision content plans can be submitted.");
    }

    const timestamp = createTimestamp(submittedAt, "submittedAt");

    this.replace({
      ...this.snapshot,
      status: "pending_review",
      submittedAt: timestamp,
      updatedAt: timestamp,
    });
  }

  approve(input: ContentApprovalInput): void {
    this.recordApproval("approved", input);
  }

  reject(input: ContentApprovalInput): void {
    this.recordApproval("rejected", input);
  }

  requestRevision(input: ContentApprovalInput): void {
    this.recordApproval("needs_revision", input);
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

  getEntry(contentId: ContentId): PlannedContentSnapshot | null {
    const entry = this.snapshot.entries.find(
      (candidate) => candidate.contentId === contentId
    );

    return entry ? cloneEntry(entry) : null;
  }

  listEntries(): readonly PlannedContentSnapshot[] {
    return cloneEntries(this.snapshot.entries);
  }

  listApprovals(): readonly ContentApprovalSnapshot[] {
    return cloneApprovals(this.snapshot.approvalHistory ?? []);
  }

  toSnapshot(): ContentPlanSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  private assertActive(): void {
    if (this.snapshot.status === "archived") {
      throw new Error("Archived content plans cannot be modified.");
    }
  }

  private recordApproval(
    decision: ContentApprovalDecision,
    input: ContentApprovalInput
  ): void {
    if (this.snapshot.status !== "pending_review") {
      throw new Error("Only pending review content plans can receive decisions.");
    }

    const approvedAt = createTimestamp(input.approvedAt, "approvedAt");
    const approval: ContentApprovalSnapshot = {
      reviewer: createRequiredText(input.reviewer, "reviewer"),
      decision,
      reason:
        input.reason === undefined
          ? undefined
          : createRequiredText(input.reason, "reason"),
      approvedAt,
    };

    this.replace({
      ...this.snapshot,
      status: decision,
      approvalHistory: Object.freeze([
        ...(this.snapshot.approvalHistory ?? []),
        approval,
      ]),
      updatedAt: approvedAt,
    });
  }

  private assertNoActiveEntry(contentId: ContentId): void {
    if (
      this.snapshot.entries.some(
        (entry) => entry.contentId === contentId && entry.status !== "removed"
      )
    ) {
      throw new Error("Content is already part of this content plan.");
    }
  }

  private findEntry(
    contentId: ContentId,
    status: PlannedContentStatus
  ): PlannedContentSnapshot {
    const entry = this.snapshot.entries.find(
      (candidate) =>
        candidate.contentId === contentId && candidate.status === status
    );

    if (!entry) {
      throw new Error("Planned content entry was not found.");
    }

    return entry;
  }

  private replaceEntry(
    current: PlannedContentSnapshot,
    next: PlannedContentSnapshot
  ): void {
    this.replace({
      ...this.snapshot,
      entries: Object.freeze(
        this.snapshot.entries.map((entry) => (entry === current ? next : entry))
      ),
      updatedAt: next.scheduledAt ?? next.removedAt ?? next.addedAt,
    });
  }

  private replace(snapshot: ContentPlanSnapshot): void {
    validateSnapshot(snapshot);
    this.snapshot = cloneSnapshot(snapshot);
  }
}

export function createContentPlanName(name: string): ContentPlanName {
  const normalized = name.trim();

  if (normalized.length === 0) {
    throw new Error("Content plan name is required.");
  }

  return normalized as ContentPlanName;
}

function createRequiredText(value: string, field: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Error(`Content plan ${field} is required.`);
  }

  return normalized;
}

function normalizePlatforms(platforms: readonly string[]): readonly ContentPlatform[] {
  const normalized = [
    ...new Set(platforms.map((platform) => createContentPlatform(platform))),
  ];

  if (normalized.length === 0) {
    throw new Error("At least one content platform is required.");
  }

  return Object.freeze(normalized);
}

function createTimestamp(value: Timestamp, field: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`Content plan ${field} must be a valid timestamp.`);
  }

  return value;
}

function validateSnapshot(snapshot: ContentPlanSnapshot): void {
  createContentPlanName(snapshot.name);
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");

  if (snapshot.title !== undefined) createRequiredText(snapshot.title, "title");
  if (snapshot.objective !== undefined) {
    createRequiredText(snapshot.objective, "objective");
  }
  if (snapshot.audience !== undefined) {
    createRequiredText(snapshot.audience, "audience");
  }
  if (snapshot.channel !== undefined) {
    createRequiredText(snapshot.channel, "channel");
  }
  if (snapshot.recommendedPublishDate !== undefined) {
    createTimestamp(snapshot.recommendedPublishDate, "recommendedPublishDate");
  }
  if (snapshot.submittedAt !== undefined) {
    createTimestamp(snapshot.submittedAt, "submittedAt");
  }

  if (snapshot.status === "archived" && !snapshot.archivedAt) {
    throw new Error("Archived content plans require archivedAt.");
  }

  for (const approval of snapshot.approvalHistory ?? []) {
    createRequiredText(approval.reviewer, "reviewer");
    createTimestamp(approval.approvedAt, "approvedAt");
    if (approval.reason !== undefined) createRequiredText(approval.reason, "reason");
  }

  for (const entry of snapshot.entries) {
    normalizePlatforms(entry.platforms);
    createTimestamp(entry.plannedFor, "plannedFor");
    createTimestamp(entry.addedAt, "addedAt");

    if (entry.status === "scheduled" && !entry.scheduledAt) {
      throw new Error("Scheduled planned content requires scheduledAt.");
    }

    if (entry.status === "removed" && !entry.removedAt) {
      throw new Error("Removed planned content requires removedAt.");
    }
  }
}

function cloneSnapshot(snapshot: ContentPlanSnapshot): ContentPlanSnapshot {
  return {
    ...snapshot,
    entries: cloneEntries(snapshot.entries),
    approvalHistory:
      snapshot.approvalHistory === undefined
        ? undefined
        : cloneApprovals(snapshot.approvalHistory),
  };
}

function cloneApprovals(
  approvals: readonly ContentApprovalSnapshot[]
): readonly ContentApprovalSnapshot[] {
  return Object.freeze(approvals.map((approval) => ({ ...approval })));
}

function cloneEntries(
  entries: readonly PlannedContentSnapshot[]
): readonly PlannedContentSnapshot[] {
  return Object.freeze(entries.map((entry) => cloneEntry(entry)));
}

function cloneEntry(entry: PlannedContentSnapshot): PlannedContentSnapshot {
  return {
    ...entry,
    platforms: Object.freeze([...entry.platforms]),
  };
}
