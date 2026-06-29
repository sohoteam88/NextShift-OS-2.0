import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";

export type CampaignId = Brand<string, "CampaignId">;
export type CampaignName = Brand<string, "CampaignName">;
export type CampaignObjective = Brand<string, "CampaignObjective">;

export type CampaignStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "archived";

export type CampaignChannel =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "xiaohongshu"
  | "email"
  | "whatsapp"
  | "webinar"
  | "landing_page";

export interface CampaignSnapshot {
  readonly campaignId: CampaignId;
  readonly businessId: BusinessId;
  readonly name: CampaignName;
  readonly objective: CampaignObjective;
  readonly channels: readonly CampaignChannel[];
  readonly status: CampaignStatus;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly launchedAt?: Timestamp;
  readonly pausedAt?: Timestamp;
  readonly resumedAt?: Timestamp;
  readonly completedAt?: Timestamp;
  readonly archivedAt?: Timestamp;
}

export interface CreateCampaignInput {
  readonly campaignId: CampaignId;
  readonly businessId: BusinessId;
  readonly name: string;
  readonly objective: string;
  readonly channels?: readonly string[];
  readonly createdAt: Timestamp;
}

export interface UpdateCampaignInput {
  readonly name?: string;
  readonly objective?: string;
  readonly channels?: readonly string[];
  readonly updatedAt: Timestamp;
}

export interface CampaignEventMetadata {
  readonly eventId: EventId;
  readonly eventType: CampaignEventType;
  readonly aggregateId: CampaignId;
  readonly aggregateType: "Campaign";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type CampaignEventType =
  | "CampaignCreated"
  | "CampaignUpdated"
  | "CampaignLaunched"
  | "CampaignPaused"
  | "CampaignResumed"
  | "CampaignCompleted"
  | "CampaignArchived"
  | "CampaignRestored";

export interface CampaignCreatedEvent extends CampaignEventMetadata {
  readonly eventType: "CampaignCreated";
  readonly payload: {
    readonly campaignId: CampaignId;
    readonly businessId: BusinessId;
    readonly name: CampaignName;
    readonly objective: CampaignObjective;
    readonly channels: readonly CampaignChannel[];
    readonly createdAt: Timestamp;
  };
}

export interface CampaignUpdatedEvent extends CampaignEventMetadata {
  readonly eventType: "CampaignUpdated";
  readonly payload: {
    readonly campaignId: CampaignId;
    readonly updatedFields: readonly string[];
    readonly updatedAt: Timestamp;
  };
}

export interface CampaignLaunchedEvent extends CampaignEventMetadata {
  readonly eventType: "CampaignLaunched";
  readonly payload: {
    readonly campaignId: CampaignId;
    readonly launchedAt: Timestamp;
  };
}

export interface CampaignPausedEvent extends CampaignEventMetadata {
  readonly eventType: "CampaignPaused";
  readonly payload: {
    readonly campaignId: CampaignId;
    readonly pausedAt: Timestamp;
  };
}

export interface CampaignResumedEvent extends CampaignEventMetadata {
  readonly eventType: "CampaignResumed";
  readonly payload: {
    readonly campaignId: CampaignId;
    readonly resumedAt: Timestamp;
  };
}

export interface CampaignCompletedEvent extends CampaignEventMetadata {
  readonly eventType: "CampaignCompleted";
  readonly payload: {
    readonly campaignId: CampaignId;
    readonly completedAt: Timestamp;
  };
}

export interface CampaignArchivedEvent extends CampaignEventMetadata {
  readonly eventType: "CampaignArchived";
  readonly payload: {
    readonly campaignId: CampaignId;
    readonly archivedAt: Timestamp;
  };
}

export interface CampaignRestoredEvent extends CampaignEventMetadata {
  readonly eventType: "CampaignRestored";
  readonly payload: {
    readonly campaignId: CampaignId;
    readonly restoredAt: Timestamp;
  };
}

export type CampaignDomainEvent =
  | CampaignCreatedEvent
  | CampaignUpdatedEvent
  | CampaignLaunchedEvent
  | CampaignPausedEvent
  | CampaignResumedEvent
  | CampaignCompletedEvent
  | CampaignArchivedEvent
  | CampaignRestoredEvent;

export class Campaign {
  private constructor(private readonly snapshot: CampaignSnapshot) {}

