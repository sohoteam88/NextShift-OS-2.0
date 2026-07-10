import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  AnalyticsInsightReview,
  InMemoryAnalyticsInsightReviewRepository,
  type AnalyticsInsightReviewId,
} from "../src";

const businessId = "business-1" as BusinessId;
const reviewId = "analytics-insight-review-1" as AnalyticsInsightReviewId;
const createdAt = "2026-07-06T00:00:00.000Z";

function createReview(): AnalyticsInsightReview {
  return AnalyticsInsightReview.create({
    reviewId,
    businessId,
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
    createdAt,
  });
}

describe("AnalyticsInsightReview aggregate", () => {
  it("creates a draft analytics insight review", () => {
    const review = createReview();

    expect(review.toSnapshot()).toMatchObject({
      reviewId,
      businessId,
      title: "Campaign pipeline conversion risk",
      summary: "CRM and campaign signals show pipeline conversion is slowing.",
      category: "campaign",
      priority: "high",
      status: "draft",
      createdAt,
      updatedAt: createdAt,
    });
    expect(review.toSnapshot().sources).toHaveLength(2);
  });

  it("submits and approves an analytics insight review", () => {
    const review = createReview();

    review.submit("2026-07-06T01:00:00.000Z");
    review.approve({
      reviewer: "Operations Lead",
      reason: "Actionable for next campaign review.",
      approvedAt: "2026-07-06T02:00:00.000Z",
    });

    expect(review.toSnapshot()).toMatchObject({
      status: "approved",
      reviewer: "Operations Lead",
      approvalReason: "Actionable for next campaign review.",
      submittedAt: "2026-07-06T01:00:00.000Z",
      approvedAt: "2026-07-06T02:00:00.000Z",
    });
  });

  it("submits and dismisses an analytics insight review", () => {
    const review = createReview();

    review.submit("2026-07-06T01:00:00.000Z");
    review.dismiss({
      reviewer: "Operations Lead",
      reason: "Duplicate of existing weekly insight.",
      dismissedAt: "2026-07-06T02:00:00.000Z",
    });

    expect(review.toSnapshot()).toMatchObject({
      status: "dismissed",
      reviewer: "Operations Lead",
      dismissalReason: "Duplicate of existing weekly insight.",
      dismissedAt: "2026-07-06T02:00:00.000Z",
    });
  });

  it("archives and rejects invalid transitions", () => {
    const review = createReview();

    expect(() =>
      review.approve({
        reviewer: "Operations Lead",
        approvedAt: "2026-07-06T01:00:00.000Z",
      })
    ).toThrow(
      "Only pending_review analytics insight reviews can transition to approved."
    );

    review.archive("2026-07-06T02:00:00.000Z");

    expect(() => review.submit("2026-07-06T03:00:00.000Z")).toThrow(
      "Archived analytics insight reviews cannot be mutated."
    );
  });
});

describe("InMemoryAnalyticsInsightReviewRepository", () => {
  it("saves, retrieves, and filters reviews", async () => {
    const repository = new InMemoryAnalyticsInsightReviewRepository();
    const review = createReview();
    review.submit("2026-07-06T01:00:00.000Z");

    await repository.save(review);

    expect(await repository.exists(reviewId)).toBe(true);
    expect((await repository.findById(reviewId))?.toSnapshot()).toEqual(
      review.toSnapshot()
    );
    expect(await repository.findByBusinessId(businessId)).toHaveLength(1);
    expect(await repository.findByStatus(businessId, "pending_review")).toHaveLength(1);
    expect(await repository.findByPriority(businessId, "high")).toHaveLength(1);
    expect(await repository.findByCategory(businessId, "campaign")).toHaveLength(1);
  });
});
