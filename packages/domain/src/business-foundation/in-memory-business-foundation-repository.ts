import type { BusinessId } from "@nextshift/shared";
import { BusinessFoundation } from "./business-foundation";
import type {
  BusinessFoundationId,
  BusinessFoundationSnapshot,
} from "./business-foundation";
import type { BusinessFoundationRepository } from "./business-foundation-repository";

export class InMemoryBusinessFoundationRepository
  implements BusinessFoundationRepository
{
  private readonly foundations = new Map<
    BusinessFoundationId,
    BusinessFoundationSnapshot
  >();

  async save(foundation: BusinessFoundation): Promise<void> {
    const snapshot = foundation.toSnapshot();
    this.foundations.set(snapshot.foundationId, cloneSnapshot(snapshot));
  }

  async findById(
    foundationId: BusinessFoundationId
  ): Promise<BusinessFoundation | null> {
    const snapshot = this.foundations.get(foundationId);
    return snapshot ? BusinessFoundation.rehydrate(snapshot) : null;
  }

  async findByBusinessId(
    businessId: BusinessId
  ): Promise<BusinessFoundation | null> {
    const snapshot = [...this.foundations.values()].find(
      (item) => item.businessId === businessId
    );
    return snapshot ? BusinessFoundation.rehydrate(snapshot) : null;
  }

  async exists(foundationId: BusinessFoundationId): Promise<boolean> {
    return this.foundations.has(foundationId);
  }
}

function cloneSnapshot(
  snapshot: BusinessFoundationSnapshot
): BusinessFoundationSnapshot {
  return BusinessFoundation.rehydrate(snapshot).toSnapshot();
}
