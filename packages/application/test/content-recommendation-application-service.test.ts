import {
  ContentAsset,
  ContentCalendar,
  ContentInsightSet,
  ContentPerformance,
  ContentPlan,
  ContentVariantSet,
  InMemoryContentCalendarRepository,
  InMemoryContentInsightRepository,
  InMemoryContentPerformanceRepository,
  InMemoryContentPlanRepository,
  InMemoryContentRecommendationRepository,
  InMemoryContentRepository,
  InMemoryContentVariantRepository,
  createInsightFromSummary,
  type ContentCalendarId,
  type ContentId,
  type ContentInsightId,
  type ContentInsightSetId,
  type ContentPerformanceId,
  type ContentPlanId,
  type ContentRecommendationDomainEvent,
  type ContentRecommendationId,
  type ContentRecommendationSetId,
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
  ContentRecommendationApplicationService,
  type ContentRecommendationEventPublisher,
} from "../src/content-recommendation";

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
const recommendationSetId =
  "recommendation-set-1" as ContentRecommendationSetId;
const recommendationId = "recommendation-1" as ContentRecommendationId;
const eventId = "event-1" as EventId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingContentRecommendationEventPublisher
  implements ContentRecommendationEventPublisher
{
  readonly events: ContentRecommendationDomainEvent[] = [];

  async publish(event: ContentRecommendationDomainEvent): Promise<void> {
    this.events.push(event);
  }
}

function createService() {
  const recommendationRepository =
    new InMemoryContentRecommendationRepository();
  const insightRepository = new InMemoryContentInsightRepository();
  const performanceRepository = new InMemoryContentPerformanceRepository();
  const variantRepository = new InMemoryContentVariantRepository();
  const contentRepository = new InMemoryContentRepository();
  const planRepository = new InMemoryContentPlanRepository();
  const calendarRepository = new InMemoryContentCalendarRepository();
  const publisher = new RecordingContentRecommendationEventPublisher();
  const timestamps = [
    "2026-06-27T00:00:00.000Z",
    "2026-06-27T01:00:00.000Z",
    "2026-06-27T02:00:00.000Z",
    "2026-06-27T03:00:00.000Z",
    "2026-06-27T04:00:00.000Z",
    "2026-06-27T05:00:00.000Z",
  ];
  const service = new ContentRecommendationApplicationService(
    recommendationRepository,
    insightRepository,
    performanceRepository,
    variantRepository,
    contentRepository,
    planRepository,
    calendarRepository,
    publisher,
    () => timestamps.shift() ?? "2026-06-27T06:00:00.000Z",
    () => eventId,
    () => recommendationSetId,
    () => recommendationId
  );

  return {
    calendarRepository,
    contentRepository,
    insightRepository,
    performanceRepository,
    planRepository,
    publisher,
    recommendationRepository,
    service,
    variantRepository,
  };
}

