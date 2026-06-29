import type {
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  SourceMetadata,
  TenantContext,
  Timestamp,
} from "@nextshift/shared";

export interface BusinessEvent<TPayload = unknown> {
  readonly eventId: EventId;
  readonly eventType: string;
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly occurredAt: Timestamp;
  readonly payload: TPayload;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
  readonly metadata?: SourceMetadata;
}
