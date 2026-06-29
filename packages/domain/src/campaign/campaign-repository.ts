import type { BusinessId, Timestamp } from "@nextshift/shared";
import type {
  Campaign,
  CampaignChannel,
  CampaignId,
  CampaignStatus,
} from ".";

export interface CampaignSearchCriteria {
  readonly businessId?: BusinessId;
  readonly status?: CampaignStatus;
  readonly channel?: CampaignChannel;
  readonly name?: string;
}

export interface CampaignRepository {
  save(campaign: Campaign): Promise<void>;
  findById(campaignId: CampaignId): Promise<Campaign | null>;
  findByBusinessId(businessId: BusinessId): Promise<readonly Campaign[]>;
  search(criteria: CampaignSearchCriteria): Promise<readonly Campaign[]>;
  exists(campaignId: CampaignId): Promise<boolean>;
  archive(
    campaignId: CampaignId,
    archivedAt: Timestamp
  ): Promise<Campaign | null>;
}
