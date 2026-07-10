import type { BusinessId } from "@nextshift/shared";
import { OpportunityEvaluation } from "./opportunity-evaluation";
import type {
  OpportunityEvaluationId,
  OpportunityEvaluationSnapshot,
  OpportunityEvaluationStatus,
  OpportunityEvaluationPriority,
} from "./opportunity-evaluation";
import type { OpportunityEvaluationRepository } from "./opportunity-evaluation-repository";

export class InMemoryOpportunityEvaluationRepository
  implements OpportunityEvaluationRepository
{
  private readonly evaluations = new Map<
    OpportunityEvaluationId,
    OpportunityEvaluationSnapshot
  >();

  async save(evaluation: OpportunityEvaluation): Promise<void> {
    const snapshot = evaluation.toSnapshot();
    this.evaluations.set(snapshot.evaluationId, cloneSnapshot(snapshot));
  }

  async findById(
    evaluationId: OpportunityEvaluationId
  ): Promise<OpportunityEvaluation | null> {
    const snapshot = this.evaluations.get(evaluationId);
    return snapshot ? OpportunityEvaluation.rehydrate(snapshot) : null;
  }

  async findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly OpportunityEvaluation[]> {
    return this.search((snapshot) => snapshot.businessId === businessId);
  }

  async findByStatus(
    businessId: BusinessId,
    status: OpportunityEvaluationStatus
  ): Promise<readonly OpportunityEvaluation[]> {
    return this.search(
      (snapshot) =>
        snapshot.businessId === businessId && snapshot.status === status
    );
  }

  async findByPriority(
    businessId: BusinessId,
    priority: OpportunityEvaluationPriority
  ): Promise<readonly OpportunityEvaluation[]> {
    return this.search(
      (snapshot) =>
        snapshot.businessId === businessId &&
        snapshot.score?.priority === priority
    );
  }

  async exists(evaluationId: OpportunityEvaluationId): Promise<boolean> {
    return this.evaluations.has(evaluationId);
  }

  private search(
    predicate: (snapshot: OpportunityEvaluationSnapshot) => boolean
  ): readonly OpportunityEvaluation[] {
    return [...this.evaluations.values()]
      .filter(predicate)
      .sort(compareEvaluations)
      .map((snapshot) => OpportunityEvaluation.rehydrate(snapshot));
  }
}

function compareEvaluations(
  left: OpportunityEvaluationSnapshot,
  right: OpportunityEvaluationSnapshot
): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

function cloneSnapshot(
  snapshot: OpportunityEvaluationSnapshot
): OpportunityEvaluationSnapshot {
  return {
    ...snapshot,
    source: { ...snapshot.source },
    score: snapshot.score === undefined ? undefined : { ...snapshot.score },
  };
}
