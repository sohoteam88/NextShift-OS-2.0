import {
  InMemoryAnalyticsInsightReviewRepository,
  type AnalyticsInsightReviewDomainEvent,
  type AnalyticsInsightReviewId,
} from "@nextshift/domain";
import type {
  BusinessId,
  CorrelationId,
  EventId,
  TenantId,
} from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  AnalyticsInsightReviewApplicationService,
  type AnalyticsInsightReviewEventPublisher,
} from "../src/analytics-insight-review";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const correlationId = "correlation-1" as CorrelationId;
const reviewId = "analytics-insight-review-1" as AnalyticsInsightReviewId;
const eventId = "event-1" as EventId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingAnalyticsInsightReviewEventPublisher
  implements AnalyticsInsightReviewEventPublisher
{
  readonly events: AnalyticsInsightReviewDomainEvent[] = [];

  async publish(event: AnalyticsInsightReviewDomainEvent): Promise<void> {
    this.events.push(event);
  }
}

function createService() {
  const repository = new InMemoryAnalyticsInsightReviewRepository();
  const publisher = new RecordingAnalyticsInsightReviewEventPublisher();
  const timestamps = [
    "2026-07-06T00:00:00.000Z",
    "2026-07-06T01:00:00.000Z",
    "2026-07-06T02:00:00.000Z",
    "2026-07-06T03:00:00.000Z",
  ];
  const service = new AnalyticsInsightReviewApplicationService(
    repository,
    publisher,
    () => timestamps.shift() ?? "2026-07-06T04:00:00.000Z",
    () => eventId,
    () => reviewId
  );

  return { publisher, repository, service };
}

async function createReview(service: AnalyticsInsightReviewApplicationService) {
  return service.createAnalyticsInsightReview({
    commandType: "CreateAnalyticsInsightReview",
    context,
    reviewId,
    title: "Campaign pipeline conversion risk",
    summary: "CRM and campaign signals show pipeline conversion is slowing.",
    category: "campaign",
    priority: "high",
    sources: [
      {
        type: "crm",
        referenceId: "lead-signal-1",
        summary: "Qualified lead conversion dropped.",
      },
      {
        type: "campaign",
        referenceId: "campaign-execution-1",
        summary: "Launch follow-up underperformed.",
      },
    ],
  });
}

describe("AnalyticsInsightReviewApplicationService", () => {
  it("creates, submits, and approves analytics insight reviews", async () => {
    const { publisher, service } = createService();

    const created = await createReview(service);
    expect(created.ok).toBe(true);

    const submitted = await service.submitAnalyticsInsightReview({
      commandType: "SubmitAnalyticsInsightReview",
      context,
      reviewId,
    });
    expect(submitted.ok).toBe(true);

    const approved = await service.approveAnalyticsInsightReview({
      commandType: "ApproveAnalyticsInsightReview",
      context,
      reviewId,
      reviewer: "Operations Lead",
      reason: "Actionable for next campaign review.",
    });
    expect(approved.ok).toBe(true);

    if (approved.ok) {
      expect(approved.value.review.toSnapshot()).toMatchObject({
        status: "approved",
        reviewer: "Operations Lead",
        approvalReason: "Actionable for next campaign review.",
      });
    }

    expect(publisher.events.map((event) => event.eventType)).toEqual([
      "AnalyticsInsightReviewCreated",
      "AnalyticsInsightReviewSubmitted",
      "AnalyticsInsightReviewApproved",
    ]);
    expect(publisher.events[0]).toMatchObject({
      eventType: "AnalyticsInsightReviewCreated",
      aggregateId: reviewId,
      aggregateType: "AnalyticsInsightReview",
      eventId,
      correlationId,
      payload: {
        reviewId,
        businessId,
        category: "campaign",
        priority: "high",
      },
    });
  });

  it("dismisses and archives analytics insight reviews", async () => {
    const { publisher, service } = createService();

    await createReview(service);
    await service.submitAnalyticsInsightReview({
      commandType: "SubmitAnalyticsInsightReview",
      context,
      reviewId,
    });

    const dismissed = await service.dismissAnalyticsInsightReview({
      commandType: "DismissAnalyticsInsightReview",
      context,
      reviewId,
      reviewer: "Operations Lead",
      reason: "Duplicate of existing weekly insight.",
    });
    expect(dismissed.ok).toBe(true);

    const archived = await service.archiveAnalyticsInsightReview({
      commandType: "ArchiveAnalyticsInsightReview",
      context,
      reviewId,
    });
    expect(archived.ok).toBe(true);

    expect(publisher.events.map((event) => event.eventType)).toEqual([
      "AnalyticsInsightReviewCreated",
      "AnalyticsInsightReviewSubmitted",
      "AnalyticsInsightReviewDismissed",
      "AnalyticsInsightReviewArchived",
    ]);
  });

  it("lists reviews by business, status, priority, and category", async () => {
    const { service } = createService();

    await createReview(service);
    await service.submitAnalyticsInsightReview({
      commandType: "SubmitAnalyticsInsightReview",
      context,
      reviewId,
    });

    expect(
      (
        await service.listAnalyticsInsightReviews({
          queryType: "ListAnalyticsInsightReviews",
          context,
        })
      ).reviews
    ).toHaveLength(1);
    expect(
      (
        await service.listAnalyticsInsightReviewsByStatus({
          queryType: "ListAnalyticsInsightReviewsByStatus",
          context,
          status: "pending_review",
        })
      ).reviews
    ).toHaveLength(1);
    expect(
      (
        await service.listAnalyticsInsightReviewsByPriority({
          queryType: "ListAnalyticsInsightReviewsByPriority",
          context,
          priority: "high",
        })
      ).reviews
    ).toHaveLength(1);
    expect(
      (
        await service.listAnalyticsInsightReviewsByCategory({
          queryType: "ListAnalyticsInsightReviewsByCategory",
          context,
          category: "campaign",
        })
      ).reviews
    ).toHaveLength(1);
  });

  it("rejects missing and foreign review access", async () => {
    const { service } = createService();

    const missing = await service.submitAnalyticsInsightReview({
      commandType: "SubmitAnalyticsInsightReview",
      context,
      reviewId,
    });
    expect(missing.ok).toBe(false);

    if (!missing.ok) {
      expect(missing.error.code).toBe("AnalyticsInsightReviewNotFound");
    }

    await createReview(service);

    const foreign = await service.submitAnalyticsInsightReview({
      commandType: "SubmitAnalyticsInsightReview",
      context: {
        ...context,
        businessId: otherBusinessId,
      },
      reviewId,
    });
    expect(foreign.ok).toBe(false);

    if (!foreign.ok) {
      expect(foreign.error.code).toBe("ValidationFailed");
    }
  });
});
