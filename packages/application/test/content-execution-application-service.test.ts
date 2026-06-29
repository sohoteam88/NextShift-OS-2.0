import {
  ContentInsightSet,
  ContentRecommendationSet,
  InMemoryContentExecutionRepository,
  InMemoryContentInsightRepository,
  InMemoryContentRecommendationRepository,
  createInsightFromSummary,
  createRecommendationFromInsight,
  type ContentExecutionDomainEvent,
  type ContentExecutionId,
  type ContentId,
  type ContentInsightId,
  type ContentInsightSetId,
  type ContentPerformanceId,
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
  ContentExecutionApplicationService,
  type ContentExecutionEventPublisher,
} from "../src/content-execution";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const correlationId = "correlation-1" as CorrelationId;
const executionId = "execution-1" as ContentExecutionId;
const recommendationSetId =
  "recommendation-set-1" as ContentRecommendationSetId;
const recommendationId = "recommendation-1" as ContentRecommendationId;
const insightSetId = "insight-set-1" as ContentInsightSetId;
const insightId = "insight-1" as ContentInsightId;
const performanceId = "performance-1" as ContentPerformanceId;
const variantSetId = "variant-set-1" as ContentVariantSetId;
const contentId = "content-1" as ContentId;
const eventId = "event-1" as EventId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingContentExecutionEventPublisher
  implements ContentExecutionEventPublisher
{
  readonly events: ContentExecutionDomainEvent[] = [];

  async publish(event: ContentExecutionDomainEvent): Promise<void> {
    this.events.push(event);
  }
}

function createService() {
  const executionRepository = new InMemoryContentExecutionRepository();
  const recommendationRepository = new InMemoryContentRecommendationRepository();
  const insightRepository = new InMemoryContentInsightRepository();
  const publisher = new RecordingContentExecutionEventPublisher();
  const timestamps = [
    "2026-06-27T00:00:00.000Z",
    "2026-06-27T01:00:00.000Z",
    "2026-06-27T02:00:00.000Z",
    "2026-06-27T03:00:00.000Z",
    "2026-06-27T04:00:00.000Z",
    "2026-06-27T05:00:00.000Z",
    "2026-06-27T06:00:00.000Z",
  ];
  const service = new ContentExecutionApplicationService(
    executionRepository,
    recommendationRepository,
    insightRepository,
    publisher,
    () => timestamps.shift() ?? "2026-06-27T07:00:00.000Z",
    () => eventId,
    () => executionId
  );

  return {
    executionRepository,
    insightRepository,
    publisher,
    recommendationRepository,
    service,
  };
}

function createInsight() {
  return createInsightFromSummary(
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
    "2026-06-27T00:00:00.000Z"
  );
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

  insightSet.recordInsight({
    ...createInsight(),
    createdAt: "2026-06-27T00:00:00.000Z",
  });

  await repository.save(insightSet);
}

async function seedRecommendationSet(
  repository: InMemoryContentRecommendationRepository
) {
  const recommendationSet = ContentRecommendationSet.create({
    recommendationSetId,
    businessId,
    insightSetId,
    performanceId,
    variantSetId,
    contentId,
    createdAt: "2026-06-27T00:00:00.000Z",
  });

  recommendationSet.recordRecommendation(
    createRecommendationFromInsight(
      recommendationId,
      {
        ...createInsight(),
        status: "open",
      },
      "2026-06-27T00:00:00.000Z"
    )
  );

  await repository.save(recommendationSet);
}

async function seedValidGraph(repositories: ReturnType<typeof createService>) {
  await seedInsightSet(repositories.insightRepository);
  await seedRecommendationSet(repositories.recommendationRepository);
}

async function createExecution(service: ContentExecutionApplicationService) {
  return service.createContentExecutionFromRecommendation({
    commandType: "CreateContentExecutionFromRecommendation",
    context,
    executionId,
    recommendationSetId,
    recommendationId,
  });
}

