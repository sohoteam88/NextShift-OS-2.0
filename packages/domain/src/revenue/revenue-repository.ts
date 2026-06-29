import type { BusinessId, Timestamp } from "@nextshift/shared";
import type {
  Revenue,
  RevenueId,
  RevenueSource,
  RevenueStatus,
} from "./revenue";

export interface RevenueSearchCriteria {
  readonly businessId?: BusinessId;
  readonly source?: RevenueSource;
  readonly status?: RevenueStatus;
  readonly currency?: string;
}

export interface RevenueRepository {
  save(revenue: Revenue): Promise<void>;
  findById(revenueId: RevenueId): Promise<Revenue | null>;
  findByBusinessId(businessId: BusinessId): Promise<readonly Revenue[]>;
  search(criteria: RevenueSearchCriteria): Promise<readonly Revenue[]>;
  exists(revenueId: RevenueId): Promise<boolean>;
  archive(revenueId: RevenueId, archivedAt: Timestamp): Promise<Revenue | null>;
}
