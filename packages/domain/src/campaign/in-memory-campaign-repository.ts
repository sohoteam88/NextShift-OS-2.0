import type { BusinessId, Timestamp } from "@nextshift/shared";
import { Campaign } from ".";
import type { CampaignId, CampaignSnapshot } from ".";
import type {
  CampaignRepository,
  CampaignSearchCriteria,
} from "./campaign-repository";

export class InMemoryCampaignRepository implements CampaignRepository {
  private readonly campaigns = new Map<CampaignId, CampaignSnapshot>();

  async save(campaign: Campaign): Promise<void> {
    const snapshot = campaign.toSnapshot();
    this.campaigns.set(snapshot.campaignId, cloneSnapshot(snapshot));
  }

  async findById(campaignId: CampaignId): Promise<Campaign | null> {
    const snapshot = this.campaigns.get(campaignId);
    return snapshot ? Campaign.rehydrate(snapshot) : null;
  }

  async findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly Campaign[]> {
    return this.search({ businessId });
  }

  async search(
    criteria: CampaignSearchCriteria
  ): Promise<readonly Campaign[]> {
    return [...this.campaigns.values()]
      .filter((campaign) => matchesCriteria(campaign, criteria))
      .sort(compareCampaigns)
      .map((campaign) => Campaign.rehydrate(campaign));
  }

  async exists(campaignId: CampaignId): Promise<boolean> {
    return this.campaigns.has(campaignId);
  }

  async archive(
    campaignId: CampaignId,
    archivedAt: Timestamp
  ): Promise<Campaign | null> {
    const campaign = await this.findById(campaignId);

    if (!campaign) {
      return null;
    }

    campaign.archive(archivedAt);
    await this.save(campaign);

    return campaign;
  }
}

function matchesCriteria(
  campaign: CampaignSnapshot,
  criteria: CampaignSearchCriteria
): boolean {
  if (criteria.businessId && campaign.businessId !== criteria.businessId) {
    return false;
  }

  if (criteria.status && campaign.status !== criteria.status) {
    return false;
  }

  if (
    criteria.channel &&
    !campaign.channels.includes(criteria.channel)
  ) {
    return false;
  }

  return !(
    criteria.name &&
    !campaign.name.toLowerCase().includes(criteria.name.trim().toLowerCase())
  );
}

function compareCampaigns(
  left: CampaignSnapshot,
  right: CampaignSnapshot
): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

function cloneSnapshot(snapshot: CampaignSnapshot): CampaignSnapshot {
  return {
    ...snapshot,
    channels: Object.freeze([...snapshot.channels]),
  };
}
