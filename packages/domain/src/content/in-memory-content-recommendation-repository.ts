import type { BusinessId } from "@nextshift/shared";
import type { ContentId } from ".";
import type { ContentInsightSetId } from "./insight";
import type { ContentPerformanceId } from "./performance";
import { ContentRecommendationSet } from "./recommendation";
import type {
  ContentRecommendationSetId,
  ContentRecommendationSetSnapshot,
  ContentRecommendationSnapshot,
} from "./recommendation";
import type { ContentVariantSetId } from "./variant";
import type { ContentRecommendationRepository } from "./content-recommendation-repository";

export class InMemoryContentRecommendationRepository
  implements ContentRecommendationRepository
{
  private readonly recommendationSets = new Map<
    ContentRecommendationSetId,
    ContentRecommendationSetSnapshot
  >();

  async save(recommendationSet: ContentRecommendationSet): Promise<void> {
    const snapshot = recommendationSet.toSnapshot();
    this.recommendationSets.set(
      snapshot.recommendationSetId,
      cloneSnapshot(snapshot)
    );
  }

  async findById(
    recommendationSetId: ContentRecommendationSetId
  ): Promise<ContentRecommendationSet | null> {
    const snapshot = this.recommendationSets.get(recommendationSetId);
    return snapshot ? ContentRecommendationSet.rehydrate(snapshot) : null;
  }

  async findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly ContentRecommendationSet[]> {
    return this.search((snapshot) => snapshot.businessId === businessId);
  }

  async findByInsightSetId(
    insightSetId: ContentInsightSetId
  ): Promise<ContentRecommendationSet | null> {
    const snapshot = [...this.recommendationSets.values()].find(
      (candidate) => candidate.insightSetId === insightSetId
    );

    return snapshot ? ContentRecommendationSet.rehydrate(snapshot) : null;
  }

  async findByPerformanceId(
    performanceId: ContentPerformanceId
  ): Promise<readonly ContentRecommendationSet[]> {
    return this.search((snapshot) => snapshot.performanceId === performanceId);
  }

  async findByVariantSetId(
    variantSetId: ContentVariantSetId
  ): Promise<readonly ContentRecommendationSet[]> {
    return this.search((snapshot) => snapshot.variantSetId === variantSetId);
  }

  async findByContentId(
    contentId: ContentId
  ): Promise<readonly ContentRecommendationSet[]> {
    return this.search((snapshot) => snapshot.contentId === contentId);
  }

  async listRecommendations(
    recommendationSetId: ContentRecommendationSetId
  ): Promise<readonly ContentRecommendationSnapshot[]> {
    return cloneRecommendations(
      this.recommendationSets.get(recommendationSetId)?.recommendations ?? []
    );
  }

  async exists(
    recommendationSetId: ContentRecommendationSetId
  ): Promise<boolean> {
    return this.recommendationSets.has(recommendationSetId);
  }

  private search(
    predicate: (snapshot: ContentRecommendationSetSnapshot) => boolean
  ): readonly ContentRecommendationSet[] {
    return [...this.recommendationSets.values()]
      .filter(predicate)
      .sort(compareRecommendationSets)
      .map((snapshot) => ContentRecommendationSet.rehydrate(snapshot));
  }
}

function compareRecommendationSets(
  left: ContentRecommendationSetSnapshot,
  right: ContentRecommendationSetSnapshot
): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

function cloneSnapshot(
  snapshot: ContentRecommendationSetSnapshot
): ContentRecommendationSetSnapshot {
  return {
    ...snapshot,
    recommendations: cloneRecommendations(snapshot.recommendations),
  };
}

function cloneRecommendations(
  recommendations: readonly ContentRecommendationSnapshot[]
): readonly ContentRecommendationSnapshot[] {
  return Object.freeze(
    recommendations.map((recommendation) => ({ ...recommendation }))
  );
}
