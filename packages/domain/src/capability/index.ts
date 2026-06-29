export type CapabilityCategory =
  | "customer_acquisition"
  | "lead_conversion"
  | "revenue_growth"
  | "customer_retention"
  | "brand_development"
  | "business_operations"
  | "business_intelligence";

export interface CapabilityDefinition {
  readonly capabilityId: string;
  readonly category: CapabilityCategory;
  readonly name: string;
  readonly description?: string;
}
