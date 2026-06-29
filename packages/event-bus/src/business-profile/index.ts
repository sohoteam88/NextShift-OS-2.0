import type {
  BrandProfileUpdatedPayload,
  BusinessEvent,
  BusinessGoalsUpdatedPayload,
  BusinessProfileCreatedPayload,
  BusinessTwinActivatedPayload,
  BusinessUnderstandingGeneratedPayload,
  CustomerProfileUpdatedPayload,
  OfferProfileUpdatedPayload,
} from "@nextshift/contracts";
import type {
  BusinessId,
  CorrelationId,
  EventId,
  TenantContext,
  Timestamp,
} from "@nextshift/shared";
import type { EventBus } from "../bus";

export const BUSINESS_PROFILE_CREATED_EVENT_TYPE = "BusinessProfileCreated";
export const BRAND_PROFILE_UPDATED_EVENT_TYPE = "BrandProfileUpdated";
export const OFFER_PROFILE_UPDATED_EVENT_TYPE = "OfferProfileUpdated";
export const CUSTOMER_PROFILE_UPDATED_EVENT_TYPE = "CustomerProfileUpdated";
export const BUSINESS_GOALS_UPDATED_EVENT_TYPE = "BusinessGoalsUpdated";
export const BUSINESS_UNDERSTANDING_GENERATED_EVENT_TYPE =
  "BusinessUnderstandingGenerated";
export const BUSINESS_TWIN_ACTIVATED_EVENT_TYPE = "BusinessTwinActivated";

export type BusinessProfileCreatedEvent =
  BusinessEvent<BusinessProfileCreatedPayload> & {
    readonly eventType: typeof BUSINESS_PROFILE_CREATED_EVENT_TYPE;
  };

export type BrandProfileUpdatedEvent =
  BusinessEvent<BrandProfileUpdatedPayload> & {
    readonly eventType: typeof BRAND_PROFILE_UPDATED_EVENT_TYPE;
  };

export type OfferProfileUpdatedEvent =
  BusinessEvent<OfferProfileUpdatedPayload> & {
    readonly eventType: typeof OFFER_PROFILE_UPDATED_EVENT_TYPE;
  };

export type CustomerProfileUpdatedEvent =
  BusinessEvent<CustomerProfileUpdatedPayload> & {
    readonly eventType: typeof CUSTOMER_PROFILE_UPDATED_EVENT_TYPE;
  };

export type BusinessGoalsUpdatedEvent =
  BusinessEvent<BusinessGoalsUpdatedPayload> & {
    readonly eventType: typeof BUSINESS_GOALS_UPDATED_EVENT_TYPE;
  };

export type BusinessUnderstandingGeneratedEvent =
  BusinessEvent<BusinessUnderstandingGeneratedPayload> & {
    readonly eventType: typeof BUSINESS_UNDERSTANDING_GENERATED_EVENT_TYPE;
  };

export type BusinessTwinActivatedEvent =
  BusinessEvent<BusinessTwinActivatedPayload> & {
    readonly eventType: typeof BUSINESS_TWIN_ACTIVATED_EVENT_TYPE;
  };

export interface PublishBusinessProfileCreatedInput {
  readonly eventId?: EventId;
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly payload: BusinessProfileCreatedPayload;
  readonly occurredAt: Timestamp;
  readonly correlationId?: CorrelationId;
}

export interface PublishBrandProfileUpdatedInput {
  readonly eventId?: EventId;
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly payload: BrandProfileUpdatedPayload;
  readonly occurredAt: Timestamp;
  readonly correlationId?: CorrelationId;
}

export interface PublishOfferProfileUpdatedInput {
  readonly eventId?: EventId;
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly payload: OfferProfileUpdatedPayload;
  readonly occurredAt: Timestamp;
  readonly correlationId?: CorrelationId;
}

export interface PublishCustomerProfileUpdatedInput {
  readonly eventId?: EventId;
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly payload: CustomerProfileUpdatedPayload;
  readonly occurredAt: Timestamp;
  readonly correlationId?: CorrelationId;
}

export interface PublishBusinessGoalsUpdatedInput {
  readonly eventId?: EventId;
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly payload: BusinessGoalsUpdatedPayload;
  readonly occurredAt: Timestamp;
  readonly correlationId?: CorrelationId;
}

export interface PublishBusinessUnderstandingGeneratedInput {
  readonly eventId?: EventId;
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly payload: BusinessUnderstandingGeneratedPayload;
  readonly occurredAt: Timestamp;
  readonly correlationId?: CorrelationId;
}

