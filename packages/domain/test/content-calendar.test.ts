import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  ContentCalendar,
  InMemoryContentCalendarRepository,
  type ContentCalendarId,
  type ContentId,
} from "../src/content";

const businessId = "business-1" as BusinessId;
const calendarId = "calendar-1" as ContentCalendarId;
const contentId = "content-1" as ContentId;
const createdAt = "2026-06-27T00:00:00.000Z";

function createCalendar(): ContentCalendar {
  return ContentCalendar.create({
    calendarId,
    businessId,
    name: "Growth content calendar",
    createdAt,
  });
}

describe("ContentCalendar aggregate", () => {
  it("creates an active content calendar", () => {
    const calendar = createCalendar();

    expect(calendar.toSnapshot()).toMatchObject({
      calendarId,
      businessId,
      name: "Growth content calendar",
      status: "active",
      entries: [],
      createdAt,
      updatedAt: createdAt,
    });
  });

  it("schedules content for a platform", () => {
    const calendar = createCalendar();

    calendar.scheduleContent({
      contentId,
      platform: "instagram",
      scheduledFor: "2026-06-28T09:00:00.000Z",
      scheduledAt: "2026-06-27T01:00:00.000Z",
    });

    expect(calendar.listEntries()).toEqual([
      {
        contentId,
        platform: "instagram",
        scheduledFor: "2026-06-28T09:00:00.000Z",
        scheduledAt: "2026-06-27T01:00:00.000Z",
        status: "scheduled",
      },
    ]);
  });

  it("prevents duplicate active schedules for the same content and platform", () => {
    const calendar = createCalendar();

    calendar.scheduleContent({
      contentId,
      platform: "facebook",
      scheduledFor: "2026-06-28T09:00:00.000Z",
      scheduledAt: "2026-06-27T01:00:00.000Z",
    });

    expect(() =>
      calendar.scheduleContent({
        contentId,
        platform: "facebook",
        scheduledFor: "2026-06-29T09:00:00.000Z",
        scheduledAt: "2026-06-27T02:00:00.000Z",
      })
    ).toThrow("Content is already scheduled for this platform.");
  });

  it("reschedules, publishes, and cancels scheduled content", () => {
    const calendar = createCalendar();

    calendar.scheduleContent({
      contentId,
      platform: "tiktok",
      scheduledFor: "2026-06-28T09:00:00.000Z",
      scheduledAt: "2026-06-27T01:00:00.000Z",
    });
    calendar.rescheduleContent(
      contentId,
      "tiktok",
      "2026-06-28T10:00:00.000Z",
      "2026-06-27T02:00:00.000Z"
    );
    calendar.markPublished(
      contentId,
      "tiktok",
      "2026-06-28T10:05:00.000Z"
    );

    expect(calendar.listEntries()[0]).toMatchObject({
      status: "published",
      scheduledFor: "2026-06-28T10:00:00.000Z",
      publishedAt: "2026-06-28T10:05:00.000Z",
    });

    const secondContentId = "content-2" as ContentId;
    calendar.scheduleContent({
      contentId: secondContentId,
      platform: "xiaohongshu",
      scheduledFor: "2026-06-29T09:00:00.000Z",
      scheduledAt: "2026-06-27T03:00:00.000Z",
    });
    calendar.cancelScheduledContent(
      secondContentId,
      "xiaohongshu",
      "2026-06-27T04:00:00.000Z"
    );

    expect(calendar.listEntries()[1]).toMatchObject({
      status: "cancelled",
      cancelledAt: "2026-06-27T04:00:00.000Z",
    });
  });

  it("prevents modifying archived calendars", () => {
    const calendar = createCalendar();

    calendar.archive("2026-06-27T02:00:00.000Z");

    expect(() =>
      calendar.scheduleContent({
        contentId,
        platform: "instagram",
        scheduledFor: "2026-06-28T09:00:00.000Z",
        scheduledAt: "2026-06-27T03:00:00.000Z",
      })
    ).toThrow("Archived content calendars cannot be modified.");
  });
});

describe("InMemoryContentCalendarRepository", () => {
  it("saves and retrieves calendars by ID", async () => {
    const repository = new InMemoryContentCalendarRepository();
    const calendar = createCalendar();

    await repository.save(calendar);

    expect((await repository.findById(calendarId))?.toSnapshot()).toEqual(
      calendar.toSnapshot()
    );
  });

  it("lists calendars and entries", async () => {
    const repository = new InMemoryContentCalendarRepository();
    const calendar = createCalendar();

    calendar.scheduleContent({
      contentId,
      platform: "instagram",
      scheduledFor: "2026-06-28T09:00:00.000Z",
      scheduledAt: "2026-06-27T01:00:00.000Z",
    });

    await repository.save(calendar);

    expect(await repository.findByBusinessId(businessId)).toHaveLength(1);
    expect(await repository.listEntries(calendarId)).toHaveLength(1);
    expect(await repository.exists(calendarId)).toBe(true);
  });
});
