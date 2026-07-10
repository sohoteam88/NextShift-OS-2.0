import {
  InMemoryRevenueForecastReviewRepository,
  RevenueForecast,
  type RevenueForecastReviewDomainEvent,
  type RevenueForecastReviewId,
  type RevenueTargetId,
} from "@nextshift/domain";
import type {
  BusinessId,
  CorrelationId,
  EventId,
  TenantId,
} from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  RevenueForecastReviewApplicationService,
  type RevenueForecastReviewEventPublisher,
} from "../src/revenue-forecast-review";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const correlationId = "correlation-1" as CorrelationId;
const reviewId = "forecast-review-1" as RevenueForecastReviewId;
const revenueTargetId = "target-1" as RevenueTargetId;
const eventId = "event-1" as EventId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingRevenueForecastReviewEventPublisher
  implements RevenueForecastReviewEventPublisher
{
  readonly events: RevenueForecastReviewDomainEvent[] = [];

  async publish(event: RevenueForecastReviewDomainEvent): Promise<void> {
    this.events.push(event);
  }
}

function createForecast() {
  return RevenueForecast.create({
    revenueTargetId,
    businessId,
    targetPeriod: {
      start: "2026-07-01T00:00:00.000Z",
      end: "2026-08-01T00:00:00.000Z",
    },
    asOf: "2026-07-15T00:00:00.000Z",
    targetAmount: 1000,
    recognizedRevenue: 400,
    forecastRevenue: 800,
    currency: "USD",
  }).toSnapshot();
}

function createService() {
  const repository = new InMemoryRevenueForecastReviewRepository();
  const publisher = new RecordingRevenueForecastReviewEventPublisher();
  const timestamps = [
    "2026-07-06T00:00:00.000Z",
    "2026-07-06T01:00:00.000Z",
    "2026-07-06T02:00:00.000Z",
    "2026-07-06T03:00:00.000Z",
  ];
  const service = new RevenueForecastReviewApplicationService(
    repository,
    publisher,
    () => timestamps.shift() ?? "2026-07-06T04:00:00.000Z",
    () => eventId,
    () => reviewId
  );

  return { publisher, repository, service };
}

async function createReview(service: RevenueForecastReviewApplicationService) {
  return service.createRevenueForecastReview({
    commandType: "CreateRevenueForecastReview",
    context,
    reviewId,
    forecast: createForecast(),
    reviewNotes: "Review July revenue forecast.",
  });
}

describe("RevenueForecastReviewApplicationService", () => {
  it("creates, submits, and approves revenue forecast reviews", async () => {
    const { publisher, service } = createService();

    const created = await createReview(service);
    expect(created.ok).toBe(true);

    const submitted = await service.submitRevenueForecastReview({
      commandType: "SubmitRevenueForecastReview",
      context,
      reviewId,
    });
    expect(submitted.ok).toBe(true);

    const approved = await service.approveRevenueForecastReview({
      commandType: "ApproveRevenueForecastReview",
      context,
      reviewId,
      reviewer: "Finance Lead",
      reason: "Forecast assumptions accepted.",
    });
    expect(approved.ok).toBe(true);

    if (approved.ok) {
      expect(approved.value.review.toSnapshot()).toMatchObject({
        status: "approved",
        reviewer: "Finance Lead",
        decisionReason: "Forecast assumptions accepted.",
      });
    }

    expect(publisher.events.map((event) => event.eventType)).toEqual([
      "RevenueForecastReviewCreated",
      "RevenueForecastReviewSubmitted",
      "RevenueForecastReviewApproved",
    ]);
    expect(publisher.events[0]).toMatchObject({
      eventType: "RevenueForecastReviewCreated",
      aggregateId: reviewId,
      aggregateType: "RevenueForecastReview",
      eventId,
      correlationId,
      payload: {
        reviewId,
        businessId,
        revenueTargetId,
      },
    });
  });

  it("rejects and archives revenue forecast reviews", async () => {
    const { publisher, service } = createService();

    await createReview(service);
    await service.submitRevenueForecastReview({
      commandType: "SubmitRevenueForecastReview",
      context,
      reviewId,
    });

    const rejected = await service.rejectRevenueForecastReview({
      commandType: "RejectRevenueForecastReview",
      context,
      reviewId,
      reviewer: "Finance Lead",
      reason: "Baseline requires correction.",
    });
    expect(rejected.ok).toBe(true);

    const archived = await service.archiveRevenueForecastReview({
      commandType: "ArchiveRevenueForecastReview",
      context,
      reviewId,
    });
    expect(archived.ok).toBe(true);

    expect(publisher.events.map((event) => event.eventType)).toEqual([
      "RevenueForecastReviewCreated",
      "RevenueForecastReviewSubmitted",
      "RevenueForecastReviewRejected",
      "RevenueForecastReviewArchived",
    ]);
  });

  it("lists reviews by business, status, and target", async () => {
    const { service } = createService();

    await createReview(service);
    await service.submitRevenueForecastReview({
      commandType: "SubmitRevenueForecastReview",
      context,
      reviewId,
    });

    expect(
      (
        await service.listRevenueForecastReviews({
          queryType: "ListRevenueForecastReviews",
          context,
        })
      ).reviews
    ).toHaveLength(1);
    expect(
      (
        await service.listRevenueForecastReviewsByStatus({
          queryType: "ListRevenueForecastReviewsByStatus",
          context,
          status: "pending_review",
        })
      ).reviews
    ).toHaveLength(1);
    expect(
      (
        await service.listRevenueForecastReviewsByTarget({
          queryType: "ListRevenueForecastReviewsByTarget",
          context,
          revenueTargetId,
        })
      ).reviews
    ).toHaveLength(1);
  });

  it("rejects missing and foreign review access", async () => {
    const { service } = createService();

    const missing = await service.submitRevenueForecastReview({
      commandType: "SubmitRevenueForecastReview",
      context,
      reviewId,
    });
    expect(missing.ok).toBe(false);

    if (!missing.ok) {
      expect(missing.error.code).toBe("RevenueForecastReviewNotFound");
    }

    await createReview(service);

    const foreign = await service.submitRevenueForecastReview({
      commandType: "SubmitRevenueForecastReview",
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
