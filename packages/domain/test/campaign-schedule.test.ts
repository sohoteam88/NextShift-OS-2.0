import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  assertCampaignCanBeScheduled,
  CampaignSchedule,
  InMemoryCampaignScheduleRepository,
  type CampaignId,
  type CampaignScheduleId,
} from "../src/campaign";

const businessId = "business-1" as BusinessId;
const campaignId = "campaign-1" as CampaignId;
const scheduleId = "schedule-1" as CampaignScheduleId;
const createdAt = "2026-06-28T00:00:00.000Z";
const scheduledFor = "2026-06-29T00:00:00.000Z";

function createSchedule(
  id: CampaignScheduleId = scheduleId
): CampaignSchedule {
  return CampaignSchedule.schedule({
    scheduleId: id,
    campaignId,
    businessId,
    campaignStatus: "draft",
    scheduledFor,
    createdAt,
  });
}

describe("CampaignSchedule aggregate", () => {
  it("creates a scheduled campaign launch", () => {
    const schedule = createSchedule();

    expect(schedule.toSnapshot()).toMatchObject({
      scheduleId,
      campaignId,
      businessId,
      scheduledFor,
      status: "scheduled",
      createdAt,
      updatedAt: createdAt,
    });

    expect(schedule.pullDomainEvents()).toMatchObject([
      {
        eventType: "CampaignLaunchScheduled",
        aggregateType: "CampaignSchedule",
        version: 1,
      },
    ]);
  });

  it("requires scheduled launch time to be strictly in the future", () => {
    expect(() =>
      CampaignSchedule.schedule({
        scheduleId,
        campaignId,
        businessId,
        campaignStatus: "draft",
        scheduledFor: createdAt,
        createdAt,
      })
    ).toThrow("Scheduled launch time must be in the future.");
  });

  it("reschedules an active launch schedule", () => {
    const schedule = createSchedule();
    schedule.pullDomainEvents();

    schedule.reschedule({
      campaignStatus: "draft",
      scheduledFor: "2026-06-30T00:00:00.000Z",
      rescheduledAt: "2026-06-28T02:00:00.000Z",
    });

    expect(schedule.toSnapshot()).toMatchObject({
      scheduledFor: "2026-06-30T00:00:00.000Z",
      rescheduledAt: "2026-06-28T02:00:00.000Z",
      updatedAt: "2026-06-28T02:00:00.000Z",
    });
    expect(schedule.pullDomainEvents()).toMatchObject([
      {
        eventType: "CampaignLaunchRescheduled",
        payload: {
          previousScheduledFor: scheduledFor,
          scheduledFor: "2026-06-30T00:00:00.000Z",
        },
      },
    ]);
  });

  it("cancels an active launch schedule", () => {
    const schedule = createSchedule();
    schedule.pullDomainEvents();

    schedule.cancel("2026-06-28T03:00:00.000Z");

    expect(schedule.toSnapshot()).toMatchObject({
      status: "cancelled",
      cancelledAt: "2026-06-28T03:00:00.000Z",
      updatedAt: "2026-06-28T03:00:00.000Z",
    });
    expect(schedule.pullDomainEvents()).toMatchObject([
      {
        eventType: "CampaignLaunchScheduleCancelled",
        payload: {
          cancelledAt: "2026-06-28T03:00:00.000Z",
        },
      },
    ]);
  });

  it("prevents scheduling invalid campaign states", () => {
    expect(() => assertCampaignCanBeScheduled("archived")).toThrow(
      "Archived campaigns cannot be scheduled."
    );
    expect(() => assertCampaignCanBeScheduled("completed")).toThrow(
      "Completed campaigns cannot be scheduled."
    );
  });
});

describe("InMemoryCampaignScheduleRepository", () => {
  it("saves, retrieves, and lists campaign schedules", async () => {
    const repository = new InMemoryCampaignScheduleRepository();
    const schedule = createSchedule();

    await repository.save(schedule);

    expect(await repository.exists(scheduleId)).toBe(true);
    expect((await repository.findById(scheduleId))?.toSnapshot()).toEqual(
      schedule.toSnapshot()
    );
    expect(await repository.findByCampaignId(campaignId)).toHaveLength(1);
    expect((await repository.findActiveByCampaignId(campaignId))?.scheduleId).toBe(
      scheduleId
    );
    expect(
      await repository.findPendingByBusinessId(
        businessId,
        "2026-06-28T12:00:00.000Z"
      )
    ).toHaveLength(1);
  });

  it("supports duplicate active schedule prevention", async () => {
    const repository = new InMemoryCampaignScheduleRepository();

    await repository.save(createSchedule());

    expect(await repository.findActiveByCampaignId(campaignId)).not.toBeNull();

    const existing = await repository.findActiveByCampaignId(campaignId);
    existing?.cancel("2026-06-28T01:00:00.000Z");

    if (existing) {
      await repository.save(existing);
    }

    expect(await repository.findActiveByCampaignId(campaignId)).toBeNull();
  });
});
