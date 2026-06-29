import {
  ContentAsset,
  ContentCalendar,
  ContentPerformance,
  ContentPlan,
  ContentVariantSet,
  InMemoryContentCalendarRepository,
  InMemoryContentInsightRepository,
  InMemoryContentPerformanceRepository,
  InMemoryContentPlanRepository,
  InMemoryContentRepository,
  InMemoryContentVariantRepository,
  type ContentCalendarId,
  type ContentId,
  type ContentInsightDomainEvent,
  type ContentInsightId,
  type ContentInsightSetId,
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
  ContentInsightApplicationService,
  type ContentInsightEventPublisher,
} from "../src/content-insight";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const correlationId = "correlation-1" as CorrelationId;
const calendarId = "calendar-1" as ContentCalendarId;
const planId = "plan-1" as ContentPlanId;
const contentId = "content-1" as ContentId;
const variantSetId = "variant-set-1" as ContentVariantSetId;
const performanceId = "performance-1" as ContentPerformanceId;
const insightSetId = "insight-set-1" as ContentInsightSetId;
const insightId = "insight-1" as ContentInsightId;
const eventId = "event-1" as EventId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingContentInsightEventPublisher
  implements ContentInsightEventPublisher
{
  readonly events: ContentInsightDomainEvent[] = [];

  async publish(event: ContentInsightDomainEvent): Promise<void> {
    this.events.push(event);
  }
}

