import type { BusinessId } from "@nextshift/shared";
import type {
  CampaignExecution,
  CampaignExecutionId,
  CampaignExecutionPriority,
  CampaignExecutionStatus,
} from "./campaign-execution";

export interface CampaignExecutionRepository {
  save(execution: CampaignExecution): Promise<void>;
  findById(executionId: CampaignExecutionId): Promise<CampaignExecution | null>;
  findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly CampaignExecution[]>;
  findByStatus(
    businessId: BusinessId,
    status: CampaignExecutionStatus
  ): Promise<readonly CampaignExecution[]>;
  findByPriority(
    businessId: BusinessId,
    priority: CampaignExecutionPriority
  ): Promise<readonly CampaignExecution[]>;
  exists(executionId: CampaignExecutionId): Promise<boolean>;
}
