import type { BusinessId } from "@nextshift/shared";
import type { CampaignId } from ".";
import type {
  CampaignExecution,
  CampaignExecutionId,
} from "./campaign-execution";

export interface CampaignExecutionRepository {
  save(execution: CampaignExecution): Promise<void>;
  findById(executionId: CampaignExecutionId): Promise<CampaignExecution | null>;
  findByCampaignId(
    campaignId: CampaignId
  ): Promise<readonly CampaignExecution[]>;
  findActiveByCampaignId(
    campaignId: CampaignId
  ): Promise<CampaignExecution | null>;
  listActive(businessId?: BusinessId): Promise<readonly CampaignExecution[]>;
  listHistory(campaignId?: CampaignId): Promise<readonly CampaignExecution[]>;
  exists(executionId: CampaignExecutionId): Promise<boolean>;
}
