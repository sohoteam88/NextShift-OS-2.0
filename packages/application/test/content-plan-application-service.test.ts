import {
  ContentAsset,
  ContentCalendar,
  InMemoryContentCalendarRepository,
  InMemoryContentPlanRepository,
  InMemoryContentRepository,
  type ContentCalendarId,
  type ContentId,
  type ContentPlanDomainEvent,
  type ContentPlanId,
} from "@nextshift/domain";
import type {
  BusinessId,
  CorrelationId,
  EventId,
  TenantId,
} from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  ContentPlanApplicationService,
  type ContentPlanEventPublisher,
} from "../src/content-plan";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const correlationId = "correlation-1" as CorrelationId;
const calendarId = "calendar-1" as ContentCalendarId;
const planId = "plan-1" as ContentPlanId;
const contentId = "content-1" as ContentId;
const eventId = "event-1" as EventId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingContentPlanEventPublisher implements ContentPlanEventPublisher {
  readonly events: ContentPlanDomainEvent[] = [];

  async publish(event: ContentPlanDomainEvent): Promise<void> {
    this.events.push(event);
  }
}

function createService() {
  const planRepository = new InMemoryContentPlanRepository();
  const contentRepository = new InMemoryContentRepository();
  const calendarRepository = new InMemoryContentCalendarRepository();
  const publisher = new RecordingContentPlanEventPublisher();
  const timestamps = [
    "2026-06-27T00:00:00.000Z",
    "2026-06-27T01:00:00.000Z",
    "2026-06-27T02:00:00.000Z",
    "2026-06-27T03:00:00.000Z",
    "2026-06-27T04:00:00.000Z",
    "2026-06-27T05:00:00.000Z",
  ];
  const service = new ContentPlanApplicationService(
    planRepository,
    contentRepository,
    calendarRepository,
    publisher,
    () => timestamps.shift() ?? "2026-06-27T06:00:00.000Z",
    () => eventId,
    () => planId
  );

  return {
    calendarRepository,
    contentRepository,
    planRepository,
    publisher,
    service,
  };
}

