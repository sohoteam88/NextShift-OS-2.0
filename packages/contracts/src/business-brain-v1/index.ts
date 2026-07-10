import type { BusinessId, Timestamp } from "@nextshift/shared";

export type BusinessBrainV1LifecycleStatus =
  | "draft"
  | "assessed"
  | "interpreted"
  | "superseded"
  | "archived";

export type BusinessBrainV1EvidenceSource =
  | "business-twin"
  | "brand-dna"
  | "knowledge-node"
  | "story"
  | "business-memory"
  | "content-memory"
  | "customer-memory"
  | "timeline-event"
  | "learning"
  | "reflection";

export type BusinessBrainV1InsightCategory =
  | "strength"
  | "constraint"
  | "gap"
  | "opportunity-signal"
  | "risk-signal"
  | "readiness";

export type BusinessBrainV1InsightPriority = "low" | "medium" | "high";

export interface BusinessBrainV1EvidencePayload {
  readonly source: BusinessBrainV1EvidenceSource;
  readonly recordId: string;
  readonly summary: string;
}

export interface BusinessBrainV1UnderstandingPayload {
  readonly summary: string;
  readonly strengths: readonly string[];
  readonly constraints: readonly string[];
  readonly missingInformation: readonly string[];
  readonly contradictions: readonly string[];
  readonly confidence: number;
  readonly evidence: readonly BusinessBrainV1EvidencePayload[];
}

export interface BusinessBrainV1InsightPayload {
  readonly insightId: string;
  readonly category: BusinessBrainV1InsightCategory;
  readonly priority: BusinessBrainV1InsightPriority;
  readonly title: string;
  readonly summary: string;
  readonly rationale: string;
  readonly confidence: number;
  readonly evidence: readonly BusinessBrainV1EvidencePayload[];
  readonly createdAt: Timestamp;
}

export interface BusinessBrainV1StateAssessmentPayload {
  readonly readinessScore: number;
  readonly operatingHealth: "weak" | "developing" | "strong";
  readonly strategicClarity: "low" | "medium" | "high";
  readonly customerClarity: "low" | "medium" | "high";
  readonly contentReadiness: "low" | "medium" | "high";
  readonly knowledgeCompleteness: "low" | "medium" | "high";
  readonly gaps: readonly string[];
  readonly constraints: readonly string[];
}

export interface BusinessBrainV1SummaryPayload {
  readonly brainId: string;
  readonly businessId: BusinessId;
  readonly foundationId: string;
  readonly lifecycleStatus: BusinessBrainV1LifecycleStatus;
  readonly understanding: BusinessBrainV1UnderstandingPayload;
  readonly insights: readonly BusinessBrainV1InsightPayload[];
  readonly stateAssessment: BusinessBrainV1StateAssessmentPayload;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export type BusinessBrainV1EventType =
  | "BusinessBrainV1Created"
  | "BusinessBrainV1Superseded"
  | "BusinessBrainV1Archived";

export interface BusinessBrainV1CreatedPayload {
  readonly brainId: string;
  readonly businessId: BusinessId;
  readonly foundationId: string;
  readonly insightCount: number;
  readonly createdAt: Timestamp;
}

export interface BusinessBrainV1SupersededPayload {
  readonly brainId: string;
  readonly supersededAt: Timestamp;
}

export interface BusinessBrainV1ArchivedPayload {
  readonly brainId: string;
  readonly archivedAt: Timestamp;
}
