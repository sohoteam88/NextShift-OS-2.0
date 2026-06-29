import type { BusinessId } from "@nextshift/shared";
import type { ContentId } from ".";
import type { ContentPerformanceId } from "./performance";
import type { ContentVariantSetId } from "./variant";
import type {
  ContentInsightSet,
  ContentInsightSetId,
  ContentInsightSnapshot,
} from "./insight";

export interface ContentInsightRepository {
  save(insightSet: ContentInsightSet): Promise<void>;
  findById(insightSetId: ContentInsightSetId): Promise<ContentInsightSet | null>;
  findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly ContentInsightSet[]>;
  findByPerformanceId(
    performanceId: ContentPerformanceId
  ): Promise<ContentInsightSet | null>;
  findByVariantSetId(
    variantSetId: ContentVariantSetId
  ): Promise<readonly ContentInsightSet[]>;
  findByContentId(contentId: ContentId): Promise<readonly ContentInsightSet[]>;
  listInsights(
    insightSetId: ContentInsightSetId
  ): Promise<readonly ContentInsightSnapshot[]>;
  exists(insightSetId: ContentInsightSetId): Promise<boolean>;
}
