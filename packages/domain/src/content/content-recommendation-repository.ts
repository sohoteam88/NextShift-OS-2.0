import type { BusinessId } from "@nextshift/shared";
import type { ContentId } from ".";
import type { ContentInsightSetId } from "./insight";
import type { ContentPerformanceId } from "./performance";
import type { ContentVariantSetId } from "./variant";
import type {
  ContentRecommendationSet,
  ContentRecommendationSetId,
  ContentRecommendationSnapshot,
} from "./recommendation";

export interface ContentRecommendationRepository {
  save(recommendationSet: ContentRecommendationSet): Promise<void>;
  findById(
    recommendationSetId: ContentRecommendationSetId
  ): Promise<ContentRecommendationSet | null>;
  findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly ContentRecommendationSet[]>;
  findByInsightSetId(
    insightSetId: ContentInsightSetId
  ): Promise<ContentRecommendationSet | null>;
  findByPerformanceId(
    performanceId: ContentPerformanceId
  ): Promise<readonly ContentRecommendationSet[]>;
  findByVariantSetId(
    variantSetId: ContentVariantSetId
  ): Promise<readonly ContentRecommendationSet[]>;
  findByContentId(
    contentId: ContentId
  ): Promise<readonly ContentRecommendationSet[]>;
  listRecommendations(
    recommendationSetId: ContentRecommendationSetId
  ): Promise<readonly ContentRecommendationSnapshot[]>;
  exists(recommendationSetId: ContentRecommendationSetId): Promise<boolean>;
}
