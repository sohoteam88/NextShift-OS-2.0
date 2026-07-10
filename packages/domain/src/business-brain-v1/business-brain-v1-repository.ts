import type { BusinessId } from "@nextshift/shared";
import type {
  BusinessBrainV1,
  BusinessBrainV1Id,
} from "./business-brain-v1";
import type { BusinessFoundationId } from "../business-foundation";

export interface BusinessBrainV1Repository {
  save(brain: BusinessBrainV1): Promise<void>;
  findById(brainId: BusinessBrainV1Id): Promise<BusinessBrainV1 | null>;
  findByBusinessId(businessId: BusinessId): Promise<readonly BusinessBrainV1[]>;
  findLatestByFoundationId(
    foundationId: BusinessFoundationId
  ): Promise<BusinessBrainV1 | null>;
  exists(brainId: BusinessBrainV1Id): Promise<boolean>;
}