  static create(input: CreateCampaignInput): Campaign {
    const timestamp = createTimestamp(input.createdAt, "createdAt");

    return new Campaign({
      campaignId: input.campaignId,
      businessId: input.businessId,
      name: createCampaignName(input.name),
      objective: createCampaignObjective(input.objective),
      channels: createCampaignChannels(input.channels),
      status: "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static rehydrate(snapshot: CampaignSnapshot): Campaign {
    validateSnapshot(snapshot);
    return new Campaign(cloneSnapshot(snapshot));
  }

  get campaignId(): CampaignId {
    return this.snapshot.campaignId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get status(): CampaignStatus {
    return this.snapshot.status;
  }

  update(input: UpdateCampaignInput): void {
    this.assertEditable();

    const updatedAt = createTimestamp(input.updatedAt, "updatedAt");
    const nextSnapshot: CampaignSnapshot = {
      ...this.snapshot,
      name:
        input.name === undefined
          ? this.snapshot.name
          : createCampaignName(input.name),
      objective:
        input.objective === undefined
          ? this.snapshot.objective
          : createCampaignObjective(input.objective),
      channels:
        input.channels === undefined
          ? this.snapshot.channels
          : createCampaignChannels(input.channels),
      updatedAt,
    };

    this.replace(nextSnapshot);
  }

  launch(launchedAt: Timestamp): void {
    if (this.snapshot.status !== "draft") {
      throw new Error("Only draft campaigns may be launched.");
    }

    const timestamp = createTimestamp(launchedAt, "launchedAt");

    this.replace({
      ...this.snapshot,
      status: "active",
      launchedAt: timestamp,
      updatedAt: timestamp,
    });
  }

  pause(pausedAt: Timestamp): void {
    if (this.snapshot.status !== "active") {
      throw new Error("Only active campaigns may be paused.");
    }

    const timestamp = createTimestamp(pausedAt, "pausedAt");

    this.replace({
      ...this.snapshot,
      status: "paused",
      pausedAt: timestamp,
      updatedAt: timestamp,
    });
  }

  resume(resumedAt: Timestamp): void {
    if (this.snapshot.status !== "paused") {
      throw new Error("Only paused campaigns may be resumed.");
    }

    const timestamp = createTimestamp(resumedAt, "resumedAt");

    this.replace({
      ...this.snapshot,
      status: "active",
      resumedAt: timestamp,
      updatedAt: timestamp,
    });
  }

  complete(completedAt: Timestamp): void {
    if (!["active", "paused"].includes(this.snapshot.status)) {
      throw new Error("Only active or paused campaigns may be completed.");
    }

    const timestamp = createTimestamp(completedAt, "completedAt");

    this.replace({
      ...this.snapshot,
      status: "completed",
      completedAt: timestamp,
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

  restore(restoredAt: Timestamp): void {
    if (this.snapshot.status !== "archived") {
      return;
    }

    const timestamp = createTimestamp(restoredAt, "restoredAt");

    this.replace({
      ...this.snapshot,
      status: "draft",
      archivedAt: undefined,
      updatedAt: timestamp,
    });
  }

  toSnapshot(): CampaignSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  private assertEditable(): void {
    if (this.snapshot.status === "archived") {
      throw new Error("Archived campaigns cannot be modified.");
    }

    if (this.snapshot.status === "completed") {
      throw new Error("Completed campaigns cannot be modified.");
    }
  }

  private replace(snapshot: CampaignSnapshot): void {
    validateSnapshot(snapshot);
    Object.assign(this.snapshot, cloneSnapshot(snapshot));
  }
}

export function createCampaignName(name: string): CampaignName {
  const normalized = name.trim();

  if (normalized.length === 0) {
    throw new Error("Campaign name is required.");
  }

  return normalized as CampaignName;
}

export function createCampaignObjective(
  objective: string
): CampaignObjective {
  const normalized = objective.trim();

  if (normalized.length === 0) {
    throw new Error("Campaign objective is required.");
  }

  return normalized as CampaignObjective;
}

export function createCampaignChannel(channel: string): CampaignChannel {
  const normalized = channel.trim().toLowerCase();

  if (!isCampaignChannel(normalized)) {
    throw new Error(`Unsupported campaign channel: ${channel}.`);
  }

  return normalized;
}

function createCampaignChannels(
  channels: readonly string[] | undefined
): readonly CampaignChannel[] {
  const normalized = Object.freeze([
    ...new Set((channels ?? []).map((channel) => createCampaignChannel(channel))),
  ]);

  if (normalized.length === 0) {
    throw new Error("At least one campaign channel is required.");
  }

  return normalized;
}

function isCampaignChannel(value: string): value is CampaignChannel {
  return [
    "facebook",
    "instagram",
    "tiktok",
    "xiaohongshu",
    "email",
    "whatsapp",
    "webinar",
    "landing_page",
  ].includes(value);
}

function createTimestamp(value: Timestamp, field: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`Campaign ${field} must be a valid timestamp.`);
  }

  return value;
}

function validateSnapshot(snapshot: CampaignSnapshot): void {
  createCampaignName(snapshot.name);
  createCampaignObjective(snapshot.objective);
  createCampaignChannels(snapshot.channels);
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");

  if (snapshot.launchedAt) createTimestamp(snapshot.launchedAt, "launchedAt");
  if (snapshot.pausedAt) createTimestamp(snapshot.pausedAt, "pausedAt");
  if (snapshot.resumedAt) createTimestamp(snapshot.resumedAt, "resumedAt");
  if (snapshot.completedAt) createTimestamp(snapshot.completedAt, "completedAt");
  if (snapshot.archivedAt) createTimestamp(snapshot.archivedAt, "archivedAt");

  if (snapshot.status === "active" && !snapshot.launchedAt) {
    throw new Error("Active campaigns require launchedAt.");
  }

  if (snapshot.status === "paused" && !snapshot.pausedAt) {
    throw new Error("Paused campaigns require pausedAt.");
  }

  if (snapshot.status === "completed" && !snapshot.completedAt) {
    throw new Error("Completed campaigns require completedAt.");
  }

  if (snapshot.status === "archived" && !snapshot.archivedAt) {
    throw new Error("Archived campaigns require archivedAt.");
  }
}

function cloneSnapshot(snapshot: CampaignSnapshot): CampaignSnapshot {
  return {
    ...snapshot,
    channels: Object.freeze([...snapshot.channels]),
  };
}

export * from "./campaign-repository";
export * from "./in-memory-campaign-repository";
export * from "./campaign-schedule";
export * from "./campaign-schedule-repository";
export * from "./in-memory-campaign-schedule-repository";
export * from "./campaign-execution";
export * from "./campaign-execution-repository";
export * from "./in-memory-campaign-execution-repository";
