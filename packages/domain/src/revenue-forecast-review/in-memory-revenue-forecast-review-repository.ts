import type { BusinessId } from "@nextshift/shared";
import type { RevenueTargetId } from "../revenue-target";
import { RevenueForecastReview } from "./revenue-forecast-review";
import type {
  RevenueForecastReviewId,
  RevenueForecastReviewSnapshot,
  RevenueForecastReviewStatus,
} from "./revenue-forecast-review";
import type { RevenueForecastReviewRepository } from "./revenue-forecast-review-repository";

export class InMemoryRevenueForecastReviewRepository
  implements RevenueForecastReviewRepository
{
  private readonly reviews = new Map<
    RevenueForecastReviewId,
    RevenueForecastReviewSnapshot
  >();

  async save(review: RevenueForecastReview): Promise<void> {
    const snapshot = review.toSnapshot();
    this.reviews.set(snapshot.reviewId, cloneSnapshot(snapshot));
  }

  async findById(
    reviewId: RevenueForecastReviewId
  ): Promise<RevenueForecastReview | null> {
    const snapshot = this.reviews.get(reviewId);
    return snapshot ? RevenueForecastReview.rehydrate(snapshot) : null;
  }

  async findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly RevenueForecastReview[]> {
    return this.search((snapshot) => snapshot.businessId === businessId);
  }

  async findByRevenueTargetId(
    revenueTargetId: RevenueTargetId
  ): Promise<readonly RevenueForecastReview[]> {
    return this.search(
      (snapshot) => snapshot.revenueTargetId === revenueTargetId
    );
  }

  async findByStatus(
    businessId: BusinessId,
    status: RevenueForecastReviewStatus
  ): Promise<readonly RevenueForecastReview[]> {
    return this.search(
      (snapshot) =>
        snapshot.businessId === businessId && snapshot.status === status
    );
  }

  async exists(reviewId: RevenueForecastReviewId): Promise<boolean> {
    return this.reviews.has(reviewId);
  }

  private search(
    predicate: (snapshot: RevenueForecastReviewSnapshot) => boolean
  ): readonly RevenueForecastReview[] {
    return [...this.reviews.values()]
      .filter(predicate)
      .sort(compareReviews)
      .map((snapshot) => RevenueForecastReview.rehydrate(snapshot));
  }
}

function compareReviews(
  left: RevenueForecastReviewSnapshot,
  right: RevenueForecastReviewSnapshot
): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

function cloneSnapshot(
  snapshot: RevenueForecastReviewSnapshot
): RevenueForecastReviewSnapshot {
  return {
    ...snapshot,
    forecast: {
      ...snapshot.forecast,
      targetPeriod: Object.freeze({ ...snapshot.forecast.targetPeriod }),
    },
  };
}
