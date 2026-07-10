import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";
import type { ContentPlanId } from "../content";
import type { OpportunityEvaluationId } from "../opportunity-evaluation";

export type CampaignExecutionId = Brand<string, "WorkflowCampaignExecutionId">;
export type CampaignExecutionTitle = Brand<
  string,
  "WorkflowCampaignExecutionTitle"
>;
export type CampaignExecutionObjective = Brand<
  string,
  "WorkflowCampaignExecutionObjective"
>;

export type CampaignExecutionStatus =
  | "draft"
  | "prepared"
  | "launched"
  | "completed"
  | "cancelled"
  | "archived";

export type CampaignExecutionPriority = "low" | "medium" | "high" | "critical";

export type CampaignExecutionChannel =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "xiaohongshu"
  | "email"
  | "whatsapp"
  | "webinar"
  | "landing_page"
  | "manual";

export interface CampaignExecutionSnapshot {
  readonly executionId: CampaignExecutionId;
  readonly businessId: BusinessId;
  readonly title: CampaignExecutionTitle;
  readonly objective: CampaignExecutionObjective;
  readonly channels: readonly CampaignExecutionChannel[];
  readonly priority: CampaignExecutionPriority;
  readonly sourceOpportunityId?: OpportunityEvaluationId;
  readonly sourceContentPlanId?: ContentPlanId;
  readonly status: CampaignExecutionStatus;
  readonly preparedAt?: Timestamp;
  readonly launchedAt?: Timestamp;
  readonly completedAt?: Timestamp;
  readonly cancelledAt?: Timestamp;
  readonly archivedAt?: Timestamp;
  readonly resultSummary?: string;
  readonly cancellationReason?: string;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface CreateCampaignExecutionInput {
  readonly executionId: CampaignExecutionId;
  readonly businessId: BusinessId;
  readonly title: string;
  readonly objective: string;
  readonly channels: readonly string[];
  readonly priority: CampaignExecutionPriority;
  readonly sourceOpportunityId?: OpportunityEvaluationId;
  readonly sourceContentPlanId?: ContentPlanId;
  readonly createdAt: Timestamp;
}

export interface CompleteCampaignExecutionInput {
  readonly resultSummary: string;
  readonly completedAt: Timestamp;
}

export interface CancelCampaignExecutionInput {
  readonly reason: string;
  readonly cancelledAt: Timestamp;
}

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

export type CampaignExecutionEventType =
  | "CampaignExecutionCreated"
  | "CampaignExecutionPrepared"
  | "CampaignExecutionLaunched"
  | "CampaignExecutionCompleted"
  | "CampaignExecutionCancelled"
  | "CampaignExecutionArchived";

export interface CampaignExecutionCreatedEvent
  extends CampaignExecutionEventMetadata {
  readonly eventType: "CampaignExecutionCreated";
  readonly payload: {
    readonly executionId: CampaignExecutionId;
    readonly businessId: BusinessId;
    readonly title: CampaignExecutionTitle;
    readonly objective: CampaignExecutionObjective;
    readonly channels: readonly CampaignExecutionChannel[];
    readonly priority: CampaignExecutionPriority;
    readonly sourceOpportunityId?: OpportunityEvaluationId;
    readonly sourceContentPlanId?: ContentPlanId;
    readonly createdAt: Timestamp;
  };
}

export interface CampaignExecutionPreparedEvent
  extends CampaignExecutionEventMetadata {
  readonly eventType: "CampaignExecutionPrepared";
  readonly payload: {
    readonly executionId: CampaignExecutionId;
    readonly preparedAt: Timestamp;
  };
}

export interface CampaignExecutionLaunchedEvent
  extends CampaignExecutionEventMetadata {
  readonly eventType: "CampaignExecutionLaunched";
  readonly payload: {
    readonly executionId: CampaignExecutionId;
    readonly launchedAt: Timestamp;
  };
}

export interface CampaignExecutionCompletedEvent
  extends CampaignExecutionEventMetadata {
  readonly eventType: "CampaignExecutionCompleted";
  readonly payload: {
    readonly executionId: CampaignExecutionId;
    readonly resultSummary: string;
    readonly completedAt: Timestamp;
  };
}

export interface CampaignExecutionCancelledEvent
  extends CampaignExecutionEventMetadata {
  readonly eventType: "CampaignExecutionCancelled";
  readonly payload: {
    readonly executionId: CampaignExecutionId;
    readonly reason: string;
    readonly cancelledAt: Timestamp;
  };
}

export interface CampaignExecutionArchivedEvent
  extends CampaignExecutionEventMetadata {
  readonly eventType: "CampaignExecutionArchived";
  readonly payload: {
    readonly executionId: CampaignExecutionId;
    readonly archivedAt: Timestamp;
  };
}

export type CampaignExecutionDomainEvent =
  | CampaignExecutionCreatedEvent
  | CampaignExecutionPreparedEvent
  | CampaignExecutionLaunchedEvent
  | CampaignExecutionCompletedEvent
  | CampaignExecutionCancelledEvent
  | CampaignExecutionArchivedEvent;

export class CampaignExecution {
  private constructor(private snapshot: CampaignExecutionSnapshot) {}

