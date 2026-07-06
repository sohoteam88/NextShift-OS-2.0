import type { BusinessId } from "@nextshift/shared";
import type { RevenueTargetId } from "../revenue-target";
import type {
  RevenueForecastReview,
  RevenueForecastReviewId,
  RevenueForecastReviewStatus,
} from "./revenue-forecast-review";

export interface RevenueForecastReviewRepository {
  save(review: RevenueForecastReview): Promise<void>;
  findById(reviewId: RevenueForecastReviewId): Promise<RevenueForecastReview | null>;
  findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly RevenueForecastReview[]>;
  findByRevenueTargetId(
    revenueTargetId: RevenueTargetId
  ): Promise<readonly RevenueForecastReview[]>;
  findByStatus(
    businessId: BusinessId,
    status: RevenueForecastReviewStatus
  ): Promise<readonly RevenueForecastReview[]>;
  exists(reviewId: RevenueForecastReviewId): Promise<boolean>;
}
