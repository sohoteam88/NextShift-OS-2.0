import type { BusinessId } from "@nextshift/shared";
import type {
  BusinessFoundation,
  BusinessFoundationId,
} from "./business-foundation";

export interface BusinessFoundationRepository {
  save(foundation: BusinessFoundation): Promise<void>;
  findById(foundationId: BusinessFoundationId): Promise<BusinessFoundation | null>;
  findByBusinessId(businessId: BusinessId): Promise<BusinessFoundation | null>;
  exists(foundationId: BusinessFoundationId): Promise<boolean>;
}
