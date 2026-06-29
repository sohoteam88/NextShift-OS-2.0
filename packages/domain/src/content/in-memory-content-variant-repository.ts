import type { BusinessId } from "@nextshift/shared";
import type { ContentId } from ".";
import type { ContentPlanId } from "./plan";
import { ContentVariantSet } from "./variant";
import type {
  ContentVariantSetId,
  ContentVariantSetSnapshot,
  ContentVariantSnapshot,
} from "./variant";
import type { ContentVariantRepository } from "./content-variant-repository";

export class InMemoryContentVariantRepository
  implements ContentVariantRepository
{
  private readonly variantSets = new Map<
    ContentVariantSetId,
    ContentVariantSetSnapshot
  >();

  async save(variantSet: ContentVariantSet): Promise<void> {
    const snapshot = variantSet.toSnapshot();
    this.variantSets.set(snapshot.variantSetId, cloneSnapshot(snapshot));
  }

  async findById(
    variantSetId: ContentVariantSetId
  ): Promise<ContentVariantSet | null> {
    const snapshot = this.variantSets.get(variantSetId);
    return snapshot ? ContentVariantSet.rehydrate(snapshot) : null;
  }

  async findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly ContentVariantSet[]> {
    return this.search((snapshot) => snapshot.businessId === businessId);
  }

  async findByPlanId(
    planId: ContentPlanId
  ): Promise<readonly ContentVariantSet[]> {
    return this.search((snapshot) => snapshot.planId === planId);
  }

  async findByContentId(
    contentId: ContentId
  ): Promise<readonly ContentVariantSet[]> {
    return this.search((snapshot) => snapshot.contentId === contentId);
  }

  async listVariants(
    variantSetId: ContentVariantSetId
  ): Promise<readonly ContentVariantSnapshot[]> {
    return cloneVariants(this.variantSets.get(variantSetId)?.variants ?? []);
  }

  async exists(variantSetId: ContentVariantSetId): Promise<boolean> {
    return this.variantSets.has(variantSetId);
  }

  private search(
    predicate: (snapshot: ContentVariantSetSnapshot) => boolean
  ): readonly ContentVariantSet[] {
    return [...this.variantSets.values()]
      .filter(predicate)
      .sort(compareVariantSets)
      .map((snapshot) => ContentVariantSet.rehydrate(snapshot));
  }
}

function compareVariantSets(
  left: ContentVariantSetSnapshot,
  right: ContentVariantSetSnapshot
): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

function cloneSnapshot(
  snapshot: ContentVariantSetSnapshot
): ContentVariantSetSnapshot {
  return {
    ...snapshot,
    variants: cloneVariants(snapshot.variants),
  };
}

function cloneVariants(
  variants: readonly ContentVariantSnapshot[]
): readonly ContentVariantSnapshot[] {
  return Object.freeze(variants.map((variant) => ({ ...variant })));
}
