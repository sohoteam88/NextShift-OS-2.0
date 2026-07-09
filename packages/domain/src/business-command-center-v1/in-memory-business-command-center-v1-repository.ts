import type { BusinessId } from "@nextshift/shared";
import type { GrowthRevenueV1Id } from "../growth-revenue-v1";
import { BusinessCommandCenterV1 } from "./business-command-center-v1";
import type {
  BusinessCommandCenterV1Id,
  BusinessCommandCenterV1Snapshot,
} from "./business-command-center-v1";
import type { BusinessCommandCenterV1Repository } from "./business-command-center-v1-repository";

export class InMemoryBusinessCommandCenterV1Repository
  implements BusinessCommandCenterV1Repository
{
  private readonly commandCenters = new Map<
    BusinessCommandCenterV1Id,
    BusinessCommandCenterV1Snapshot
  >();

  async save(commandCenter: BusinessCommandCenterV1): Promise<void> {
    const snapshot = commandCenter.toSnapshot();
    this.commandCenters.set(snapshot.commandCenterId, cloneSnapshot(snapshot));
  }

  async findById(
    commandCenterId: BusinessCommandCenterV1Id
  ): Promise<BusinessCommandCenterV1 | null> {
    const snapshot = this.commandCenters.get(commandCenterId);
    return snapshot ? BusinessCommandCenterV1.rehydrate(snapshot) : null;
  }

  async findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly BusinessCommandCenterV1[]> {
    return [...this.commandCenters.values()]
      .filter((snapshot) => snapshot.businessId === businessId)
      .sort(compareCommandCenters)
      .map((snapshot) => BusinessCommandCenterV1.rehydrate(snapshot));
  }

  async findLatestByGrowthRevenueId(
    growthRevenueId: GrowthRevenueV1Id
  ): Promise<BusinessCommandCenterV1 | null> {
    const snapshot = [...this.commandCenters.values()]
      .filter((item) => item.growthRevenueId === growthRevenueId)
      .sort(compareCommandCenters)
      .at(-1);

    return snapshot ? BusinessCommandCenterV1.rehydrate(snapshot) : null;
  }

  async exists(commandCenterId: BusinessCommandCenterV1Id): Promise<boolean> {
    return this.commandCenters.has(commandCenterId);
  }
}

function compareCommandCenters(
  left: BusinessCommandCenterV1Snapshot,
  right: BusinessCommandCenterV1Snapshot
): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

function cloneSnapshot(
  snapshot: BusinessCommandCenterV1Snapshot
): BusinessCommandCenterV1Snapshot {
  return BusinessCommandCenterV1.rehydrate(snapshot).toSnapshot();
}