async function seedCalendar(
  repository: InMemoryContentCalendarRepository,
  ownerBusinessId: BusinessId = businessId
) {
  await repository.save(
    ContentCalendar.create({
      calendarId,
      businessId: ownerBusinessId,
      name: "Growth content calendar",
      createdAt: "2026-06-27T00:00:00.000Z",
    })
  );
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

async function createPlan(service: ContentPlanApplicationService) {
  return service.createContentPlan({
    commandType: "CreateContentPlan",
    context,
    calendarId,
    planId,
    name: "90 day growth content plan",
  });
}

describe("ContentPlanApplicationService", () => {
  it("creates a content plan linked to an existing calendar", async () => {
    const { calendarRepository, planRepository, publisher, service } =
      createService();

    await seedCalendar(calendarRepository);

    const result = await createPlan(service);

    expect(result.ok).toBe(true);
    expect(await planRepository.exists(planId)).toBe(true);
    expect(publisher.events[0]).toMatchObject({
      eventType: "ContentPlanCreated",
      aggregateId: planId,
      aggregateType: "ContentPlan",
      eventId,
      correlationId,
      version: 1,
      payload: {
        planId,
        businessId,
        calendarId,
        name: "90 day growth content plan",
      },
    });
  });

  it("adds existing content to a plan and publishes an event", async () => {
    const { calendarRepository, contentRepository, publisher, service } =
      createService();

    await seedCalendar(calendarRepository);
    await seedContent(contentRepository);
    await createPlan(service);

    const result = await service.addContentToPlan({
      commandType: "AddContentToPlan",
      context,
      planId,
      contentId,
      platforms: ["instagram", "tiktok"],
      plannedFor: "2026-06-28T09:00:00.000Z",
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.plan.listEntries()).toHaveLength(1);
    }

    expect(publisher.events.at(-1)).toMatchObject({
      eventType: "PlannedContentAdded",
      payload: {
        contentId,
        platforms: ["instagram", "tiktok"],
        plannedFor: "2026-06-28T09:00:00.000Z",
        status: "planned",
      },
    });
  });

  it("creates, submits, and approves content approval plans", async () => {
    const { publisher, service } = createService();

    const created = await service.createApprovalContentPlan({
      commandType: "CreateApprovalContentPlan",
      context,
      planId,
      title: "Launch approval content",
      objective: "Prepare launch messaging",
      audience: "Retail operators",
      channel: "email",
      priority: "high",
      recommendedPublishDate: "2026-06-30T09:00:00.000Z",
    });

    expect(created.ok).toBe(true);

    const submitted = await service.submitForReview({
      commandType: "SubmitContentPlanForReview",
      context,
      planId,
    });

    expect(submitted.ok).toBe(true);

    const pending = await service.getPendingApprovals({
      queryType: "GetPendingApprovals",
      context,
    });
    expect(pending.plans).toHaveLength(1);

    const approved = await service.approveContent({
      commandType: "ApproveContent",
      context,
      planId,
      reviewer: "Marketing Lead",
      reason: "Ready to publish",
    });

    expect(approved.ok).toBe(true);

    if (approved.ok) {
      expect(approved.value.plan.toSnapshot()).toMatchObject({
        status: "approved",
        approvalHistory: [
          {
            reviewer: "Marketing Lead",
            decision: "approved",
            reason: "Ready to publish",
          },
        ],
      });
    }

    const approvedContent = await service.getApprovedContent({
      queryType: "GetApprovedContent",
      context,
    });
    expect(approvedContent.plans).toHaveLength(1);
    expect(publisher.events.map((event) => event.eventType)).toEqual([
      "ContentPlanCreated",
      "ContentSubmittedForReview",
      "ContentApproved",
    ]);
  });

  it("rejects and requests revisions for pending content approvals", async () => {
    const { publisher, service } = createService();

    await service.createApprovalContentPlan({
      commandType: "CreateApprovalContentPlan",
      context,
      planId,
      title: "Launch approval content",
      objective: "Prepare launch messaging",
      audience: "Retail operators",
      channel: "email",
      priority: "medium",
      recommendedPublishDate: "2026-06-30T09:00:00.000Z",
    });
    await service.submitForReview({
      commandType: "SubmitContentPlanForReview",
      context,
      planId,
    });

    const revision = await service.requestRevision({
      commandType: "RequestContentRevision",
      context,
      planId,
      reviewer: "Marketing Lead",
      reason: "Add proof points",
    });

    expect(revision.ok).toBe(true);

    if (revision.ok) {
      expect(revision.value.plan.toSnapshot().status).toBe("needs_revision");
    }

    await service.submitForReview({
      commandType: "SubmitContentPlanForReview",
      context,
      planId,
    });

    const rejected = await service.rejectContent({
      commandType: "RejectContent",
      context,
      planId,
      reviewer: "Marketing Lead",
      reason: "Campaign no longer active",
    });

    expect(rejected.ok).toBe(true);

    if (rejected.ok) {
      expect(rejected.value.plan.toSnapshot()).toMatchObject({
        status: "rejected",
        approvalHistory: [
          { decision: "needs_revision" },
          { decision: "rejected", reason: "Campaign no longer active" },
        ],
      });
    }

    expect(publisher.events.map((event) => event.eventType)).toEqual([
      "ContentPlanCreated",
      "ContentSubmittedForReview",
      "ContentRevisionRequested",
      "ContentSubmittedForReview",
      "ContentRejected",
    ]);
  });

  it("schedules planned content onto the linked calendar", async () => {
    const { calendarRepository, contentRepository, publisher, service } =
      createService();

    await seedCalendar(calendarRepository);
    await seedContent(contentRepository);
    await createPlan(service);
    await service.addContentToPlan({
      commandType: "AddContentToPlan",
      context,
      planId,
      contentId,
      platforms: ["facebook", "instagram"],
      plannedFor: "2026-06-28T09:00:00.000Z",
    });

    const result = await service.schedulePlannedContent({
      commandType: "SchedulePlannedContent",
      context,
      planId,
      contentId,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.plan.getEntry(contentId)).toMatchObject({
        status: "scheduled",
      });
    }

    const calendar = await calendarRepository.findById(calendarId);
    expect(calendar?.listEntries()).toHaveLength(2);
    expect(publisher.events.at(-1)).toMatchObject({
      eventType: "PlannedContentScheduled",
      payload: {
        contentId,
        calendarId,
        platforms: ["facebook", "instagram"],
        plannedFor: "2026-06-28T09:00:00.000Z",
      },
    });
  });

  it("rejects missing or foreign dependencies", async () => {
    const { calendarRepository, contentRepository, service } = createService();

    const missingCalendar = await createPlan(service);
    expect(missingCalendar.ok).toBe(false);

    if (!missingCalendar.ok) {
      expect(missingCalendar.error.code).toBe("ContentCalendarNotFound");
    }

    await seedCalendar(calendarRepository);
    await createPlan(service);

    const missingContent = await service.addContentToPlan({
      commandType: "AddContentToPlan",
      context,
      planId,
      contentId,
      platforms: ["facebook"],
      plannedFor: "2026-06-28T09:00:00.000Z",
    });

    expect(missingContent.ok).toBe(false);

    if (!missingContent.ok) {
      expect(missingContent.error.code).toBe("ContentAssetNotFound");
    }

    await seedContent(contentRepository, otherBusinessId);

    const foreignContent = await service.addContentToPlan({
      commandType: "AddContentToPlan",
      context,
      planId,
      contentId,
      platforms: ["facebook"],
      plannedFor: "2026-06-28T09:00:00.000Z",
    });

    expect(foreignContent.ok).toBe(false);

    if (!foreignContent.ok) {
      expect(foreignContent.error.code).toBe("ValidationFailed");
    }
  });

  it("removes, archives, and restores plans", async () => {
    const { calendarRepository, contentRepository, publisher, service } =
      createService();

    await seedCalendar(calendarRepository);
    await seedContent(contentRepository);
    await createPlan(service);
    await service.addContentToPlan({
      commandType: "AddContentToPlan",
      context,
      planId,
      contentId,
      platforms: ["xiaohongshu"],
      plannedFor: "2026-06-28T09:00:00.000Z",
    });
    await service.removeContentFromPlan({
      commandType: "RemoveContentFromPlan",
      context,
      planId,
      contentId,
    });
    await service.archiveContentPlan({
      commandType: "ArchiveContentPlan",
      context,
      planId,
    });
    const result = await service.restoreContentPlan({
      commandType: "RestoreContentPlan",
      context,
      planId,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.plan.toSnapshot()).toMatchObject({
        status: "active",
        archivedAt: undefined,
      });
    }

    expect(publisher.events.map((event) => event.eventType)).toEqual([
      "ContentPlanCreated",
      "PlannedContentAdded",
      "PlannedContentRemoved",
      "ContentPlanArchived",
      "ContentPlanRestored",
    ]);
  });
});
