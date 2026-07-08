import type { BusinessId } from "@nextshift/shared";
import type { CreativeStudioV1Id } from "../creative-studio-v1";
import { GrowthRevenueV1 } from "./growth-revenue-v1";
import type {
  GrowthRevenueV1Id,
  GrowthRevenueV1Snapshot,
} from "./growth-revenue-v1";
import type { GrowthRevenueV1Repository } from "./growth-revenue-v1-repository";

export class InMemoryGrowthRevenueV1Repository
  implements GrowthRevenueV1Repository
{
  private readonly growthRevenueRecords = new Map<
    GrowthRevenueV1Id,
    GrowthRevenueV1Snapshot
  >();

  async save(growthRevenue: GrowthRevenueV1): Promise<void> {
    const snapshot = growthRevenue.toSnapshot();
    this.growthRevenueRecords.set(snapshot.growthRevenueId, cloneSnapshot(snapshot));
  }

  async findById(
    growthRevenueId: GrowthRevenueV1Id
  ): Promise<GrowthRevenueV1 | null> {
    const snapshot = this.growthRevenueRecords.get(growthRevenueId);
    return snapshot ? GrowthRevenueV1.rehydrate(snapshot) : null;
  }

  async findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly GrowthRevenueV1[]> {
    return [...this.growthRevenueRecords.values()]
      .filter((snapshot) => snapshot.businessId === businessId)
      .sort(compareGrowthRevenueRecords)
      .map((snapshot) => GrowthRevenueV1.rehydrate(snapshot));
  }

  async findLatestByCreativeStudioId(
    creativeStudioId: CreativeStudioV1Id
  ): Promise<GrowthRevenueV1 | null> {
    const snapshot = [...this.growthRevenueRecords.values()]
      .filter((item) => item.creativeStudioId === creativeStudioId)
      .sort(compareGrowthRevenueRecords)
      .at(-1);

    return snapshot ? GrowthRevenueV1.rehydrate(snapshot) : null;
  }

  async exists(growthRevenueId: GrowthRevenueV1Id): Promise<boolean> {
    return this.growthRevenueRecords.has(growthRevenueId);
  }
}

function compareGrowthRevenueRecords(
  left: GrowthRevenueV1Snapshot,
  right: GrowthRevenueV1Snapshot
): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

function cloneSnapshot(
  snapshot: GrowthRevenueV1Snapshot
): GrowthRevenueV1Snapshot {
  return GrowthRevenueV1.rehydrate(snapshot).toSnapshot();
}
