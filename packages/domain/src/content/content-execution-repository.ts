import type { BusinessId } from "@nextshift/shared";
import type { ContentId } from ".";
import type { ContentExecution, ContentExecutionId } from "./execution";
import type {
  ContentRecommendationId,
  ContentRecommendationSetId,
} from "./recommendation";
import type { ContentVariantSetId } from "./variant";

export interface ContentExecutionRepository {
  save(execution: ContentExecution): Promise<void>;
  findById(executionId: ContentExecutionId): Promise<ContentExecution | null>;
  findByBusinessId(businessId: BusinessId): Promise<readonly ContentExecution[]>;
  findByRecommendationSetId(
    recommendationSetId: ContentRecommendationSetId
  ): Promise<readonly ContentExecution[]>;
  findByRecommendationId(
    recommendationId: ContentRecommendationId
  ): Promise<readonly ContentExecution[]>;
  findActiveByRecommendationId(
    recommendationId: ContentRecommendationId
  ): Promise<ContentExecution | null>;
  findByVariantSetId(
    variantSetId: ContentVariantSetId
  ): Promise<readonly ContentExecution[]>;
  findByContentId(contentId: ContentId): Promise<readonly ContentExecution[]>;
  findPendingByBusinessId(
    businessId: BusinessId
  ): Promise<readonly ContentExecution[]>;
  exists(executionId: ContentExecutionId): Promise<boolean>;
}
