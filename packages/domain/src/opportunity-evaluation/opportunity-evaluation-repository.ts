import type { BusinessId } from "@nextshift/shared";
import type {
  OpportunityEvaluation,
  OpportunityEvaluationId,
  OpportunityEvaluationStatus,
  OpportunityEvaluationPriority,
} from "./opportunity-evaluation";

export interface OpportunityEvaluationRepository {
  save(evaluation: OpportunityEvaluation): Promise<void>;
  findById(
    evaluationId: OpportunityEvaluationId
  ): Promise<OpportunityEvaluation | null>;
  findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly OpportunityEvaluation[]>;
  findByStatus(
    businessId: BusinessId,
    status: OpportunityEvaluationStatus
  ): Promise<readonly OpportunityEvaluation[]>;
  findByPriority(
    businessId: BusinessId,
    priority: OpportunityEvaluationPriority
  ): Promise<readonly OpportunityEvaluation[]>;
  exists(evaluationId: OpportunityEvaluationId): Promise<boolean>;
}
