import type { BusinessId, Timestamp } from "@nextshift/shared";
import type { CampaignId } from ".";
import type { CampaignSchedule, CampaignScheduleId } from "./campaign-schedule";

export interface CampaignScheduleRepository {
  save(schedule: CampaignSchedule): Promise<void>;
  findById(scheduleId: CampaignScheduleId): Promise<CampaignSchedule | null>;
  findByCampaignId(
    campaignId: CampaignId
  ): Promise<readonly CampaignSchedule[]>;
  findActiveByCampaignId(
    campaignId: CampaignId
  ): Promise<CampaignSchedule | null>;
  findPendingByBusinessId(
    businessId: BusinessId,
    asOf: Timestamp
  ): Promise<readonly CampaignSchedule[]>;
  exists(scheduleId: CampaignScheduleId): Promise<boolean>;
}
