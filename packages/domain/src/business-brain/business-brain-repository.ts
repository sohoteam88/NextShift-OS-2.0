import type { BusinessBrain, BusinessBrainId } from "./business-brain";

export interface BusinessBrainRepository {
  save(businessBrain: BusinessBrain): Promise<void>;
  findById(id: BusinessBrainId): Promise<BusinessBrain | null>;
}
