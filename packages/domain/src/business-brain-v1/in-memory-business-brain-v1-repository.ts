import type { BusinessId } from "@nextshift/shared";
import { BusinessBrainV1 } from "./business-brain-v1";
import type {
  BusinessBrainV1Id,
  BusinessBrainV1Snapshot,
} from "./business-brain-v1";
import type { BusinessBrainV1Repository } from "./business-brain-v1-repository";
import type { BusinessFoundationId } from "../business-foundation";

export class InMemoryBusinessBrainV1Repository
  implements BusinessBrainV1Repository
{
  private readonly brains = new Map<BusinessBrainV1Id, BusinessBrainV1Snapshot>();

  async save(brain: BusinessBrainV1): Promise<void> {
    const snapshot = brain.toSnapshot();
    this.brains.set(snapshot.brainId, cloneSnapshot(snapshot));
  }

  async findById(brainId: BusinessBrainV1Id): Promise<BusinessBrainV1 | null> {
    const snapshot = this.brains.get(brainId);
    return snapshot ? BusinessBrainV1.rehydrate(snapshot) : null;
  }

  async findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly BusinessBrainV1[]> {
    return [...this.brains.values()]
      .filter((snapshot) => snapshot.businessId === businessId)
      .sort(compareBrains)
      .map((snapshot) => BusinessBrainV1.rehydrate(snapshot));
  }

  async findLatestByFoundationId(
    foundationId: BusinessFoundationId
  ): Promise<BusinessBrainV1 | null> {
    const snapshot = [...this.brains.values()]
      .filter((item) => item.foundationId === foundationId)
      .sort(compareBrains)
      .at(-1);

    return snapshot ? BusinessBrainV1.rehydrate(snapshot) : null;
  }

  async exists(brainId: BusinessBrainV1Id): Promise<boolean> {
    return this.brains.has(brainId);
  }
}

function compareBrains(
  left: BusinessBrainV1Snapshot,
  right: BusinessBrainV1Snapshot
): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

function cloneSnapshot(snapshot: BusinessBrainV1Snapshot): BusinessBrainV1Snapshot {
  return BusinessBrainV1.rehydrate(snapshot).toSnapshot();
}
