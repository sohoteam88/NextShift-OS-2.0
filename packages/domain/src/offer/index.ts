import type { BusinessId } from "@nextshift/shared";

export interface Offer {
  readonly offerId: string;
  readonly businessId: BusinessId;
  readonly name: string;
  readonly valueProposition?: string;
  readonly priceDescription?: string;
}
