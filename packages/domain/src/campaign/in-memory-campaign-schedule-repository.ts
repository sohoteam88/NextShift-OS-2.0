import type { BusinessId, Timestamp } from "@nextshift/shared";
import type { CampaignId } from ".";
import {
  CampaignSchedule,
  type CampaignScheduleId,
  type CampaignScheduleSnapshot,
} from "./campaign-schedule";
import type { CampaignScheduleRepository } from "./campaign-schedule-repository";

export class InMemoryCampaignScheduleRepository
  implements CampaignScheduleRepository
{
  private readonly schedules = new Map<
    CampaignScheduleId,
    CampaignScheduleSnapshot
  >();

  async save(schedule: CampaignSchedule): Promise<void> {
    const snapshot = schedule.toSnapshot();
    this.schedules.set(snapshot.scheduleId, cloneSnapshot(snapshot));
  }

  async findById(
    scheduleId: CampaignScheduleId
  ): Promise<CampaignSchedule | null> {
    const snapshot = this.schedules.get(scheduleId);
    return snapshot ? CampaignSchedule.rehydrate(snapshot) : null;
  }

  async findByCampaignId(
    campaignId: CampaignId
  ): Promise<readonly CampaignSchedule[]> {
    return [...this.schedules.values()]
      .filter((schedule) => schedule.campaignId === campaignId)
      .sort(compareSchedules)
      .map((schedule) => CampaignSchedule.rehydrate(schedule));
  }

  async findActiveByCampaignId(
    campaignId: CampaignId
  ): Promise<CampaignSchedule | null> {
    const snapshot = [...this.schedules.values()].find(
      (schedule) =>
        schedule.campaignId === campaignId && schedule.status === "scheduled"
    );

    return snapshot ? CampaignSchedule.rehydrate(snapshot) : null;
  }

  async findPendingByBusinessId(
    businessId: BusinessId,
    asOf: Timestamp
  ): Promise<readonly CampaignSchedule[]> {
    return [...this.schedules.values()]
      .filter((schedule) => schedule.businessId === businessId)
      .map((schedule) => CampaignSchedule.rehydrate(schedule))
      .filter((schedule) => schedule.isPending(asOf))
      .sort((left, right) => compareSchedules(left.toSnapshot(), right.toSnapshot()));
  }

  async exists(scheduleId: CampaignScheduleId): Promise<boolean> {
    return this.schedules.has(scheduleId);
  }
}

function compareSchedules(
  left: CampaignScheduleSnapshot,
  right: CampaignScheduleSnapshot
): number {
  return Date.parse(left.scheduledFor) - Date.parse(right.scheduledFor);
}

function cloneSnapshot(
  snapshot: CampaignScheduleSnapshot
): CampaignScheduleSnapshot {
  return { ...snapshot };
}
