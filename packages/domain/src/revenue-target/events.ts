import type {
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";
import type {
  RevenueTargetId,
  RevenueTargetName,
  RevenueTargetPeriod,
  RevenueTargetSummary,
} from "./revenue-target";

export type RevenueTargetEventType =
  | "RevenueTargetCreated"
  | "RevenueTargetUpdated"
  | "RevenueTargetArchived";

export interface RevenueTargetEventMetadata {
  readonly eventId: EventId;
  readonly eventType: RevenueTargetEventType;
  readonly aggregateId: RevenueTargetId;
  readonly aggregateType: "RevenueTarget";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export interface RevenueTargetCreatedEvent
  extends RevenueTargetEventMetadata {
  readonly eventType: "RevenueTargetCreated";
  readonly payload: {
    readonly revenueTargetId: RevenueTargetId;
    readonly businessId: BusinessId;
    readonly name: RevenueTargetName;
    readonly period: RevenueTargetPeriod;
    readonly summary: RevenueTargetSummary;
    readonly createdAt: Timestamp;
  };
}

export interface RevenueTargetUpdatedEvent
  extends RevenueTargetEventMetadata {
  readonly eventType: "RevenueTargetUpdated";
  readonly payload: {
    readonly revenueTargetId: RevenueTargetId;
    readonly updatedFields: readonly string[];
    readonly updatedAt: Timestamp;
  };
}

export interface RevenueTargetArchivedEvent
  extends RevenueTargetEventMetadata {
  readonly eventType: "RevenueTargetArchived";
  readonly payload: {
    readonly revenueTargetId: RevenueTargetId;
    readonly archivedAt: Timestamp;
  };
}

export type RevenueTargetDomainEvent =
  | RevenueTargetCreatedEvent
  | RevenueTargetUpdatedEvent
  | RevenueTargetArchivedEvent;

export type RevenueTargetEventDraft =
  | {
      readonly eventType: "RevenueTargetCreated";
      readonly occurredAt: Timestamp;
      readonly payload: RevenueTargetCreatedEvent["payload"];
    }
  | {
      readonly eventType: "RevenueTargetUpdated";
      readonly occurredAt: Timestamp;
      readonly payload: RevenueTargetUpdatedEvent["payload"];
    }
  | {
      readonly eventType: "RevenueTargetArchived";
      readonly occurredAt: Timestamp;
      readonly payload: RevenueTargetArchivedEvent["payload"];
    };
