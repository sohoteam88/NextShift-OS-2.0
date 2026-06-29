import {
  Campaign,
  InMemoryCampaignRepository,
  InMemoryCampaignScheduleRepository,
  type CampaignId,
  type CampaignScheduleId,
} from "@nextshift/domain";
import type { BusinessId, TenantId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import { CampaignSchedulingApplicationService } from "../src/campaign";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const campaignId = "campaign-1" as CampaignId;
const otherCampaignId = "campaign-2" as CampaignId;
const scheduleId = "schedule-1" as CampaignScheduleId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
};

const otherContext = {
  businessId: otherBusinessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
};

function createService() {
  const campaignRepository = new InMemoryCampaignRepository();
  const scheduleRepository = new InMemoryCampaignScheduleRepository();
  const timestamps = [
    "2026-06-28T00:00:00.000Z",
    "2026-06-28T01:00:00.000Z",
    "2026-06-28T02:00:00.000Z",
    "2026-06-28T03:00:00.000Z",
    "2026-06-28T04:00:00.000Z",
  ];
  const service = new CampaignSchedulingApplicationService(
    campaignRepository,
    scheduleRepository,
    () => timestamps.shift() ?? "2026-06-28T05:00:00.000Z",
    () => scheduleId
  );

  return { campaignRepository, scheduleRepository, service };
}

function createCampaign(id: CampaignId = campaignId): Campaign {
  return Campaign.create({
    campaignId: id,
    businessId,
    name: "90 Day Launch Campaign",
    objective: "Generate qualified leads for the new offer.",
    channels: ["instagram", "email", "whatsapp"],
    createdAt: "2026-06-27T00:00:00.000Z",
  });
}

async function saveCampaign(
  repository: InMemoryCampaignRepository,
  campaign: Campaign = createCampaign()
): Promise<void> {
  await repository.save(campaign);
}

