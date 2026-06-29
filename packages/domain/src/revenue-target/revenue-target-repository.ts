import type { BusinessId, Timestamp } from "@nextshift/shared";
import type {
  RevenueTarget,
  RevenueTargetId,
  RevenueTargetStatus,
} from "./revenue-target";

export interface RevenueTargetSearchCriteria {
  readonly businessId?: BusinessId;
  readonly status?: RevenueTargetStatus;
  readonly currency?: string;
  readonly name?: string;
}

export interface RevenueTargetRepository {
  save(target: RevenueTarget): Promise<void>;
  findById(targetId: RevenueTargetId): Promise<RevenueTarget | null>;
  findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly RevenueTarget[]>;
  search(
    criteria: RevenueTargetSearchCriteria
  ): Promise<readonly RevenueTarget[]>;
  exists(targetId: RevenueTargetId): Promise<boolean>;
  archive(
    targetId: RevenueTargetId,
    archivedAt: Timestamp
  ): Promise<RevenueTarget | null>;
}
