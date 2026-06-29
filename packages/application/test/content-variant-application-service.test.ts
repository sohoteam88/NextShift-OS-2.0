import {
  ContentAsset,
  ContentCalendar,
  ContentPlan,
  InMemoryContentCalendarRepository,
  InMemoryContentPlanRepository,
  InMemoryContentRepository,
  InMemoryContentVariantRepository,
  type ContentCalendarId,
  type ContentId,
  type ContentPlanId,
  type ContentVariantDomainEvent,
  type ContentVariantSetId,
} from "@nextshift/domain";
import type {
  BusinessId,
  CorrelationId,
  EventId,
  TenantId,
} from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  ContentVariantApplicationService,
  type ContentVariantEventPublisher,
} from "../src/content-variant";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const correlationId = "correlation-1" as CorrelationId;
const calendarId = "calendar-1" as ContentCalendarId;
const planId = "plan-1" as ContentPlanId;
const contentId = "content-1" as ContentId;
const variantSetId = "variant-set-1" as ContentVariantSetId;
const eventId = "event-1" as EventId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingContentVariantEventPublisher
  implements ContentVariantEventPublisher
{
  readonly events: ContentVariantDomainEvent[] = [];

  async publish(event: ContentVariantDomainEvent): Promise<void> {
    this.events.push(event);
  }
}