async function seedContent(repository: InMemoryContentRepository) {
  await repository.save(
    ContentAsset.create({
      contentId,
      businessId,
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
  repository: InMemoryContentPerformanceRepository
) {
  const performance = ContentPerformance.create({
    performanceId,
    businessId,
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

async function seedInsightSet(
  repository: InMemoryContentInsightRepository,
  ownerBusinessId: BusinessId = businessId
) {
  const insightSet = ContentInsightSet.create({
    insightSetId,
    businessId: ownerBusinessId,
    performanceId,
    variantSetId,
    contentId,
    createdAt: "2026-06-27T00:00:00.000Z",
  });

  insightSet.recordInsight(
    createInsightFromSummary(
      insightId,
      {
        platform: "instagram",
        impressions: 100,
        reach: 80,
        engagements: 20,
        clicks: 5,
        saves: 4,
        shares: 3,
        comments: 2,
        leads: 1,
        conversions: 1,
      },
      "2026-06-27T01:00:00.000Z"
    )
  );

  await repository.save(insightSet);
}

async function seedValidGraph(repositories: ReturnType<typeof createService>) {
  await seedCalendar(repositories.calendarRepository);
  await seedContent(repositories.contentRepository);
  await seedPlan(repositories.planRepository);
  await seedVariantSet(repositories.variantRepository);
  await seedPerformance(repositories.performanceRepository);
  await seedInsightSet(repositories.insightRepository);
}

async function createRecommendationSet(
  service: ContentRecommendationApplicationService
) {
  return service.createContentRecommendationSet({
    commandType: "CreateContentRecommendationSet",
    context,
    recommendationSetId,
    insightSetId,
  });
}

describe("ContentRecommendationApplicationService", () => {
  it("creates a recommendation set for a valid insight graph", async () => {
    const repositories = createService();

    await seedValidGraph(repositories);

    const result = await createRecommendationSet(repositories.service);

    expect(result.ok).toBe(true);
    expect(
      await repositories.recommendationRepository.exists(recommendationSetId)
    ).toBe(true);
    expect(repositories.publisher.events[0]).toMatchObject({
      eventType: "ContentRecommendationSetCreated",
      aggregateId: recommendationSetId,
      aggregateType: "ContentRecommendationSet",
      eventId,
      correlationId,
      version: 1,
      payload: {
        recommendationSetId,
        businessId,
        insightSetId,
        performanceId,
        variantSetId,
        contentId,
      },
    });
  });

  it("generates a recommendation from an open insight", async () => {
    const repositories = createService();

    await seedValidGraph(repositories);
    await createRecommendationSet(repositories.service);

    const result = await repositories.service.generateContentRecommendation({
      commandType: "GenerateContentRecommendation",
      context,
      recommendationSetId,
      recommendationId,
      insightId,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.recommendationSet.listRecommendations()[0]).toMatchObject({
        action: "amplify",
        priority: "high",
        status: "open",
      });
    }

    expect(repositories.publisher.events.at(-1)).toMatchObject({
      eventType: "ContentRecommendationRecorded",
      payload: {
        recommendationId,
        insightId,
        action: "amplify",
      },
    });
  });

  it("rejects missing or foreign insight graphs", async () => {
    const repositories = createService();

    const missing = await createRecommendationSet(repositories.service);
    expect(missing.ok).toBe(false);

    if (!missing.ok) {
      expect(missing.error.code).toBe("ContentInsightSetNotFound");
    }

    await seedCalendar(repositories.calendarRepository);
    await seedContent(repositories.contentRepository);
    await seedPlan(repositories.planRepository);
    await seedVariantSet(repositories.variantRepository);
    await seedPerformance(repositories.performanceRepository);
    await seedInsightSet(repositories.insightRepository, otherBusinessId);

    const foreign = await createRecommendationSet(repositories.service);
    expect(foreign.ok).toBe(false);

    if (!foreign.ok) {
      expect(foreign.error.code).toBe("ValidationFailed");
    }
  });

  it("rejects recommendation generation for missing open insight", async () => {
    const repositories = createService();

    await seedValidGraph(repositories);
    await createRecommendationSet(repositories.service);

    const result = await repositories.service.generateContentRecommendation({
      commandType: "GenerateContentRecommendation",
      context,
      recommendationSetId,
      insightId: "missing-insight" as ContentInsightId,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error.code).toBe("ValidationFailed");
    }
  });

  it("applies, dismisses, archives, and restores recommendations", async () => {
    const repositories = createService();

    await seedValidGraph(repositories);
    await createRecommendationSet(repositories.service);
    await repositories.service.generateContentRecommendation({
      commandType: "GenerateContentRecommendation",
      context,
      recommendationSetId,
      recommendationId,
      insightId,
    });
    await repositories.service.applyContentRecommendation({
      commandType: "ApplyContentRecommendation",
      context,
      recommendationSetId,
      recommendationId,
    });
    await repositories.service.archiveContentRecommendation({
      commandType: "ArchiveContentRecommendation",
      context,
      recommendationSetId,
      recommendationId,
    });
    await repositories.service.archiveContentRecommendationSet({
      commandType: "ArchiveContentRecommendationSet",
      context,
      recommendationSetId,
    });
    const result = await repositories.service.restoreContentRecommendationSet({
      commandType: "RestoreContentRecommendationSet",
      context,
      recommendationSetId,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.recommendationSet.toSnapshot()).toMatchObject({
        status: "active",
        archivedAt: undefined,
      });
    }

    expect(repositories.publisher.events.map((event) => event.eventType)).toEqual([
      "ContentRecommendationSetCreated",
      "ContentRecommendationRecorded",
      "ContentRecommendationApplied",
      "ContentRecommendationArchived",
      "ContentRecommendationSetArchived",
      "ContentRecommendationSetRestored",
    ]);
  });
});
