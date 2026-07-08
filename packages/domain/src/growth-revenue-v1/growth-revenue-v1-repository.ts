import type { BusinessId } from "@nextshift/shared";
import type { CreativeStudioV1Id } from "../creative-studio-v1";
import type { GrowthRevenueV1, GrowthRevenueV1Id } from "./growth-revenue-v1";

export interface GrowthRevenueV1Repository {
  save(growthRevenue: GrowthRevenueV1): Promise<void>;
  findById(growthRevenueId: GrowthRevenueV1Id): Promise<GrowthRevenueV1 | null>;
  findByBusinessId(businessId: BusinessId): Promise<readonly GrowthRevenueV1[]>;
  findLatestByCreativeStudioId(
    creativeStudioId: CreativeStudioV1Id
  ): Promise<GrowthRevenueV1 | null>;
  exists(growthRevenueId: GrowthRevenueV1Id): Promise<boolean>;
}
