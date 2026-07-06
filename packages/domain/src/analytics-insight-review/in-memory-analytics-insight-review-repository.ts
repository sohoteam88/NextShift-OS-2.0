import type { BusinessId } from "@nextshift/shared";
import { AnalyticsInsightReview } from "./analytics-insight-review";
import type {
  AnalyticsInsightReviewCategory,
  AnalyticsInsightReviewId,
  AnalyticsInsightReviewPriority,
  AnalyticsInsightReviewSnapshot,
  AnalyticsInsightReviewStatus,
} from "./analytics-insight-review";
import type { AnalyticsInsightReviewRepository } from "./analytics-insight-review-repository";

export class InMemoryAnalyticsInsightReviewRepository
  implements AnalyticsInsightReviewRepository
{
  private readonly reviews = new Map<
    AnalyticsInsightReviewId,
    AnalyticsInsightReviewSnapshot
  >();

  async save(review: AnalyticsInsightReview): Promise<void> {
    const snapshot = review.toSnapshot();
    this.reviews.set(snapshot.reviewId, cloneSnapshot(snapshot));
  }

  async findById(
    reviewId: AnalyticsInsightReviewId
  ): Promise<AnalyticsInsightReview | null> {
    const snapshot = this.reviews.get(reviewId);
    return snapshot ? AnalyticsInsightReview.rehydrate(snapshot) : null;
  }

  async findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly AnalyticsInsightReview[]> {
    return this.search((snapshot) => snapshot.businessId === businessId);
  }

  async findByStatus(
    businessId: BusinessId,
    status: AnalyticsInsightReviewStatus
  ): Promise<readonly AnalyticsInsightReview[]> {
    return this.search(
      (snapshot) =>
        snapshot.businessId === businessId && snapshot.status === status
    );
  }

  async findByPriority(
    businessId: BusinessId,
    priority: AnalyticsInsightReviewPriority
  ): Promise<readonly AnalyticsInsightReview[]> {
    return this.search(
      (snapshot) =>
        snapshot.businessId === businessId && snapshot.priority === priority
    );
  }

  async findByCategory(
    businessId: BusinessId,
    category: AnalyticsInsightReviewCategory
  ): Promise<readonly AnalyticsInsightReview[]> {
    return this.search(
      (snapshot) =>
        snapshot.businessId === businessId && snapshot.category === category
    );
  }

  async exists(reviewId: AnalyticsInsightReviewId): Promise<boolean> {
    return this.reviews.has(reviewId);
  }

  private search(
    predicate: (snapshot: AnalyticsInsightReviewSnapshot) => boolean
  ): readonly AnalyticsInsightReview[] {
    return [...this.reviews.values()]
      .filter(predicate)
      .sort(compareReviews)
      .map((snapshot) => AnalyticsInsightReview.rehydrate(snapshot));
  }
}

function compareReviews(
  left: AnalyticsInsightReviewSnapshot,
  right: AnalyticsInsightReviewSnapshot
): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

function cloneSnapshot(
  snapshot: AnalyticsInsightReviewSnapshot
): AnalyticsInsightReviewSnapshot {
  return {
    ...snapshot,
    sources: Object.freeze(snapshot.sources.map((source) => ({ ...source }))),
  };
}