function createService() {
  const insightRepository = new InMemoryContentInsightRepository();
  const performanceRepository = new InMemoryContentPerformanceRepository();
  const variantRepository = new InMemoryContentVariantRepository();
  const contentRepository = new InMemoryContentRepository();
  const planRepository = new InMemoryContentPlanRepository();
  const calendarRepository = new InMemoryContentCalendarRepository();
  const publisher = new RecordingContentInsightEventPublisher();
  const timestamps = [
    "2026-06-27T00:00:00.000Z",
    "2026-06-27T01:00:00.000Z",
    "2026-06-27T02:00:00.000Z",
    "2026-06-27T03:00:00.000Z",
    "2026-06-27T04:00:00.000Z",
    "2026-06-27T05:00:00.000Z",
  ];
  const service = new ContentInsightApplicationService(
    insightRepository,
    performanceRepository,
    variantRepository,
    contentRepository,
    planRepository,
    calendarRepository,
    publisher,
    () => timestamps.shift() ?? "2026-06-27T06:00:00.000Z",
    () => eventId,
    () => insightSetId,
    () => insightId
  );

  return {
    calendarRepository,
    contentRepository,
    insightRepository,
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

async function seedCalendar(repository: InMemoryContentCalendarRepository) {
  await repository.save(
    ContentCalendar.create({
      calendarId,
      businessId,
      name: "Growth content calendar",
      createdAt: "2026-06-27T00:00:00.000Z",
    })
  );
}

async function seedPlan(repository: InMemoryContentPlanRepository) {
  const plan = ContentPlan.create({
    planId,
    businessId,
    calendarId,
    name: "90 day growth content plan",
    createdAt: "2026-06-27T00:00:00.000Z",
  });

  plan.addPlannedContent({
    contentId,
    platforms: ["instagram"],
    plannedFor: "2026-06-28T09:00:00.000Z",
    addedAt: "2026-06-27T01:00:00.000Z",
  });

  await repository.save(plan);
}

async function seedVariantSet(repository: InMemoryContentVariantRepository) {
  const variantSet = ContentVariantSet.create({
    variantSetId,
    businessId,
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

async function seedPerformance(
  repository: InMemoryContentPerformanceRepository,
  ownerBusinessId: BusinessId = businessId
) {
  const performance = ContentPerformance.create({
    performanceId,
    businessId: ownerBusinessId,
    variantSetId,
    contentId,
    createdAt: "2026-06-27T00:00:00.000Z",
  });

  performance.recordMetrics({
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
    recordedAt: "2026-06-28T01:00:00.000Z",
  });

  await repository.save(performance);
}

async function seedValidGraph(repositories: ReturnType<typeof createService>) {
  await seedCalendar(repositories.calendarRepository);
  await seedContent(repositories.contentRepository);
  await seedPlan(repositories.planRepository);
  await seedVariantSet(repositories.variantRepository);
  await seedPerformance(repositories.performanceRepository);
}

async function createInsightSet(service: ContentInsightApplicationService) {
  return service.createContentInsightSet({
    commandType: "CreateContentInsightSet",
    context,
    insightSetId,
    performanceId,
  });
}

describe("ContentInsightApplicationService", () => {
  it("creates an insight set for a valid performance graph", async () => {
    const repositories = createService();

    await seedValidGraph(repositories);

    const result = await createInsightSet(repositories.service);

    expect(result.ok).toBe(true);
    expect(await repositories.insightRepository.exists(insightSetId)).toBe(true);
    expect(repositories.publisher.events[0]).toMatchObject({
      eventType: "ContentInsightSetCreated",
      aggregateId: insightSetId,
      aggregateType: "ContentInsightSet",
      eventId,
      correlationId,
      version: 1,
      payload: {
        insightSetId,
        businessId,
        performanceId,
        variantSetId,
        contentId,
      },
    });
  });

  it("generates a winner insight from performance summary", async () => {
    const repositories = createService();

    await seedValidGraph(repositories);
    await createInsightSet(repositories.service);

    const result = await repositories.service.generateContentInsight({
      commandType: "GenerateContentInsight",
      context,
      insightSetId,
      insightId,
      platform: "instagram",
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.insightSet.listInsights()[0]).toMatchObject({
        type: "winner",
        severity: "high",
        action: "amplify",
        evidence: {
          leads: 1,
          conversions: 1,
        },
      });
    }

    expect(repositories.publisher.events.at(-1)).toMatchObject({
      eventType: "ContentInsightRecorded",
      payload: {
        insightId,
        platform: "instagram",
        action: "amplify",
      },
    });
  });

  it("rejects missing or foreign performance graphs", async () => {
    const repositories = createService();

    const missing = await createInsightSet(repositories.service);
    expect(missing.ok).toBe(false);

    if (!missing.ok) {
      expect(missing.error.code).toBe("ContentPerformanceNotFound");
    }

    await seedCalendar(repositories.calendarRepository);
    await seedContent(repositories.contentRepository);
    await seedPlan(repositories.planRepository);
    await seedVariantSet(repositories.variantRepository);
    await seedPerformance(repositories.performanceRepository, otherBusinessId);

    const foreign = await createInsightSet(repositories.service);
    expect(foreign.ok).toBe(false);

    if (!foreign.ok) {
      expect(foreign.error.code).toBe("ValidationFailed");
    }
  });

  it("rejects insight generation without a platform variant", async () => {
    const repositories = createService();

    await seedValidGraph(repositories);
    await createInsightSet(repositories.service);

    const result = await repositories.service.generateContentInsight({
      commandType: "GenerateContentInsight",
      context,
      insightSetId,
      platform: "facebook",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error.code).toBe("ValidationFailed");
    }
  });

  it("resolves, archives, and restores insights", async () => {
    const repositories = createService();

    await seedValidGraph(repositories);
    await createInsightSet(repositories.service);
    await repositories.service.generateContentInsight({
      commandType: "GenerateContentInsight",
      context,
      insightSetId,
      insightId,
      platform: "instagram",
    });
    await repositories.service.resolveContentInsight({
      commandType: "ResolveContentInsight",
      context,
      insightSetId,
      insightId,
    });
    await repositories.service.archiveContentInsight({
      commandType: "ArchiveContentInsight",
      context,
      insightSetId,
      insightId,
    });
    await repositories.service.archiveContentInsightSet({
      commandType: "ArchiveContentInsightSet",
      context,
      insightSetId,
    });
    const result = await repositories.service.restoreContentInsightSet({
      commandType: "RestoreContentInsightSet",
      context,
      insightSetId,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.insightSet.toSnapshot()).toMatchObject({
        status: "active",
        archivedAt: undefined,
      });
    }

    expect(repositories.publisher.events.map((event) => event.eventType)).toEqual([
      "ContentInsightSetCreated",
      "ContentInsightRecorded",
      "ContentInsightResolved",
      "ContentInsightArchived",
      "ContentInsightSetArchived",
      "ContentInsightSetRestored",
    ]);
  });
});