  static create(input: CreateCampaignExecutionInput): CampaignExecution {
    const timestamp = createTimestamp(input.createdAt, "createdAt");

    return new CampaignExecution({
      executionId: input.executionId,
      businessId: input.businessId,
      title: createCampaignExecutionTitle(input.title),
      objective: createCampaignExecutionObjective(input.objective),
      channels: createCampaignExecutionChannels(input.channels),
      priority: input.priority,
      sourceOpportunityId: input.sourceOpportunityId,
      sourceContentPlanId: input.sourceContentPlanId,
      status: "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static rehydrate(snapshot: CampaignExecutionSnapshot): CampaignExecution {
    validateSnapshot(snapshot);
    return new CampaignExecution(cloneSnapshot(snapshot));
  }

  get executionId(): CampaignExecutionId {
    return this.snapshot.executionId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get status(): CampaignExecutionStatus {
    return this.snapshot.status;
  }

  get priority(): CampaignExecutionPriority {
    return this.snapshot.priority;
  }

  prepare(preparedAt: Timestamp): void {
    this.assertStatus("draft", "prepared");
    const timestamp = createTimestamp(preparedAt, "preparedAt");

    this.replace({
      ...this.snapshot,
      status: "prepared",
      preparedAt: timestamp,
      updatedAt: timestamp,
    });
  }

  launch(launchedAt: Timestamp): void {
    this.assertStatus("prepared", "launched");
    const timestamp = createTimestamp(launchedAt, "launchedAt");

    this.replace({
      ...this.snapshot,
      status: "launched",
      launchedAt: timestamp,
      updatedAt: timestamp,
    });
  }

  complete(input: CompleteCampaignExecutionInput): void {
    this.assertStatus("launched", "completed");
    const timestamp = createTimestamp(input.completedAt, "completedAt");

    this.replace({
      ...this.snapshot,
      status: "completed",
      resultSummary: createRequiredString(
        input.resultSummary,
        "Campaign execution result summary"
      ),
      completedAt: timestamp,
      updatedAt: timestamp,
    });
  }

  cancel(input: CancelCampaignExecutionInput): void {
    if (!["draft", "prepared", "launched"].includes(this.snapshot.status)) {
      throw new Error(
        "Only draft, prepared, or launched campaign executions can be cancelled."
      );
    }

    const timestamp = createTimestamp(input.cancelledAt, "cancelledAt");

    this.replace({
      ...this.snapshot,
      status: "cancelled",
      cancellationReason: createRequiredString(
        input.reason,
        "Campaign execution cancellation reason"
      ),
      cancelledAt: timestamp,
      updatedAt: timestamp,
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

  toSnapshot(): CampaignExecutionSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  private assertStatus(
    expected: CampaignExecutionStatus,
    next: CampaignExecutionStatus
  ): void {
    if (this.snapshot.status === "archived") {
      throw new Error("Archived campaign executions cannot be mutated.");
    }

    if (this.snapshot.status !== expected) {
      throw new Error(
        `Only ${expected} campaign executions can transition to ${next}.`
      );
    }
  }

  private replace(snapshot: CampaignExecutionSnapshot): void {
    validateSnapshot(snapshot);
    this.snapshot = cloneSnapshot(snapshot);
  }
}

export function createCampaignExecutionTitle(
  value: string
): CampaignExecutionTitle {
  return createRequiredString(
    value,
    "Campaign execution title"
  ) as CampaignExecutionTitle;
}

export function createCampaignExecutionObjective(
  value: string
): CampaignExecutionObjective {
  return createRequiredString(
    value,
    "Campaign execution objective"
  ) as CampaignExecutionObjective;
}

export function createCampaignExecutionChannels(
  values: readonly string[]
): readonly CampaignExecutionChannel[] {
  const channels = [
    ...new Set(values.map((value) => createCampaignExecutionChannel(value))),
  ];

  if (channels.length === 0) {
    throw new Error("At least one campaign execution channel is required.");
  }

  return Object.freeze(channels);
}

export function createCampaignExecutionChannel(
  value: string
): CampaignExecutionChannel {
  const normalized = value.trim().toLowerCase().replace(/-/g, "_");

  if (!isCampaignExecutionChannel(normalized)) {
    throw new Error(`Unsupported campaign execution channel: ${value}.`);
  }

  return normalized;
}

function validateSnapshot(snapshot: CampaignExecutionSnapshot): void {
  createCampaignExecutionTitle(snapshot.title);
  createCampaignExecutionObjective(snapshot.objective);
  createCampaignExecutionChannels(snapshot.channels);
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");

  if (snapshot.preparedAt) createTimestamp(snapshot.preparedAt, "preparedAt");
  if (snapshot.launchedAt) createTimestamp(snapshot.launchedAt, "launchedAt");
  if (snapshot.completedAt) createTimestamp(snapshot.completedAt, "completedAt");
  if (snapshot.cancelledAt) createTimestamp(snapshot.cancelledAt, "cancelledAt");
  if (snapshot.archivedAt) createTimestamp(snapshot.archivedAt, "archivedAt");
  if (snapshot.resultSummary !== undefined) {
    createRequiredString(snapshot.resultSummary, "Campaign execution result summary");
  }
  if (snapshot.cancellationReason !== undefined) {
    createRequiredString(
      snapshot.cancellationReason,
      "Campaign execution cancellation reason"
    );
  }

  if (snapshot.status === "prepared" && !snapshot.preparedAt) {
    throw new Error("Prepared campaign executions require preparedAt.");
  }

  if (snapshot.status === "launched" && !snapshot.launchedAt) {
    throw new Error("Launched campaign executions require launchedAt.");
  }

  if (snapshot.status === "completed") {
    if (!snapshot.completedAt) {
      throw new Error("Completed campaign executions require completedAt.");
    }
    if (!snapshot.resultSummary) {
      throw new Error("Completed campaign executions require resultSummary.");
    }
  }

  if (snapshot.status === "cancelled") {
    if (!snapshot.cancelledAt) {
      throw new Error("Cancelled campaign executions require cancelledAt.");
    }
    if (!snapshot.cancellationReason) {
      throw new Error("Cancelled campaign executions require cancellationReason.");
    }
  }

  if (snapshot.status === "archived" && !snapshot.archivedAt) {
    throw new Error("Archived campaign executions require archivedAt.");
  }
}

function isCampaignExecutionChannel(
  value: string
): value is CampaignExecutionChannel {
  return [
    "facebook",
    "instagram",
    "tiktok",
    "xiaohongshu",
    "email",
    "whatsapp",
    "webinar",
    "landing_page",
    "manual",
  ].includes(value);
}

function createRequiredString(value: string, label: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function createTimestamp(value: Timestamp, field: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`Campaign execution ${field} must be a valid timestamp.`);
  }

  return value;
}

function cloneSnapshot(
  snapshot: CampaignExecutionSnapshot
): CampaignExecutionSnapshot {
  return {
    ...snapshot,
    channels: Object.freeze([...snapshot.channels]),
  };
}
