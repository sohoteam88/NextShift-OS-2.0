import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  ContentPlan,
  InMemoryContentPlanRepository,
  type ContentCalendarId,
  type ContentId,
  type ContentPlanId,
} from "../src/content";

const businessId = "business-1" as BusinessId;
const calendarId = "calendar-1" as ContentCalendarId;
const planId = "plan-1" as ContentPlanId;
const contentId = "content-1" as ContentId;
const createdAt = "2026-06-27T00:00:00.000Z";

function createPlan(): ContentPlan {
  return ContentPlan.create({
    planId,
    businessId,
    calendarId,
    name: "90 day growth content plan",
    createdAt,
  });
}

describe("ContentPlan aggregate", () => {
  it("creates an active content plan linked to a calendar", () => {
    const plan = createPlan();

    expect(plan.toSnapshot()).toMatchObject({
      planId,
      businessId,
      calendarId,
      name: "90 day growth content plan",
      status: "active",
      entries: [],
      createdAt,
      updatedAt: createdAt,
    });
  });

  it("adds planned content with normalized platforms", () => {
    const plan = createPlan();

    plan.addPlannedContent({
      contentId,
      platforms: ["instagram", "Instagram", "tiktok"],
      plannedFor: "2026-06-28T09:00:00.000Z",
      addedAt: "2026-06-27T01:00:00.000Z",
    });

    expect(plan.listEntries()).toEqual([
      {
        contentId,
        platforms: ["instagram", "tiktok"],
        plannedFor: "2026-06-28T09:00:00.000Z",
        status: "planned",
        addedAt: "2026-06-27T01:00:00.000Z",
      },
    ]);
  });

  it("prevents duplicate active planned content", () => {
    const plan = createPlan();

    plan.addPlannedContent({
      contentId,
      platforms: ["facebook"],
      plannedFor: "2026-06-28T09:00:00.000Z",
      addedAt: "2026-06-27T01:00:00.000Z",
    });

    expect(() =>
      plan.addPlannedContent({
        contentId,
        platforms: ["tiktok"],
        plannedFor: "2026-06-29T09:00:00.000Z",
        addedAt: "2026-06-27T02:00:00.000Z",
      })
    ).toThrow("Content is already part of this content plan.");
  });

  it("marks planned content as scheduled and removed", () => {
    const plan = createPlan();

    plan.addPlannedContent({
      contentId,
      platforms: ["xiaohongshu"],
      plannedFor: "2026-06-28T09:00:00.000Z",
      addedAt: "2026-06-27T01:00:00.000Z",
    });
    plan.markContentScheduled(contentId, "2026-06-27T02:00:00.000Z");

    expect(plan.getEntry(contentId)).toMatchObject({
      status: "scheduled",
      scheduledAt: "2026-06-27T02:00:00.000Z",
    });

    const secondContentId = "content-2" as ContentId;
    plan.addPlannedContent({
      contentId: secondContentId,
      platforms: ["facebook"],
      plannedFor: "2026-06-29T09:00:00.000Z",
      addedAt: "2026-06-27T03:00:00.000Z",
    });
    plan.removePlannedContent(secondContentId, "2026-06-27T04:00:00.000Z");

    expect(plan.getEntry(secondContentId)).toMatchObject({
      status: "removed",
      removedAt: "2026-06-27T04:00:00.000Z",
    });
  });

  it("prevents modifying archived content plans", () => {
    const plan = createPlan();

    plan.archive("2026-06-27T02:00:00.000Z");

    expect(() =>
      plan.addPlannedContent({
        contentId,
        platforms: ["instagram"],
        plannedFor: "2026-06-28T09:00:00.000Z",
        addedAt: "2026-06-27T03:00:00.000Z",
      })
    ).toThrow("Archived content plans cannot be modified.");
  });
});

describe("InMemoryContentPlanRepository", () => {
  it("saves and retrieves plans by ID", async () => {
    const repository = new InMemoryContentPlanRepository();
    const plan = createPlan();

    await repository.save(plan);

    expect((await repository.findById(planId))?.toSnapshot()).toEqual(
      plan.toSnapshot()
    );
  });

  it("lists plans and entries", async () => {
    const repository = new InMemoryContentPlanRepository();
    const plan = createPlan();

    plan.addPlannedContent({
      contentId,
      platforms: ["instagram"],
      plannedFor: "2026-06-28T09:00:00.000Z",
      addedAt: "2026-06-27T01:00:00.000Z",
    });
    await repository.save(plan);

    expect(await repository.findByBusinessId(businessId)).toHaveLength(1);
    expect(await repository.findByCalendarId(calendarId)).toHaveLength(1);
    expect(await repository.listEntries(planId)).toHaveLength(1);
    expect(await repository.exists(planId)).toBe(true);
  });
});
