import type { BusinessId, Timestamp } from "@nextshift/shared";

export type DecisionRecommendationCategory =
  | "opportunity"
  | "gap"
  | "health"
  | "focus"
  | "learning";

export type DecisionRecommendationPriority = "low" | "medium" | "high" | "critical";

export type DecisionLifecycleStatus =
  | "proposed"
  | "reviewed"
  | "accepted"
  | "rejected"
  | "superseded"
  | "archived";

export type DecisionOpportunityType =
  | "growth"
  | "customer"
  | "content"
  | "operational"
  | "strategic";

export interface DecisionEvidencePayload {
  readonly source: string;
  readonly recordId: string;
  readonly summary: string;
}

export interface DecisionPriorityScorePayload {
  readonly businessImpact: number;
  readonly urgency: number;
  readonly confidence: number;
  readonly effort: number;
  readonly risk: number;
  readonly learningValue: number;
  readonly total: number;
  readonly priority: DecisionRecommendationPriority;
}

export interface DecisionConfidenceScorePayload {
  readonly score: number;
  readonly evidenceQuality: number;
  readonly sourceCoverage: number;
  readonly uncertaintyPenalty: number;
  readonly explanation: string;
}

export interface ExplainableRecommendationPayload {
  readonly reason: string;
  readonly expectedBusinessValue: string;
  readonly tradeoffs: readonly string[];
  readonly riskNotes: readonly string[];
  readonly dependencyNotes: readonly string[];
  readonly evidence: readonly DecisionEvidencePayload[];
}

export interface DecisionRecommendationPayload {
  readonly recommendationId: string;
  readonly category: DecisionRecommendationCategory;
  readonly title: string;
  readonly summary: string;
  readonly recommendedAction: string;
  readonly priorityScore: DecisionPriorityScorePayload;
  readonly confidenceScore: DecisionConfidenceScorePayload;
  readonly explanation: ExplainableRecommendationPayload;
  readonly lifecycleStatus: DecisionLifecycleStatus;
  readonly createdAt: Timestamp;
  readonly reviewedAt?: Timestamp;
  readonly acceptedAt?: Timestamp;
  readonly rejectedAt?: Timestamp;
  readonly supersededAt?: Timestamp;
  readonly archivedAt?: Timestamp;
}

export interface DecisionOpportunitySignalPayload {
  readonly opportunityId: string;
  readonly type: DecisionOpportunityType;
  readonly title: string;
  readonly valueSignal: string;
  readonly expectedNextAction: string;
  readonly confidence: number;
  readonly evidence: readonly DecisionEvidencePayload[];
}

export interface DecisionGapSignalPayload {
  readonly gapId: string;
  readonly title: string;
  readonly missingInformation: string;
  readonly recommendedFollowUp: string;
  readonly evidence: readonly DecisionEvidencePayload[];
}

export interface BusinessHealthEvaluationPayload {
  readonly operatingHealth: "weak" | "developing" | "strong";
  readonly readinessScore: number;
  readonly strategicClarity: "low" | "medium" | "high";
  readonly customerClarity: "low" | "medium" | "high";
  readonly contentReadiness: "low" | "medium" | "high";
  readonly knowledgeCompleteness: "low" | "medium" | "high";
  readonly summary: string;
}

export interface AIBusinessCoachGuidancePayload {
  readonly prompt: string;
  readonly tradeoffExplanation: string;
  readonly clarifyingQuestion: string;
  readonly suggestedUserReview: string;
}

export interface DecisionEngineV1SummaryPayload {
  readonly engineId: string;
  readonly businessId: BusinessId;
  readonly brainId: string;
  readonly recommendations: readonly DecisionRecommendationPayload[];
  readonly opportunities: readonly DecisionOpportunitySignalPayload[];
  readonly gaps: readonly DecisionGapSignalPayload[];
  readonly healthEvaluation: BusinessHealthEvaluationPayload;
  readonly coachGuidance: AIBusinessCoachGuidancePayload;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export type DecisionEngineV1EventType =
  | "DecisionEngineV1Created"
  | "DecisionRecommendationReviewed"
  | "DecisionRecommendationAccepted"
  | "DecisionRecommendationRejected"
  | "DecisionRecommendationSuperseded"
  | "DecisionRecommendationArchived";

export interface DecisionEngineV1CreatedPayload {
  readonly engineId: string;
  readonly businessId: BusinessId;
  readonly brainId: string;
  readonly recommendationCount: number;
  readonly createdAt: Timestamp;
}

export interface DecisionRecommendationLifecyclePayload {
  readonly engineId: string;
  readonly recommendationId: string;
  readonly status: DecisionLifecycleStatus;
  readonly changedAt: Timestamp;
}