describe("CampaignSchedulingApplicationService", () => {
  it("schedules and persists a campaign launch", async () => {
    const { campaignRepository, scheduleRepository, service } = createService();
    await saveCampaign(campaignRepository);

    const result = await service.scheduleCampaignLaunch({
      commandType: "ScheduleCampaignLaunch",
      context,
      campaignId,
      scheduledFor: "2026-06-29T00:00:00.000Z",
    });

    expect(result.ok).toBe(true);
    expect(await scheduleRepository.exists(scheduleId)).toBe(true);

    if (result.ok) {
      expect(result.value.schedule.toSnapshot()).toMatchObject({
        scheduleId,
        campaignId,
        businessId,
        scheduledFor: "2026-06-29T00:00:00.000Z",
        status: "scheduled",
      });
    }
  });

  it("reschedules an existing campaign launch", async () => {
    const { campaignRepository, service } = createService();
    await saveCampaign(campaignRepository);
    await service.scheduleCampaignLaunch({
      commandType: "ScheduleCampaignLaunch",
      context,
      campaignId,
      scheduledFor: "2026-06-29T00:00:00.000Z",
    });

    const result = await service.rescheduleCampaignLaunch({
      commandType: "RescheduleCampaignLaunch",
      context,
      campaignId,
      scheduledFor: "2026-06-30T00:00:00.000Z",
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.schedule.toSnapshot()).toMatchObject({
        scheduledFor: "2026-06-30T00:00:00.000Z",
        rescheduledAt: "2026-06-28T01:00:00.000Z",
      });
    }
  });

  it("cancels an existing campaign launch schedule", async () => {
    const { campaignRepository, service } = createService();
    await saveCampaign(campaignRepository);
    await service.scheduleCampaignLaunch({
      commandType: "ScheduleCampaignLaunch",
      context,
      campaignId,
      scheduledFor: "2026-06-29T00:00:00.000Z",
    });

    const result = await service.cancelCampaignLaunchSchedule({
      commandType: "CancelCampaignLaunchSchedule",
      context,
      campaignId,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.schedule.toSnapshot()).toMatchObject({
        status: "cancelled",
        cancelledAt: "2026-06-28T01:00:00.000Z",
      });
    }
  });

  it("queries active and pending campaign schedules", async () => {
    const { campaignRepository, service } = createService();
    await saveCampaign(campaignRepository);
    await saveCampaign(campaignRepository, createCampaign(otherCampaignId));
    await service.scheduleCampaignLaunch({
      commandType: "ScheduleCampaignLaunch",
      context,
      campaignId,
      scheduledFor: "2026-06-29T00:00:00.000Z",
    });
    await service.scheduleCampaignLaunch({
      commandType: "ScheduleCampaignLaunch",
      context,
      campaignId: otherCampaignId,
      scheduleId: "schedule-2" as CampaignScheduleId,
      scheduledFor: "2026-06-30T00:00:00.000Z",
    });

    const active = await service.getCampaignSchedule({
      queryType: "GetCampaignSchedule",
      context,
      campaignId,
    });
    const pending = await service.listPendingCampaignSchedules({
      queryType: "ListPendingCampaignSchedules",
      context,
    });

    expect(active.schedule?.scheduleId).toBe(scheduleId);
    expect(pending.schedules).toHaveLength(2);
    expect(pending.schedules.map((schedule) => schedule.scheduledFor)).toEqual([
      "2026-06-29T00:00:00.000Z",
      "2026-06-30T00:00:00.000Z",
    ]);
  });

  it("returns not found for missing campaigns", async () => {
    const { service } = createService();

    const result = await service.scheduleCampaignLaunch({
      commandType: "ScheduleCampaignLaunch",
      context,
      campaignId,
      scheduledFor: "2026-06-29T00:00:00.000Z",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatchObject({ code: "CampaignNotFound" });
    }
  });

  it("returns not found when rescheduling or cancelling an absent schedule", async () => {
    const { campaignRepository, service } = createService();
    await saveCampaign(campaignRepository);

    const reschedule = await service.rescheduleCampaignLaunch({
      commandType: "RescheduleCampaignLaunch",
      context,
      campaignId,
      scheduledFor: "2026-06-29T00:00:00.000Z",
    });
    const cancel = await service.cancelCampaignLaunchSchedule({
      commandType: "CancelCampaignLaunchSchedule",
      context,
      campaignId,
    });

    expect(reschedule.ok).toBe(false);
    expect(cancel.ok).toBe(false);

    if (!reschedule.ok) {
      expect(reschedule.error).toMatchObject({
        code: "CampaignScheduleNotFound",
      });
    }

    if (!cancel.ok) {
      expect(cancel.error).toMatchObject({
        code: "CampaignScheduleNotFound",
      });
    }
  });

  it("returns validation failures for duplicate or past schedules", async () => {
    const { campaignRepository, service } = createService();
    await saveCampaign(campaignRepository);
    await service.scheduleCampaignLaunch({
      commandType: "ScheduleCampaignLaunch",
      context,
      campaignId,
      scheduledFor: "2026-06-29T00:00:00.000Z",
    });

    const duplicate = await service.scheduleCampaignLaunch({
      commandType: "ScheduleCampaignLaunch",
      context,
      campaignId,
      scheduledFor: "2026-06-30T00:00:00.000Z",
    });
    const past = await service.rescheduleCampaignLaunch({
      commandType: "RescheduleCampaignLaunch",
      context,
      campaignId,
      scheduledFor: "2026-06-28T01:00:00.000Z",
    });

    expect(duplicate.ok).toBe(false);
    expect(past.ok).toBe(false);

    if (!duplicate.ok) {
      expect(duplicate.error).toMatchObject({
        code: "ValidationFailed",
        message: "Campaign already has an active launch schedule.",
      });
    }

    if (!past.ok) {
      expect(past.error).toMatchObject({
        code: "ValidationFailed",
        message: "Scheduled launch time must be in the future.",
      });
    }
  });

  it("prevents scheduling archived and completed campaigns", async () => {
    const { campaignRepository, service } = createService();
    const archived = createCampaign();
    archived.archive("2026-06-27T01:00:00.000Z");
    const completed = createCampaign(otherCampaignId);
    completed.launch("2026-06-27T01:00:00.000Z");
    completed.complete("2026-06-27T02:00:00.000Z");

    await saveCampaign(campaignRepository, archived);
    await saveCampaign(campaignRepository, completed);

    const archivedResult = await service.scheduleCampaignLaunch({
      commandType: "ScheduleCampaignLaunch",
      context,
      campaignId,
      scheduledFor: "2026-06-29T00:00:00.000Z",
    });
    const completedResult = await service.scheduleCampaignLaunch({
      commandType: "ScheduleCampaignLaunch",
      context,
      campaignId: otherCampaignId,
      scheduleId: "schedule-2" as CampaignScheduleId,
      scheduledFor: "2026-06-29T00:00:00.000Z",
    });

    expect(archivedResult.ok).toBe(false);
    expect(completedResult.ok).toBe(false);

    if (!archivedResult.ok) {
      expect(archivedResult.error.message).toBe(
        "Archived campaigns cannot be scheduled."
      );
    }

    if (!completedResult.ok) {
      expect(completedResult.error.message).toBe(
        "Completed campaigns cannot be scheduled."
      );
    }
  });

  it("hides schedules outside the query context", async () => {
    const { campaignRepository, service } = createService();
    await saveCampaign(campaignRepository);
    await service.scheduleCampaignLaunch({
      commandType: "ScheduleCampaignLaunch",
      context,
      campaignId,
      scheduledFor: "2026-06-29T00:00:00.000Z",
    });

    const result = await service.getCampaignSchedule({
      queryType: "GetCampaignSchedule",
      context: otherContext,
      campaignId,
    });

    expect(result.schedule).toBeNull();
  });
});
