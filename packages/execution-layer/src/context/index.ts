import type { BusinessId, TenantContext } from "@nextshift/shared";

export interface ExecutionRuntimeContext {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
}
