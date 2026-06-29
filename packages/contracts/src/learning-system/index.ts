import type {
  BusinessId,
  DecisionId,
  EventId,
  Result,
  TenantContext,
  Timestamp,
} from "@nextshift/shared";

export interface LearningRecord {
  readonly learningId: string;
  readonly businessId: BusinessId;
  readonly sourceEventId?: EventId;
  readonly sourceDecisionId?: DecisionId;
  readonly lesson: string;
  readonly confidence: number;
  readonly learnedAt: Timestamp;
}

export interface RecordLearningRequest {
  readonly tenant: TenantContext;
  readonly learning: LearningRecord;
}

export interface LearningSystemContract {
  recordLearning(request: RecordLearningRequest): Promise<Result<LearningRecord>>;
}
