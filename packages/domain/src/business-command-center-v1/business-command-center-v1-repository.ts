import type { BusinessId } from "@nextshift/shared";
import type { GrowthRevenueV1Id } from "../growth-revenue-v1";
import type {
  BusinessCommandCenterV1,
  BusinessCommandCenterV1Id,
} from "./business-command-center-v1";

export interface BusinessCommandCenterV1Repository {
  save(commandCenter: BusinessCommandCenterV1): Promise<void>;
  findById(
    commandCenterId: BusinessCommandCenterV1Id
  ): Promise<BusinessCommandCenterV1 | null>;
  findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly BusinessCommandCenterV1[]>;
  findLatestByGrowthRevenueId(
    growthRevenueId: GrowthRevenueV1Id
  ): Promise<BusinessCommandCenterV1 | null>;
  exists(commandCenterId: BusinessCommandCenterV1Id): Promise<boolean>;
}
