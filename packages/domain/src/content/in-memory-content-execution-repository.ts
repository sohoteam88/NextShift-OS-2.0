import type { BusinessId } from "@nextshift/shared";
import type { ContentId } from ".";
import type { ContentExecutionRepository } from "./content-execution-repository";
import { ContentExecution } from "./execution";
import type {
  ContentExecutionId,
  ContentExecutionSnapshot,
} from "./execution";
import type {
  ContentRecommendationId,
  ContentRecommendationSetId,
} from "./recommendation";
import type { ContentVariantSetId } from "./variant";

export class InMemoryContentExecutionRepository
  implements ContentExecutionRepository
{
  private readonly executions = new Map<
    ContentExecutionId,
    ContentExecutionSnapshot
  >();

  async save(execution: ContentExecution): Promise<void> {
    const snapshot = execution.toSnapshot();
    this.executions.set(snapshot.executionId, cloneSnapshot(snapshot));
  }

  async findById(
    executionId: ContentExecutionId
  ): Promise<ContentExecution | null> {
    const snapshot = this.executions.get(executionId);
    return snapshot ? ContentExecution.rehydrate(snapshot) : null;
  }

  async findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly ContentExecution[]> {
    return this.search((snapshot) => snapshot.businessId === businessId);
  }

  async findByRecommendationSetId(
    recommendationSetId: ContentRecommendationSetId
  ): Promise<readonly ContentExecution[]> {
    return this.search(
      (snapshot) => snapshot.recommendationSetId === recommendationSetId
    );
  }

  async findByRecommendationId(
    recommendationId: ContentRecommendationId
  ): Promise<readonly ContentExecution[]> {
    return this.search(
      (snapshot) => snapshot.recommendationId === recommendationId
    );
  }

  async findActiveByRecommendationId(
    recommendationId: ContentRecommendationId
  ): Promise<ContentExecution | null> {
    const snapshot = [...this.executions.values()].find(
      (candidate) =>
        candidate.recommendationId === recommendationId &&
        ["planned", "scheduled", "in_progress"].includes(candidate.status)
    );

    return snapshot ? ContentExecution.rehydrate(snapshot) : null;
  }

  async findByVariantSetId(
    variantSetId: ContentVariantSetId
  ): Promise<readonly ContentExecution[]> {
    return this.search((snapshot) => snapshot.variantSetId === variantSetId);
  }

  async findByContentId(
    contentId: ContentId
  ): Promise<readonly ContentExecution[]> {
    return this.search((snapshot) => snapshot.contentId === contentId);
  }

  async findPendingByBusinessId(
    businessId: BusinessId
  ): Promise<readonly ContentExecution[]> {
    return this.search(
      (snapshot) =>
        snapshot.businessId === businessId &&
        ["planned", "scheduled", "in_progress"].includes(snapshot.status)
    );
  }

  async exists(executionId: ContentExecutionId): Promise<boolean> {
    return this.executions.has(executionId);
  }

  private search(
    predicate: (snapshot: ContentExecutionSnapshot) => boolean
  ): readonly ContentExecution[] {
    return [...this.executions.values()]
      .filter(predicate)
      .sort(compareExecutions)
      .map((snapshot) => ContentExecution.rehydrate(snapshot));
  }
}

function compareExecutions(
  left: ContentExecutionSnapshot,
  right: ContentExecutionSnapshot
): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

function cloneSnapshot(
  snapshot: ContentExecutionSnapshot
): ContentExecutionSnapshot {
  return { ...snapshot };
}
