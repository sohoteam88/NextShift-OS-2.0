import type { BusinessId, TenantContext } from "@nextshift/shared";

export interface LearningRuntimeContext {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
}
