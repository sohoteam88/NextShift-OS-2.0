import type {
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";
import type {
  RevenueId,
  RevenuePeriod,
  RevenueSource,
  RevenueSummary,
} from "./revenue";

export type RevenueEventType =
  | "RevenueCreated"
  | "RevenueRecorded"
  | "RevenueRecognized"
  | "RevenueArchived";

export interface RevenueEventMetadata {
  readonly eventId: EventId;
  readonly eventType: RevenueEventType;
  readonly aggregateId: RevenueId;
  readonly aggregateType: "Revenue";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export interface RevenueCreatedEvent extends RevenueEventMetadata {
  readonly eventType: "RevenueCreated";
  readonly payload: {
    readonly revenueId: RevenueId;
    readonly businessId: BusinessId;
    readonly source: RevenueSource;
    readonly period: RevenuePeriod;
    readonly summary: RevenueSummary;
    readonly createdAt: Timestamp;
  };
}

export interface RevenueRecordedEvent extends RevenueEventMetadata {
  readonly eventType: "RevenueRecorded";
  readonly payload: {
    readonly revenueId: RevenueId;
    readonly recordedAt: Timestamp;
  };
}

export interface RevenueRecognizedEvent extends RevenueEventMetadata {
  readonly eventType: "RevenueRecognized";
  readonly payload: {
    readonly revenueId: RevenueId;
    readonly recognizedAt: Timestamp;
  };
}

export interface RevenueArchivedEvent extends RevenueEventMetadata {
  readonly eventType: "RevenueArchived";
  readonly payload: {
    readonly revenueId: RevenueId;
    readonly archivedAt: Timestamp;
  };
}

export type RevenueDomainEvent =
  | RevenueCreatedEvent
  | RevenueRecordedEvent
  | RevenueRecognizedEvent
  | RevenueArchivedEvent;

export type RevenueEventDraft =
  | {
      readonly eventType: "RevenueCreated";
      readonly occurredAt: Timestamp;
      readonly payload: RevenueCreatedEvent["payload"];
    }
  | {
      readonly eventType: "RevenueRecorded";
      readonly occurredAt: Timestamp;
      readonly payload: RevenueRecordedEvent["payload"];
    }
  | {
      readonly eventType: "RevenueRecognized";
      readonly occurredAt: Timestamp;
      readonly payload: RevenueRecognizedEvent["payload"];
    }
  | {
      readonly eventType: "RevenueArchived";
      readonly occurredAt: Timestamp;
      readonly payload: RevenueArchivedEvent["payload"];
    };
