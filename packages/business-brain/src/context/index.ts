import type { BusinessId, TenantContext } from "@nextshift/shared";

export interface BusinessBrainRuntimeContext {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
}
