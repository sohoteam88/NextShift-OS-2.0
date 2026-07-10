import type { BusinessId, Timestamp } from "@nextshift/shared";

export type OpportunityEvaluationEventType =
  | "OpportunityEvaluationCreated"
  | "OpportunityEvaluated"
  | "OpportunityAccepted"
  | "OpportunityRejected"
  | "OpportunityEvaluationArchived";

export type OpportunityEvaluationPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export interface OpportunityEvaluationSourcePayload {
  readonly type: "lead" | "customer" | "content" | "campaign" | "manual" | "system";
  readonly referenceId: string;
  readonly summary: string;
}

export interface OpportunityEvaluationScorePayload {
  readonly marketFit: number;
  readonly businessValue: number;
  readonly urgency: number;
  readonly effort: number;
  readonly confidence: number;
  readonly total: number;
  readonly priority: OpportunityEvaluationPriority;
}

export interface OpportunityEvaluationCreatedPayload {
  readonly evaluationId: string;
  readonly businessId: BusinessId;
  readonly title: string;
  readonly summary: string;
  readonly source: OpportunityEvaluationSourcePayload;
  readonly createdAt: Timestamp;
}

export interface OpportunityEvaluatedPayload {
  readonly evaluationId: string;
  readonly score: OpportunityEvaluationScorePayload;
  readonly evaluatedAt: Timestamp;
}

export interface OpportunityAcceptedPayload {
  readonly evaluationId: string;
  readonly reason?: string;
  readonly acceptedAt: Timestamp;
}

export interface OpportunityRejectedPayload {
  readonly evaluationId: string;
  readonly reason?: string;
  readonly rejectedAt: Timestamp;
}

export interface OpportunityEvaluationArchivedPayload {
  readonly evaluationId: string;
  readonly archivedAt: Timestamp;
}
