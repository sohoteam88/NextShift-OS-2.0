import type {
  ActorContext,
  BusinessId,
  CorrelationId,
  TenantContext,
} from "@nextshift/shared";

export interface ApplicationContext {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly actor: ActorContext;
  readonly correlationId?: CorrelationId;
}
