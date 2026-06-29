import type { BusinessId } from "@nextshift/shared";
import type { ContentId } from ".";
import type { ContentPlanId } from "./plan";
import type {
  ContentVariantSet,
  ContentVariantSetId,
  ContentVariantSnapshot,
} from "./variant";

export interface ContentVariantRepository {
  save(variantSet: ContentVariantSet): Promise<void>;
  findById(
    variantSetId: ContentVariantSetId
  ): Promise<ContentVariantSet | null>;
  findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly ContentVariantSet[]>;
  findByPlanId(planId: ContentPlanId): Promise<readonly ContentVariantSet[]>;
  findByContentId(
    contentId: ContentId
  ): Promise<readonly ContentVariantSet[]>;
  listVariants(
    variantSetId: ContentVariantSetId
  ): Promise<readonly ContentVariantSnapshot[]>;
  exists(variantSetId: ContentVariantSetId): Promise<boolean>;
}
