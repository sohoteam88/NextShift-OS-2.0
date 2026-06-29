import {
  ContentAsset,
  ContentCalendar,
  ContentPlan,
  ContentVariantSet,
  InMemoryContentCalendarRepository,
  InMemoryContentPerformanceRepository,
  InMemoryContentPlanRepository,
  InMemoryContentRepository,
  InMemoryContentVariantRepository,
  type ContentCalendarId,
  type ContentId,
  type ContentPerformanceDomainEvent,
  type ContentPerformanceId,
  type ContentPlanId,
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
  ContentPerformanceApplicationService,
  type ContentPerformanceEventPublisher,
} from "../src/content-performance";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const correlationId = "correlation-1" as CorrelationId;
const calendarId = "calendar-1" as ContentCalendarId;
const planId = "plan-1" as ContentPlanId;
const contentId = "content-1" as ContentId;
const variantSetId = "variant-set-1" as ContentVariantSetId;
const performanceId = "performance-1" as ContentPerformanceId;
const eventId = "event-1" as EventId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingContentPerformanceEventPublisher
  implements ContentPerformanceEventPublisher
{
  readonly events: ContentPerformanceDomainEvent[] = [];

  async publish(event: ContentPerformanceDomainEvent): Promise<void> {
    this.events.push(event);
  }
}

function createService() {
  const performanceRepository = new InMemoryContentPerformanceRepository();
  const variantRepository = new InMemoryContentVariantRepository();
  const contentRepository = new InMemoryContentRepository();
  const planRepository = new InMemoryContentPlanRepository();
  const calendarRepository = new InMemoryContentCalendarRepository();
  const publisher = new RecordingContentPerformanceEventPublisher();
  const timestamps = [
    "2026-06-27T00:00:00.000Z",
    "2026-06-27T01:00:00.000Z",
    "2026-06-27T02:00:00.000Z",
    "2026-06-27T03:00:00.000Z",
    "2026-06-27T04:00:00.000Z",
  ];
  const service = new ContentPerformanceApplicationService(
    performanceRepository,
    variantRepository,
    contentRepository,
    planRepository,
    calendarRepository,
    publisher,
    () => timestamps.shift() ?? "2026-06-27T05:00:00.000Z",
    () => eventId,
    () => performanceId
  );

  return {
    calendarRepository,
    contentRepository,
    performanceRepository,
    planRepository,
    publisher,
    service,
    variantRepository,
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

async function seedVariantSet(
  repository: InMemoryContentVariantRepository,
  ownerBusinessId: BusinessId = businessId
) {
  const variantSet = ContentVariantSet.create({
    variantSetId,
    businessId: ownerBusinessId,
    planId,
    contentId,
    createdAt: "2026-06-27T00:00:00.000Z",
  });

  variantSet.addVariant({
    platform: "instagram",
    format: "reel",
    hook: "Stop guessing what to post",
    cta: "Save this for later.",
    ctaType: "engagement",
    createdAt: "2026-06-27T01:00:00.000Z",
  });

  await repository.save(variantSet);
}

async function seedValidGraph(
  repositories: ReturnType<typeof createService>
) {
  await seedCalendar(repositories.calendarRepository);
  await seedContent(repositories.contentRepository);
  await seedPlan(repositories.planRepository);
  await seedVariantSet(repositories.variantRepository);
}

async function createPerformance(
  service: ContentPerformanceApplicationService
) {
  return service.createContentPerformance({
    commandType: "CreateContentPerformance",
    context,
    performanceId,
    variantSetId,
  });
}

describe("ContentPerformanceApplicationService", () => {
  it("creates performance for a valid variant set graph", async () => {
    const repositories = createService();

    await seedValidGraph(repositories);

    const result = await createPerformance(repositories.service);

    expect(result.ok).toBe(true);
    expect(await repositories.performanceRepository.exists(performanceId)).toBe(
      true
    );
    expect(repositories.publisher.events[0]).toMatchObject({
      eventType: "ContentPerformanceCreated",
      aggregateId: performanceId,
      aggregateType: "ContentPerformance",
      eventId,
      correlationId,
      version: 1,
      payload: {
        performanceId,
        businessId,
        variantSetId,
        contentId,
      },
    });
  });

  it("records metrics for an existing platform variant", async () => {
    const repositories = createService();

    await seedValidGraph(repositories);
    await createPerformance(repositories.service);

    const result = await repositories.service.recordContentMetrics({
      commandType: "RecordContentMetrics",
      context,
      performanceId,
      platform: "instagram",
      measuredAt: "2026-06-28T00:00:00.000Z",
      impressions: 100,
      reach: 80,
      engagements: 20,
      clicks: 5,
      saves: 4,
      shares: 3,
      comments: 2,
      leads: 1,
      conversions: 1,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.performance.summarizePlatform("instagram")).toMatchObject({
        impressions: 100,
        engagements: 20,
        leads: 1,
        conversions: 1,
      });
    }

    expect(repositories.publisher.events.at(-1)).toMatchObject({
      eventType: "ContentMetricsRecorded",
      payload: {
        platform: "instagram",
        impressions: 100,
        conversions: 1,
      },
    });
  });

  it("rejects missing or foreign variant set graphs", async () => {
    const repositories = createService();

    const missing = await createPerformance(repositories.service);
    expect(missing.ok).toBe(false);

    if (!missing.ok) {
      expect(missing.error.code).toBe("ContentVariantSetNotFound");
    }

    await seedCalendar(repositories.calendarRepository);
    await seedContent(repositories.contentRepository);
    await seedPlan(repositories.planRepository);
    await seedVariantSet(repositories.variantRepository, otherBusinessId);

    const foreign = await createPerformance(repositories.service);
    expect(foreign.ok).toBe(false);

    if (!foreign.ok) {
      expect(foreign.error.code).toBe("ValidationFailed");
    }
  });

  it("rejects metrics for a platform without a content variant", async () => {
    const repositories = createService();

    await seedValidGraph(repositories);
    await createPerformance(repositories.service);

    const result = await repositories.service.recordContentMetrics({
      commandType: "RecordContentMetrics",
      context,
      performanceId,
      platform: "facebook",
      measuredAt: "2026-06-28T00:00:00.000Z",
      impressions: 100,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error.code).toBe("ValidationFailed");
    }
  });

  it("archives and restores performance records", async () => {
    const repositories = createService();

    await seedValidGraph(repositories);
    await createPerformance(repositories.service);
    await repositories.service.archiveContentPerformance({
      commandType: "ArchiveContentPerformance",
      context,
      performanceId,
    });
    const result = await repositories.service.restoreContentPerformance({
      commandType: "RestoreContentPerformance",
      context,
      performanceId,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.performance.toSnapshot()).toMatchObject({
        status: "active",
        archivedAt: undefined,
      });
    }

    expect(repositories.publisher.events.map((event) => event.eventType)).toEqual([
      "ContentPerformanceCreated",
      "ContentPerformanceArchived",
      "ContentPerformanceRestored",
    ]);
  });
});
