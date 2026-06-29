import type { BusinessId, TenantContext } from "@nextshift/shared";

export interface MeasurementInput {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly sourceId?: string;
}

export interface MeasurementPort {
  measure(input: MeasurementInput): Promise<void>;
}