function createService() {
  const variantRepository = new InMemoryContentVariantRepository();
  const contentRepository = new InMemoryContentRepository();
  const planRepository = new InMemoryContentPlanRepository();
  const calendarRepository = new InMemoryContentCalendarRepository();
  const publisher = new RecordingContentVariantEventPublisher();
  const timestamps = [
    "2026-06-27T00:00:00.000Z",
    "2026-06-27T01:00:00.000Z",
    "2026-06-27T02:00:00.000Z",
    "2026-06-27T03:00:00.000Z",
    "2026-06-27T04:00:00.000Z",
    "2026-06-27T05:00:00.000Z",
  ];
  const service = new ContentVariantApplicationService(
    variantRepository,
    contentRepository,
    planRepository,
    calendarRepository,
    publisher,
    () => timestamps.shift() ?? "2026-06-27T06:00:00.000Z",
    () => eventId,
    () => variantSetId
  );

  return {
    calendarRepository,
    contentRepository,
    planRepository,
    publisher,
    service,
    variantRepository,
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

async function seedPlan(
  repository: InMemoryContentPlanRepository,
  ownerBusinessId: BusinessId = businessId
) {
  const plan = ContentPlan.create({
    planId,
    businessId: ownerBusinessId,
    calendarId,
    name: "90 day growth content plan",
    createdAt: "2026-06-27T00:00:00.000Z",
  });

  plan.addPlannedContent({
    contentId,
    platforms: ["facebook", "instagram"],
    plannedFor: "2026-06-28T09:00:00.000Z",
    addedAt: "2026-06-27T01:00:00.000Z",
  });

  await repository.save(plan);
}

async function createVariantSet(service: ContentVariantApplicationService) {
  return service.createContentVariantSet({
    commandType: "CreateContentVariantSet",
    context,
    variantSetId,
    planId,
    contentId,
  });
}

describe("ContentVariantApplicationService", () => {
  it("creates a variant set for content already in a plan", async () => {
    const {
      calendarRepository,
      contentRepository,
      planRepository,
      publisher,
      service,
      variantRepository,
    } = createService();

    await seedCalendar(calendarRepository);
    await seedContent(contentRepository);
    await seedPlan(planRepository);

    const result = await createVariantSet(service);

    expect(result.ok).toBe(true);
    expect(await variantRepository.exists(variantSetId)).toBe(true);
    expect(publisher.events[0]).toMatchObject({
      eventType: "ContentVariantSetCreated",
      aggregateId: variantSetId,
      aggregateType: "ContentVariantSet",
      eventId,
      correlationId,
      version: 1,
      payload: {
        variantSetId,
        businessId,
        planId,
        contentId,
      },
    });
  });

  it("adds a platform variant allowed by the plan entry", async () => {
    const {
      calendarRepository,
      contentRepository,
      planRepository,
      publisher,
      service,
    } = createService();

    await seedCalendar(calendarRepository);
    await seedContent(contentRepository);
    await seedPlan(planRepository);
    await createVariantSet(service);

    const result = await service.addContentVariant({
      commandType: "AddContentVariant",
      context,
      variantSetId,
      platform: "instagram",
      format: "reel",
      hook: "Stop guessing what to post",
      body: "Turn one idea into a weekly content rhythm.",
      cta: "Save this for your next planning session.",
      ctaType: "engagement",
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.variantSet.listVariants()).toHaveLength(1);
    }

    expect(publisher.events.at(-1)).toMatchObject({
      eventType: "ContentVariantAdded",
      payload: {
        platform: "instagram",
        format: "reel",
        hook: "Stop guessing what to post",
        ctaType: "engagement",
      },
    });
  });

  it("rejects missing, foreign, and unplanned dependencies", async () => {
    const {
      calendarRepository,
      contentRepository,
      planRepository,
      service,
    } = createService();

    const missingPlan = await createVariantSet(service);
    expect(missingPlan.ok).toBe(false);

    if (!missingPlan.ok) {
      expect(missingPlan.error.code).toBe("ContentPlanNotFound");
    }

    await seedCalendar(calendarRepository);
    await seedContent(contentRepository);
    await seedPlan(planRepository, otherBusinessId);

    const foreignPlan = await createVariantSet(service);
    expect(foreignPlan.ok).toBe(false);

    if (!foreignPlan.ok) {
      expect(foreignPlan.error.code).toBe("ValidationFailed");
    }
  });

  it("rejects variants for platforms not included in the plan entry", async () => {
    const {
      calendarRepository,
      contentRepository,
      planRepository,
      service,
    } = createService();

    await seedCalendar(calendarRepository);
    await seedContent(contentRepository);
    await seedPlan(planRepository);
    await createVariantSet(service);

    const result = await service.addContentVariant({
      commandType: "AddContentVariant",
      context,
      variantSetId,
      platform: "tiktok",
      format: "short_video",
      hook: "Content planning in 30 seconds",
      cta: "DM me PLAN.",
      ctaType: "dm_whatsapp",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error.code).toBe("ValidationFailed");
    }
  });

  it("updates, approves, archives, and restores variants", async () => {
    const {
      calendarRepository,
      contentRepository,
      planRepository,
      publisher,
      service,
    } = createService();

    await seedCalendar(calendarRepository);
    await seedContent(contentRepository);
    await seedPlan(planRepository);
    await createVariantSet(service);
    await service.addContentVariant({
      commandType: "AddContentVariant",
      context,
      variantSetId,
      platform: "facebook",
      format: "long_post",
      hook: "The easiest way to plan content",
      cta: "Comment PLAN.",
      ctaType: "engagement",
    });
    await service.updateContentVariant({
      commandType: "UpdateContentVariant",
      context,
      variantSetId,
      platform: "facebook",
      hook: "Plan content without overthinking",
      ctaType: "lead_magnet",
    });
    await service.approveContentVariant({
      commandType: "ApproveContentVariant",
      context,
      variantSetId,
      platform: "facebook",
    });
    await service.archiveContentVariant({
      commandType: "ArchiveContentVariant",
      context,
      variantSetId,
      platform: "facebook",
    });
    await service.archiveContentVariantSet({
      commandType: "ArchiveContentVariantSet",
      context,
      variantSetId,
    });
    const result = await service.restoreContentVariantSet({
      commandType: "RestoreContentVariantSet",
      context,
      variantSetId,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.variantSet.toSnapshot()).toMatchObject({
        status: "active",
        archivedAt: undefined,
      });
    }

    expect(publisher.events.map((event) => event.eventType)).toEqual([
      "ContentVariantSetCreated",
      "ContentVariantAdded",
      "ContentVariantUpdated",
      "ContentVariantApproved",
      "ContentVariantArchived",
      "ContentVariantSetArchived",
      "ContentVariantSetRestored",
    ]);
  });
});
