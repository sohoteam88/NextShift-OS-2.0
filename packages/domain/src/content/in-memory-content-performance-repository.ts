import type { BusinessId } from "@nextshift/shared";
import type { ContentId } from ".";
import { ContentPerformance } from "./performance";
import type {
  ContentMetricSnapshot,
  ContentPerformanceId,
  ContentPerformanceSnapshot,
} from "./performance";
import type { ContentVariantSetId } from "./variant";
import type { ContentPerformanceRepository } from "./content-performance-repository";

export class InMemoryContentPerformanceRepository
  implements ContentPerformanceRepository
{
  private readonly performance = new Map<
    ContentPerformanceId,
    ContentPerformanceSnapshot
  >();

  async save(performance: ContentPerformance): Promise<void> {
    const snapshot = performance.toSnapshot();
    this.performance.set(snapshot.performanceId, cloneSnapshot(snapshot));
  }

  async findById(
    performanceId: ContentPerformanceId
  ): Promise<ContentPerformance | null> {
    const snapshot = this.performance.get(performanceId);
    return snapshot ? ContentPerformance.rehydrate(snapshot) : null;
  }

  async findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly ContentPerformance[]> {
    return this.search((snapshot) => snapshot.businessId === businessId);
  }

  async findByVariantSetId(
    variantSetId: ContentVariantSetId
  ): Promise<ContentPerformance | null> {
    const snapshot = [...this.performance.values()].find(
      (candidate) => candidate.variantSetId === variantSetId
    );

    return snapshot ? ContentPerformance.rehydrate(snapshot) : null;
  }

  async findByContentId(
    contentId: ContentId
  ): Promise<readonly ContentPerformance[]> {
    return this.search((snapshot) => snapshot.contentId === contentId);
  }

  async listMetrics(
    performanceId: ContentPerformanceId
  ): Promise<readonly ContentMetricSnapshot[]> {
    return cloneMetrics(this.performance.get(performanceId)?.metrics ?? []);
  }

  async exists(performanceId: ContentPerformanceId): Promise<boolean> {
    return this.performance.has(performanceId);
  }

  private search(
    predicate: (snapshot: ContentPerformanceSnapshot) => boolean
  ): readonly ContentPerformance[] {
    return [...this.performance.values()]
      .filter(predicate)
      .sort(comparePerformance)
      .map((snapshot) => ContentPerformance.rehydrate(snapshot));
  }
}

function comparePerformance(
  left: ContentPerformanceSnapshot,
  right: ContentPerformanceSnapshot
): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

function cloneSnapshot(
  snapshot: ContentPerformanceSnapshot
): ContentPerformanceSnapshot {
  return {
    ...snapshot,
    metrics: cloneMetrics(snapshot.metrics),
  };
}

function cloneMetrics(
  metrics: readonly ContentMetricSnapshot[]
): readonly ContentMetricSnapshot[] {
  return Object.freeze(metrics.map((metric) => ({ ...metric })));
}
