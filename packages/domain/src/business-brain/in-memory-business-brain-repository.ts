import { BusinessBrain } from "./business-brain";
import type {
  BusinessBrainId,
  BusinessBrainSnapshot,
} from "./business-brain";
import type { BusinessBrainRepository } from "./business-brain-repository";

export class InMemoryBusinessBrainRepository
  implements BusinessBrainRepository
{
  private readonly businessBrains = new Map<
    BusinessBrainId,
    BusinessBrainSnapshot
  >();

  async save(businessBrain: BusinessBrain): Promise<void> {
    const snapshot = businessBrain.toSnapshot();
    this.businessBrains.set(snapshot.id, snapshot);
  }

  async findById(id: BusinessBrainId): Promise<BusinessBrain | null> {
    const snapshot = this.businessBrains.get(id);
    return snapshot ? BusinessBrain.rehydrate(snapshot) : null;
  }
}
