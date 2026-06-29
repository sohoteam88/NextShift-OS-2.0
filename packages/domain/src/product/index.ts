import type { BusinessId } from "@nextshift/shared";

export interface Product {
  readonly productId: string;
  readonly businessId: BusinessId;
  readonly name: string;
  readonly description?: string;
}

export interface Service {
  readonly serviceId: string;
  readonly businessId: BusinessId;
  readonly name: string;
  readonly description?: string;
}
