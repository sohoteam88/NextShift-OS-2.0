import type { BusinessId, TenantContext } from "@nextshift/shared";
import type { BusinessTwinSnapshot } from "@nextshift/contracts";

export interface BusinessTwinRepository {
  getSnapshot(
    businessId: BusinessId,
    tenant: TenantContext
  ): Promise<BusinessTwinSnapshot | null>;
}