describe("ContentExecutionApplicationService", () => {
  it("creates a content execution from an executable recommendation", async () => {
    const repositories = createService();

    await seedValidGraph(repositories);

    const result = await createExecution(repositories.service);

    expect(result.ok).toBe(true);
    expect(await repositories.executionRepository.exists(executionId)).toBe(true);

    if (result.ok) {
      expect(result.value.execution.toSnapshot()).toMatchObject({
        executionId,
        businessId,
        recommendationSetId,
        recommendationId,
        variantSetId,
        contentId,
        platform: "instagram",
        status: "planned",
      });
    }

    expect(repositories.publisher.events[0]).toMatchObject({
      eventType: "ContentExecutionCreated",
      aggregateId: executionId,
      aggregateType: "ContentExecution",
      eventId,
      correlationId,
      version: 1,
      payload: {
        executionId,
        recommendationSetId,
        recommendationId,
        platform: "instagram",
      },
    });
  });

  it("rejects missing, foreign, and duplicate recommendation execution", async () => {
    const repositories = createService();

    const missing = await createExecution(repositories.service);
    expect(missing.ok).toBe(false);

    if (!missing.ok) {
      expect(missing.error.code).toBe("ContentRecommendationSetNotFound");
    }

    await seedInsightSet(repositories.insightRepository, otherBusinessId);
    await seedRecommendationSet(repositories.recommendationRepository);

    const foreign = await createExecution(repositories.service);
    expect(foreign.ok).toBe(false);

    if (!foreign.ok) {
      expect(foreign.error.code).toBe("ValidationFailed");
    }

    const fresh = createService();
    await seedValidGraph(fresh);
    await createExecution(fresh.service);
    const duplicate = await createExecution(fresh.service);

    expect(duplicate.ok).toBe(false);

    if (!duplicate.ok) {
      expect(duplicate.error.code).toBe("ValidationFailed");
    }
  });

  it("schedules, starts, completes, archives, restores, and lists pending executions", async () => {
    const repositories = createService();

    await seedValidGraph(repositories);
    await createExecution(repositories.service);
    await repositories.service.scheduleContentExecution({
      commandType: "ScheduleContentExecution",
      context,
      executionId,
      scheduledFor: "2026-06-28T09:00:00.000Z",
    });

    const pending = await repositories.service.listPendingContentExecutions({
      queryType: "ListPendingContentExecutions",
      context,
    });

    expect(pending.executions).toHaveLength(1);

    await repositories.service.startContentExecution({
      commandType: "StartContentExecution",
      context,
      executionId,
    });
    await repositories.service.completeContentExecution({
      commandType: "CompleteContentExecution",
      context,
      executionId,
      note: "Published on Instagram.",
    });
    await repositories.service.archiveContentExecution({
      commandType: "ArchiveContentExecution",
      context,
      executionId,
    });
    const restored = await repositories.service.restoreContentExecution({
      commandType: "RestoreContentExecution",
      context,
      executionId,
    });

    expect(restored.ok).toBe(true);

    if (restored.ok) {
      expect(restored.value.execution.toSnapshot()).toMatchObject({
        status: "planned",
        archivedAt: undefined,
      });
    }

    expect(repositories.publisher.events.map((event) => event.eventType)).toEqual([
      "ContentExecutionCreated",
      "ContentExecutionScheduled",
      "ContentExecutionStarted",
      "ContentExecutionCompleted",
      "ContentExecutionArchived",
      "ContentExecutionRestored",
    ]);
  });

  it("fails and cancels execution workflows", async () => {
    const failed = createService();

    await seedValidGraph(failed);
    await createExecution(failed.service);
    await failed.service.scheduleContentExecution({
      commandType: "ScheduleContentExecution",
      context,
      executionId,
      scheduledFor: "2026-06-28T09:00:00.000Z",
    });
    const failResult = await failed.service.failContentExecution({
      commandType: "FailContentExecution",
      context,
      executionId,
      note: "Platform upload failed.",
    });

    expect(failResult.ok).toBe(true);

    const cancelled = createService();

    await seedValidGraph(cancelled);
    await createExecution(cancelled.service);
    const cancelResult = await cancelled.service.cancelContentExecution({
      commandType: "CancelContentExecution",
      context,
      executionId,
    });

    expect(cancelResult.ok).toBe(true);
  });
});
