import {
  ContentAsset,
  InMemoryContentCalendarRepository,
  InMemoryContentRepository,
  type ContentCalendarDomainEvent,
  type ContentCalendarId,
  type ContentId,
} from "@nextshift/domain";
import type {
  BusinessId,
  CorrelationId,
  EventId,
  TenantId,
} from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  ContentCalendarApplicationService,
  type ContentCalendarEventPublisher,
} from "../src/content-calendar";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const correlationId = "correlation-1" as CorrelationId;
const calendarId = "calendar-1" as ContentCalendarId;
const contentId = "content-1" as ContentId;
const eventId = "event-1" as EventId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingContentCalendarEventPublisher
  implements ContentCalendarEventPublisher
{
  readonly events: ContentCalendarDomainEvent[] = [];

  async publish(event: ContentCalendarDomainEvent): Promise<void> {
    this.events.push(event);
  }
}

function createService() {
  const calendarRepository = new InMemoryContentCalendarRepository();
  const contentRepository = new InMemoryContentRepository();
  const publisher = new RecordingContentCalendarEventPublisher();
  const timestamps = [
    "2026-06-27T00:00:00.000Z",
    "2026-06-27T01:00:00.000Z",
    "2026-06-27T02:00:00.000Z",
    "2026-06-27T03:00:00.000Z",
    "2026-06-27T04:00:00.000Z",
    "2026-06-27T05:00:00.000Z",
  ];
  const service = new ContentCalendarApplicationService(
    calendarRepository,
    contentRepository,
    publisher,
    () => timestamps.shift() ?? "2026-06-27T06:00:00.000Z",
    () => eventId,
    () => calendarId
  );

  return {
    calendarRepository,
    contentRepository,
    publisher,
    service,
  };
}

async function seedContent(
  repository: InMemoryContentRepository,
  ownerBusinessId: BusinessId = businessId
) {
  await repository.save(
    ContentAsset.create({
      contentId,
      businessId: ownerBusinessId,
      type: "social_post",
      category: "education",
      title: "How to choose your first CRM",
      createdAt: "2026-06-27T00:00:00.000Z",
    })
  );
}

async function createCalendar(service: ContentCalendarApplicationService) {
  return service.createContentCalendar({
    commandType: "CreateContentCalendar",
    context,
    calendarId,
    name: "Growth content calendar",
  });
}

describe("ContentCalendarApplicationService", () => {
  it("creates and persists a content calendar", async () => {
    const { calendarRepository, publisher, service } = createService();

    const result = await createCalendar(service);

    expect(result.ok).toBe(true);
    expect(await calendarRepository.exists(calendarId)).toBe(true);
    expect(publisher.events[0]).toMatchObject({
      eventType: "ContentCalendarCreated",
      aggregateId: calendarId,
      aggregateType: "ContentCalendar",
      eventId,
      correlationId,
      version: 1,
      payload: {
        calendarId,
        businessId,
        name: "Growth content calendar",
      },
    });
  });

  it("schedules existing content and publishes a schedule event", async () => {
    const { contentRepository, publisher, service } = createService();

    await seedContent(contentRepository);
    await createCalendar(service);

    const result = await service.scheduleContent({
      commandType: "ScheduleContent",
      context,
      calendarId,
      contentId,
      platform: "instagram",
      scheduledFor: "2026-06-28T09:00:00.000Z",
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.calendar.listEntries()).toHaveLength(1);
    }

    expect(publisher.events.at(-1)).toMatchObject({
      eventType: "ContentScheduled",
      payload: {
        contentId,
        platform: "instagram",
        scheduledFor: "2026-06-28T09:00:00.000Z",
        status: "scheduled",
      },
    });
  });

  it("rejects scheduling missing or foreign business content", async () => {
    const { contentRepository, service } = createService();

    await createCalendar(service);

    const missing = await service.scheduleContent({
      commandType: "ScheduleContent",
      context,
      calendarId,
      contentId,
      platform: "facebook",
      scheduledFor: "2026-06-28T09:00:00.000Z",
    });

    expect(missing.ok).toBe(false);

    if (!missing.ok) {
      expect(missing.error.code).toBe("ContentAssetNotFound");
    }

    await seedContent(contentRepository, otherBusinessId);

    const foreign = await service.scheduleContent({
      commandType: "ScheduleContent",
      context,
      calendarId,
      contentId,
      platform: "facebook",
      scheduledFor: "2026-06-28T09:00:00.000Z",
    });

    expect(foreign.ok).toBe(false);

    if (!foreign.ok) {
      expect(foreign.error.code).toBe("ValidationFailed");
    }
  });

  it("reschedules, publishes, and cancels scheduled content", async () => {
    const { contentRepository, publisher, service } = createService();

    await seedContent(contentRepository);
    await createCalendar(service);
    await service.scheduleContent({
      commandType: "ScheduleContent",
      context,
      calendarId,
      contentId,
      platform: "tiktok",
      scheduledFor: "2026-06-28T09:00:00.000Z",
    });
    await service.rescheduleContent({
      commandType: "RescheduleContent",
      context,
      calendarId,
      contentId,
      platform: "tiktok",
      scheduledFor: "2026-06-28T10:00:00.000Z",
    });
    const published = await service.markScheduledContentPublished({
      commandType: "MarkScheduledContentPublished",
      context,
      calendarId,
      contentId,
      platform: "tiktok",
    });

    expect(published.ok).toBe(true);

    if (published.ok) {
      expect(published.value.calendar.listEntries()[0]).toMatchObject({
        status: "published",
        scheduledFor: "2026-06-28T10:00:00.000Z",
      });
    }

    const secondContentId = "content-2" as ContentId;
    await contentRepository.save(
      ContentAsset.create({
        contentId: secondContentId,
        businessId,
        type: "social_post",
        title: "Follow up with segmented leads",
        createdAt: "2026-06-27T00:00:00.000Z",
      })
    );
    await service.scheduleContent({
      commandType: "ScheduleContent",
      context,
      calendarId,
      contentId: secondContentId,
      platform: "facebook",
      scheduledFor: "2026-06-29T09:00:00.000Z",
    });
    const cancelled = await service.cancelScheduledContent({
      commandType: "CancelScheduledContent",
      context,
      calendarId,
      contentId: secondContentId,
      platform: "facebook",
    });

    expect(cancelled.ok).toBe(true);
    expect(publisher.events.map((event) => event.eventType)).toEqual([
      "ContentCalendarCreated",
      "ContentScheduled",
      "ContentRescheduled",
      "ScheduledContentPublished",
      "ContentScheduled",
      "ScheduledContentCancelled",
    ]);
  });

  it("archives and restores content calendars", async () => {
    const { publisher, service } = createService();

    await createCalendar(service);
    await service.archiveContentCalendar({
      commandType: "ArchiveContentCalendar",
      context,
      calendarId,
    });
    const result = await service.restoreContentCalendar({
      commandType: "RestoreContentCalendar",
      context,
      calendarId,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.calendar.toSnapshot()).toMatchObject({
        status: "active",
        archivedAt: undefined,
      });
    }

    expect(publisher.events.map((event) => event.eventType)).toEqual([
      "ContentCalendarCreated",
      "ContentCalendarArchived",
      "ContentCalendarRestored",
    ]);
  });
});
