import type { BusinessId } from "@nextshift/shared";
import type {
  AnalyticsInsightReview,
  AnalyticsInsightReviewCategory,
  AnalyticsInsightReviewId,
  AnalyticsInsightReviewPriority,
  AnalyticsInsightReviewStatus,
} from "./analytics-insight-review";

export interface AnalyticsInsightReviewRepository {
  save(review: AnalyticsInsightReview): Promise<void>;
  findById(
    reviewId: AnalyticsInsightReviewId
  ): Promise<AnalyticsInsightReview | null>;
  findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly AnalyticsInsightReview[]>;
  findByStatus(
    businessId: BusinessId,
    status: AnalyticsInsightReviewStatus
  ): Promise<readonly AnalyticsInsightReview[]>;
  findByPriority(
    businessId: BusinessId,
    priority: AnalyticsInsightReviewPriority
  ): Promise<readonly AnalyticsInsightReview[]>;
  findByCategory(
    businessId: BusinessId,
    category: AnalyticsInsightReviewCategory
  ): Promise<readonly AnalyticsInsightReview[]>;
  exists(reviewId: AnalyticsInsightReviewId): Promise<boolean>;
}
