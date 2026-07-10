import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  InMemoryRevenueForecastReviewRepository,
  RevenueForecast,
  RevenueForecastReview,
  type RevenueForecastReviewId,
  type RevenueTargetId,
} from "../src";

const businessId = "business-1" as BusinessId;
const reviewId = "forecast-review-1" as RevenueForecastReviewId;
const revenueTargetId = "target-1" as RevenueTargetId;
const createdAt = "2026-07-06T00:00:00.000Z";

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

function createReview(): RevenueForecastReview {
  return RevenueForecastReview.create({
    reviewId,
    businessId,
    forecast: createForecast(),
    reviewNotes: "Review July revenue forecast.",
    createdAt,
  });
}

describe("RevenueForecastReview aggregate", () => {
  it("creates a draft review from a forecast snapshot", () => {
    const review = createReview();

    expect(review.toSnapshot()).toMatchObject({
      reviewId,
      businessId,
      revenueTargetId,
      status: "draft",
      reviewNotes: "Review July revenue forecast.",
      forecast: {
        recognizedRevenue: 400,
        forecastRevenue: 800,
        status: "below_target",
      },
      createdAt,
      updatedAt: createdAt,
    });
  });

  it("submits and approves a forecast review", () => {
    const review = createReview();

    review.submit("2026-07-06T01:00:00.000Z");
    review.approve({
      reviewer: "Finance Lead",
      reason: "Forecast assumptions accepted.",
      decidedAt: "2026-07-06T02:00:00.000Z",
    });

    expect(review.toSnapshot()).toMatchObject({
      status: "approved",
      reviewer: "Finance Lead",
      decisionReason: "Forecast assumptions accepted.",
      submittedAt: "2026-07-06T01:00:00.000Z",
      approvedAt: "2026-07-06T02:00:00.000Z",
    });
  });

  it("submits and rejects a forecast review", () => {
    const review = createReview();

    review.submit("2026-07-06T01:00:00.000Z");
    review.reject({
      reviewer: "Finance Lead",
      reason: "Revenue baseline needs correction.",
      decidedAt: "2026-07-06T02:00:00.000Z",
    });

    expect(review.toSnapshot()).toMatchObject({
      status: "rejected",
      reviewer: "Finance Lead",
      decisionReason: "Revenue baseline needs correction.",
      rejectedAt: "2026-07-06T02:00:00.000Z",
    });
  });

  it("archives and rejects invalid lifecycle transitions", () => {
    const review = createReview();

    expect(() =>
      review.approve({
        reviewer: "Finance Lead",
        decidedAt: "2026-07-06T01:00:00.000Z",
      })
    ).toThrow(
      "Only pending_review revenue forecast reviews can transition to approved."
    );

    review.archive("2026-07-06T02:00:00.000Z");

    expect(() => review.submit("2026-07-06T03:00:00.000Z")).toThrow(
      "Archived revenue forecast reviews cannot be mutated."
    );
  });
});

describe("InMemoryRevenueForecastReviewRepository", () => {
  it("saves, retrieves, and filters reviews", async () => {
    const repository = new InMemoryRevenueForecastReviewRepository();
    const review = createReview();
    review.submit("2026-07-06T01:00:00.000Z");

    await repository.save(review);

    expect(await repository.exists(reviewId)).toBe(true);
    expect((await repository.findById(reviewId))?.toSnapshot()).toEqual(
      review.toSnapshot()
    );
    expect(await repository.findByBusinessId(businessId)).toHaveLength(1);
    expect(await repository.findByRevenueTargetId(revenueTargetId)).toHaveLength(1);
    expect(await repository.findByStatus(businessId, "pending_review")).toHaveLength(1);
  });
});
