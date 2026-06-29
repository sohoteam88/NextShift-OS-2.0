import type {
  ActorContext,
  BusinessId,
  CorrelationId,
  TenantContext,
} from "@nextshift/shared";

export interface CapabilityRuntimeContext {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly actor: ActorContext;
  readonly correlationId?: CorrelationId;
}
