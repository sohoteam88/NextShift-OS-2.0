import type { BusinessId } from "@nextshift/shared";
import type { ContentId } from ".";
import { ContentInsightSet } from "./insight";
import type {
  ContentInsightSetId,
  ContentInsightSetSnapshot,
  ContentInsightSnapshot,
} from "./insight";
import type { ContentPerformanceId } from "./performance";
import type { ContentVariantSetId } from "./variant";
import type { ContentInsightRepository } from "./content-insight-repository";

export class InMemoryContentInsightRepository
  implements ContentInsightRepository
{
  private readonly insightSets = new Map<
    ContentInsightSetId,
    ContentInsightSetSnapshot
  >();

  async save(insightSet: ContentInsightSet): Promise<void> {
    const snapshot = insightSet.toSnapshot();
    this.insightSets.set(snapshot.insightSetId, cloneSnapshot(snapshot));
  }

  async findById(
    insightSetId: ContentInsightSetId
  ): Promise<ContentInsightSet | null> {
    const snapshot = this.insightSets.get(insightSetId);
    return snapshot ? ContentInsightSet.rehydrate(snapshot) : null;
  }

  async findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly ContentInsightSet[]> {
    return this.search((snapshot) => snapshot.businessId === businessId);
  }

  async findByPerformanceId(
    performanceId: ContentPerformanceId
  ): Promise<ContentInsightSet | null> {
    const snapshot = [...this.insightSets.values()].find(
      (candidate) => candidate.performanceId === performanceId
    );

    return snapshot ? ContentInsightSet.rehydrate(snapshot) : null;
  }

  async findByVariantSetId(
    variantSetId: ContentVariantSetId
  ): Promise<readonly ContentInsightSet[]> {
    return this.search((snapshot) => snapshot.variantSetId === variantSetId);
  }

  async findByContentId(
    contentId: ContentId
  ): Promise<readonly ContentInsightSet[]> {
    return this.search((snapshot) => snapshot.contentId === contentId);
  }

  async listInsights(
    insightSetId: ContentInsightSetId
  ): Promise<readonly ContentInsightSnapshot[]> {
    return cloneInsights(this.insightSets.get(insightSetId)?.insights ?? []);
  }

  async exists(insightSetId: ContentInsightSetId): Promise<boolean> {
    return this.insightSets.has(insightSetId);
  }

  private search(
    predicate: (snapshot: ContentInsightSetSnapshot) => boolean
  ): readonly ContentInsightSet[] {
    return [...this.insightSets.values()]
      .filter(predicate)
      .sort(compareInsightSets)
      .map((snapshot) => ContentInsightSet.rehydrate(snapshot));
  }
}

function compareInsightSets(
  left: ContentInsightSetSnapshot,
  right: ContentInsightSetSnapshot
): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

function cloneSnapshot(
  snapshot: ContentInsightSetSnapshot
): ContentInsightSetSnapshot {
  return {
    ...snapshot,
    insights: cloneInsights(snapshot.insights),
  };
}

function cloneInsights(
  insights: readonly ContentInsightSnapshot[]
): readonly ContentInsightSnapshot[] {
  return Object.freeze(
    insights.map((insight) => ({
      ...insight,
      evidence: { ...insight.evidence },
    }))
  );
}