export interface PublishBusinessTwinActivatedInput {
  readonly eventId?: EventId;
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly payload: BusinessTwinActivatedPayload;
  readonly occurredAt: Timestamp;
  readonly correlationId?: CorrelationId;
}

export class BusinessProfileEventPublisher {
  constructor(private readonly eventBus: EventBus) {}

  async publishCreated(
    input: PublishBusinessProfileCreatedInput
  ): Promise<BusinessProfileCreatedEvent> {
    const event: BusinessProfileCreatedEvent = {
      eventId: input.eventId ?? (crypto.randomUUID() as EventId),
      eventType: BUSINESS_PROFILE_CREATED_EVENT_TYPE,
      businessId: input.businessId,
      tenant: input.tenant,
      occurredAt: input.occurredAt,
      payload: input.payload,
      correlationId: input.correlationId,
    };

    await this.eventBus.publish(event);

    return event;
  }

  async publishBrandUpdated(
    input: PublishBrandProfileUpdatedInput
  ): Promise<BrandProfileUpdatedEvent> {
    const event: BrandProfileUpdatedEvent = {
      eventId: input.eventId ?? (crypto.randomUUID() as EventId),
      eventType: BRAND_PROFILE_UPDATED_EVENT_TYPE,
      businessId: input.businessId,
      tenant: input.tenant,
      occurredAt: input.occurredAt,
      payload: input.payload,
      correlationId: input.correlationId,
    };

    await this.eventBus.publish(event);

    return event;
  }

  async publishOfferUpdated(
    input: PublishOfferProfileUpdatedInput
  ): Promise<OfferProfileUpdatedEvent> {
    const event: OfferProfileUpdatedEvent = {
      eventId: input.eventId ?? (crypto.randomUUID() as EventId),
      eventType: OFFER_PROFILE_UPDATED_EVENT_TYPE,
      businessId: input.businessId,
      tenant: input.tenant,
      occurredAt: input.occurredAt,
      payload: input.payload,
      correlationId: input.correlationId,
    };

    await this.eventBus.publish(event);

    return event;
  }

  async publishCustomerUpdated(
    input: PublishCustomerProfileUpdatedInput
  ): Promise<CustomerProfileUpdatedEvent> {
    const event: CustomerProfileUpdatedEvent = {
      eventId: input.eventId ?? (crypto.randomUUID() as EventId),
      eventType: CUSTOMER_PROFILE_UPDATED_EVENT_TYPE,
      businessId: input.businessId,
      tenant: input.tenant,
      occurredAt: input.occurredAt,
      payload: input.payload,
      correlationId: input.correlationId,
    };

    await this.eventBus.publish(event);

    return event;
  }

  async publishBusinessGoalsUpdated(
    input: PublishBusinessGoalsUpdatedInput
  ): Promise<BusinessGoalsUpdatedEvent> {
    const event: BusinessGoalsUpdatedEvent = {
      eventId: input.eventId ?? (crypto.randomUUID() as EventId),
      eventType: BUSINESS_GOALS_UPDATED_EVENT_TYPE,
      businessId: input.businessId,
      tenant: input.tenant,
      occurredAt: input.occurredAt,
      payload: input.payload,
      correlationId: input.correlationId,
    };

    await this.eventBus.publish(event);

    return event;
  }

  async publishBusinessUnderstandingGenerated(
    input: PublishBusinessUnderstandingGeneratedInput
  ): Promise<BusinessUnderstandingGeneratedEvent> {
    const event: BusinessUnderstandingGeneratedEvent = {
      eventId: input.eventId ?? (crypto.randomUUID() as EventId),
      eventType: BUSINESS_UNDERSTANDING_GENERATED_EVENT_TYPE,
      businessId: input.businessId,
      tenant: input.tenant,
      occurredAt: input.occurredAt,
      payload: input.payload,
      correlationId: input.correlationId,
    };

    await this.eventBus.publish(event);

    return event;
  }

  async publishBusinessTwinActivated(
    input: PublishBusinessTwinActivatedInput
  ): Promise<BusinessTwinActivatedEvent> {
    const event: BusinessTwinActivatedEvent = {
      eventId: input.eventId ?? (crypto.randomUUID() as EventId),
      eventType: BUSINESS_TWIN_ACTIVATED_EVENT_TYPE,
      businessId: input.businessId,
      tenant: input.tenant,
      occurredAt: input.occurredAt,
      payload: input.payload,
      correlationId: input.correlationId,
    };

    await this.eventBus.publish(event);

    return event;
  }
}
