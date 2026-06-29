import type { BusinessId } from "@nextshift/shared";
import type { ContentId } from ".";
import type { ContentVariantSetId } from "./variant";
import type {
  ContentMetricSnapshot,
  ContentPerformance,
  ContentPerformanceId,
} from "./performance";

export interface ContentPerformanceRepository {
  save(performance: ContentPerformance): Promise<void>;
  findById(
    performanceId: ContentPerformanceId
  ): Promise<ContentPerformance | null>;
  findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly ContentPerformance[]>;
  findByVariantSetId(
    variantSetId: ContentVariantSetId
  ): Promise<ContentPerformance | null>;
  findByContentId(
    contentId: ContentId
  ): Promise<readonly ContentPerformance[]>;
  listMetrics(
    performanceId: ContentPerformanceId
  ): Promise<readonly ContentMetricSnapshot[]>;
  exists(performanceId: ContentPerformanceId): Promise<boolean>;
}
