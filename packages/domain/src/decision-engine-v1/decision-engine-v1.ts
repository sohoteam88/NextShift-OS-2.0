import type {
  BusinessBrainV1EvidenceReference,
  BusinessBrainV1Id,
  BusinessBrainV1Insight,
  BusinessBrainV1Snapshot,
} from "../business-brain-v1";
import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";

export type DecisionEngineV1Id = Brand<string, "DecisionEngineV1Id">;
export type DecisionRecommendationId = Brand<string, "DecisionRecommendationId">;
export type DecisionOpportunityId = Brand<string, "DecisionOpportunityId">;
export type DecisionGapId = Brand<string, "DecisionGapId">;

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

export interface DecisionPriorityScore {
  readonly businessImpact: number;
  readonly urgency: number;
  readonly confidence: number;
  readonly effort: number;
  readonly risk: number;
  readonly learningValue: number;
  readonly total: number;
  readonly priority: DecisionRecommendationPriority;
}

export interface DecisionConfidenceScore {
  readonly score: number;
  readonly evidenceQuality: number;
  readonly sourceCoverage: number;
  readonly uncertaintyPenalty: number;
  readonly explanation: string;
}

export interface ExplainableRecommendation {
  readonly reason: string;
  readonly expectedBusinessValue: string;
  readonly tradeoffs: readonly string[];
  readonly riskNotes: readonly string[];
  readonly dependencyNotes: readonly string[];
  readonly evidence: readonly BusinessBrainV1EvidenceReference[];
}

export interface DecisionRecommendation {
  readonly recommendationId: DecisionRecommendationId;
  readonly category: DecisionRecommendationCategory;
  readonly title: string;
  readonly summary: string;
  readonly recommendedAction: string;
  readonly priorityScore: DecisionPriorityScore;
  readonly confidenceScore: DecisionConfidenceScore;
  readonly explanation: ExplainableRecommendation;
  readonly lifecycleStatus: DecisionLifecycleStatus;
  readonly createdAt: Timestamp;
  readonly reviewedAt?: Timestamp;
  readonly acceptedAt?: Timestamp;
  readonly rejectedAt?: Timestamp;
  readonly supersededAt?: Timestamp;
  readonly archivedAt?: Timestamp;
}

export interface DecisionOpportunitySignal {
  readonly opportunityId: DecisionOpportunityId;
  readonly type: DecisionOpportunityType;
  readonly title: string;
  readonly valueSignal: string;
  readonly expectedNextAction: string;
  readonly confidence: number;
  readonly evidence: readonly BusinessBrainV1EvidenceReference[];
}

export interface DecisionGapSignal {
  readonly gapId: DecisionGapId;
  readonly title: string;
  readonly missingInformation: string;
  readonly recommendedFollowUp: string;
  readonly evidence: readonly BusinessBrainV1EvidenceReference[];
}

export interface BusinessHealthEvaluation {
  readonly operatingHealth: "weak" | "developing" | "strong";
  readonly readinessScore: number;
  readonly strategicClarity: "low" | "medium" | "high";
  readonly customerClarity: "low" | "medium" | "high";
  readonly contentReadiness: "low" | "medium" | "high";
  readonly knowledgeCompleteness: "low" | "medium" | "high";
  readonly summary: string;
}

export interface AIBusinessCoachGuidance {
  readonly prompt: string;
  readonly tradeoffExplanation: string;
  readonly clarifyingQuestion: string;
  readonly suggestedUserReview: string;
}

export interface DecisionEngineV1Snapshot {
  readonly engineId: DecisionEngineV1Id;
  readonly businessId: BusinessId;
  readonly brainId: BusinessBrainV1Id;
  readonly recommendations: readonly DecisionRecommendation[];
  readonly opportunities: readonly DecisionOpportunitySignal[];
  readonly gaps: readonly DecisionGapSignal[];
  readonly healthEvaluation: BusinessHealthEvaluation;
  readonly coachGuidance: AIBusinessCoachGuidance;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface CreateDecisionEngineV1Input {
  readonly engineId: DecisionEngineV1Id;
  readonly brain: BusinessBrainV1Snapshot;
  readonly createdAt: Timestamp;
}

export interface DecisionEngineV1EventMetadata {
  readonly eventId: EventId;
  readonly eventType: DecisionEngineV1EventType;
  readonly aggregateId: DecisionEngineV1Id;
  readonly aggregateType: "DecisionEngineV1";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type DecisionEngineV1EventType =
  | "DecisionEngineV1Created"
  | "DecisionRecommendationReviewed"
  | "DecisionRecommendationAccepted"
  | "DecisionRecommendationRejected"
  | "DecisionRecommendationSuperseded"
  | "DecisionRecommendationArchived";

export interface DecisionEngineV1CreatedEvent extends DecisionEngineV1EventMetadata {
  readonly eventType: "DecisionEngineV1Created";
  readonly payload: {
    readonly engineId: DecisionEngineV1Id;
    readonly businessId: BusinessId;
    readonly brainId: BusinessBrainV1Id;
    readonly recommendationCount: number;
    readonly createdAt: Timestamp;
  };
}

export interface DecisionRecommendationLifecycleEvent
  extends DecisionEngineV1EventMetadata {
  readonly eventType:
    | "DecisionRecommendationReviewed"
    | "DecisionRecommendationAccepted"
    | "DecisionRecommendationRejected"
    | "DecisionRecommendationSuperseded"
    | "DecisionRecommendationArchived";
  readonly payload: {
    readonly engineId: DecisionEngineV1Id;
    readonly recommendationId: DecisionRecommendationId;
    readonly status: DecisionLifecycleStatus;
    readonly changedAt: Timestamp;
  };
}

export type DecisionEngineV1DomainEvent =
  | DecisionEngineV1CreatedEvent
  | DecisionRecommendationLifecycleEvent;

export class DecisionEngineV1 {
  private constructor(private snapshot: DecisionEngineV1Snapshot) {}

  static create(input: CreateDecisionEngineV1Input): DecisionEngineV1 {
    const createdAt = createTimestamp(input.createdAt, "createdAt");
    const opportunities = detectDecisionOpportunities(input.engineId, input.brain);
    const gaps = detectDecisionGaps(input.engineId, input.brain);
    const healthEvaluation = evaluateBusinessHealth(input.brain);
    const recommendations = createDecisionRecommendations(
      input.engineId,
      input.brain,
      opportunities,
      gaps,
      healthEvaluation,
      createdAt
    );

    return new DecisionEngineV1({
      engineId: input.engineId,
      businessId: input.brain.businessId,
      brainId: input.brain.brainId,
      recommendations,
      opportunities,
      gaps,
      healthEvaluation,
      coachGuidance: createAIBusinessCoachGuidance(
        input.brain,
        recommendations,
        gaps
      ),
      createdAt,
      updatedAt: createdAt,
    });
  }

  static rehydrate(snapshot: DecisionEngineV1Snapshot): DecisionEngineV1 {
    validateSnapshot(snapshot);
    return new DecisionEngineV1(cloneSnapshot(snapshot));
  }

  get engineId(): DecisionEngineV1Id {
    return this.snapshot.engineId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get brainId(): BusinessBrainV1Id {
    return this.snapshot.brainId;
  }

  reviewRecommendation(
    recommendationId: DecisionRecommendationId,
    reviewedAt: Timestamp
  ): void {
    this.transitionRecommendation(recommendationId, "reviewed", reviewedAt);
  }

  acceptRecommendation(
    recommendationId: DecisionRecommendationId,
    acceptedAt: Timestamp
  ): void {
    this.transitionRecommendation(recommendationId, "accepted", acceptedAt);
  }

  rejectRecommendation(
    recommendationId: DecisionRecommendationId,
    rejectedAt: Timestamp
  ): void {
    this.transitionRecommendation(recommendationId, "rejected", rejectedAt);
  }

  supersedeRecommendation(
    recommendationId: DecisionRecommendationId,
    supersededAt: Timestamp
  ): void {
    this.transitionRecommendation(recommendationId, "superseded", supersededAt);
  }

  archiveRecommendation(
    recommendationId: DecisionRecommendationId,
    archivedAt: Timestamp
  ): void {
    this.transitionRecommendation(recommendationId, "archived", archivedAt);
  }

  toSnapshot(): DecisionEngineV1Snapshot {
    return cloneSnapshot(this.snapshot);
  }

  private transitionRecommendation(
    recommendationId: DecisionRecommendationId,
    status: DecisionLifecycleStatus,
    changedAt: Timestamp
  ): void {
    const timestamp = createTimestamp(changedAt, "changedAt");
    let found = false;
    const recommendations = this.snapshot.recommendations.map((recommendation) => {
      if (recommendation.recommendationId !== recommendationId) {
        return recommendation;
      }
      found = true;
      return {
        ...recommendation,
        lifecycleStatus: status,
        reviewedAt:
          status === "reviewed" ? timestamp : recommendation.reviewedAt,
        acceptedAt:
          status === "accepted" ? timestamp : recommendation.acceptedAt,
        rejectedAt:
          status === "rejected" ? timestamp : recommendation.rejectedAt,
        supersededAt:
          status === "superseded" ? timestamp : recommendation.supersededAt,
        archivedAt:
          status === "archived" ? timestamp : recommendation.archivedAt,
      };
    });

    if (!found) {
      throw new Error("Decision recommendation was not found.");
    }

    this.replace({
      ...this.snapshot,
      recommendations,
      updatedAt: timestamp,
    });
  }

  private replace(snapshot: DecisionEngineV1Snapshot): void {
    validateSnapshot(snapshot);
    this.snapshot = cloneSnapshot(snapshot);
  }
}

export function createDecisionPriorityScore(input: {
  readonly businessImpact: number;
  readonly urgency: number;
  readonly confidence: number;
  readonly effort: number;
  readonly risk: number;
  readonly learningValue: number;
}): DecisionPriorityScore {
  const businessImpact = createScore(input.businessImpact, "businessImpact");
  const urgency = createScore(input.urgency, "urgency");
  const confidence = createScore(input.confidence, "confidence");
  const effort = createScore(input.effort, "effort");
  const risk = createScore(input.risk, "risk");
  const learningValue = createScore(input.learningValue, "learningValue");
  const total = Math.round(
    (businessImpact * 0.3 +
      urgency * 0.2 +
      confidence * 0.2 +
      (100 - effort) * 0.1 +
      (100 - risk) * 0.1 +
      learningValue * 0.1) *
      100
  ) / 100;

  return {
    businessImpact,
    urgency,
    confidence,
    effort,
    risk,
    learningValue,
    total,
    priority: deriveDecisionPriority(total),
  };
}

export function createDecisionConfidenceScore(input: {
  readonly evidenceQuality: number;
  readonly sourceCoverage: number;
  readonly uncertaintyPenalty: number;
  readonly brainConfidence: number;
}): DecisionConfidenceScore {
  const evidenceQuality = createScore(input.evidenceQuality, "evidenceQuality");
  const sourceCoverage = createScore(input.sourceCoverage, "sourceCoverage");
  const uncertaintyPenalty = createScore(
    input.uncertaintyPenalty,
    "uncertaintyPenalty"
  );
  const brainConfidence = createScore(input.brainConfidence, "brainConfidence");
  const score = Math.max(
    0,
    Math.round(
      (evidenceQuality * 0.35 +
        sourceCoverage * 0.25 +
        brainConfidence * 0.3 -
        uncertaintyPenalty * 0.1) *
        100
    ) / 100
  );

  return {
    score,
    evidenceQuality,
    sourceCoverage,
    uncertaintyPenalty,
    explanation: `Confidence ${score} is based on evidence quality, source coverage, Business Brain confidence, and uncertainty.`,
  };
}

export function detectDecisionOpportunities(
  engineId: DecisionEngineV1Id,
  brain: BusinessBrainV1Snapshot
): readonly DecisionOpportunitySignal[] {
  const opportunityInsights = brain.insights.filter(
    (insight) =>
      insight.category === "opportunity-signal" ||
      insight.category === "readiness" ||
      insight.priority === "high"
  );

  const baseInsights =
    opportunityInsights.length > 0 ? opportunityInsights : brain.insights.slice(0, 1);

  return baseInsights.map((insight, index) => ({
    opportunityId: `${engineId}:opportunity:${index + 1}` as DecisionOpportunityId,
    type: inferOpportunityType(insight),
    title: insight.title,
    valueSignal: insight.summary,
    expectedNextAction: `Review and act on: ${insight.summary}`,
    confidence: insight.confidence,
    evidence: insight.evidence,
  }));
}

export function detectDecisionGaps(
  engineId: DecisionEngineV1Id,
  brain: BusinessBrainV1Snapshot
): readonly DecisionGapSignal[] {
  const gaps = [
    ...brain.stateAssessment.gaps,
    ...brain.understanding.missingInformation,
    ...brain.interpretation.uncertainty,
  ];

  return uniqueStrings(gaps).map((gap, index) => ({
    gapId: `${engineId}:gap:${index + 1}` as DecisionGapId,
    title: "Business context gap",
    missingInformation: gap,
    recommendedFollowUp: `Collect or clarify: ${gap}`,
    evidence: brain.understanding.evidence,
  }));
}

export function evaluateBusinessHealth(
  brain: BusinessBrainV1Snapshot
): BusinessHealthEvaluation {
  return {
    operatingHealth: brain.stateAssessment.operatingHealth,
    readinessScore: brain.stateAssessment.readinessScore,
    strategicClarity: brain.stateAssessment.strategicClarity,
    customerClarity: brain.stateAssessment.customerClarity,
    contentReadiness: brain.stateAssessment.contentReadiness,
    knowledgeCompleteness: brain.stateAssessment.knowledgeCompleteness,
    summary: `${brain.context.businessName} is ${brain.stateAssessment.operatingHealth} with readiness ${brain.stateAssessment.readinessScore}.`,
  };
}

function createDecisionRecommendations(
  engineId: DecisionEngineV1Id,
  brain: BusinessBrainV1Snapshot,
  opportunities: readonly DecisionOpportunitySignal[],
  gaps: readonly DecisionGapSignal[],
  healthEvaluation: BusinessHealthEvaluation,
  createdAt: Timestamp
): readonly DecisionRecommendation[] {
  const opportunityRecommendations = opportunities.map((opportunity, index) =>
    createRecommendation({
      recommendationId: `${engineId}:recommendation:opportunity:${index + 1}` as DecisionRecommendationId,
      category: "opportunity",
      title: `Act on ${opportunity.title}`,
      summary: opportunity.valueSignal,
      recommendedAction: opportunity.expectedNextAction,
      brain,
      evidence: opportunity.evidence,
      impact: 85,
      urgency: opportunity.confidence >= 0.8 ? 80 : 65,
      confidence: opportunity.confidence * 100,
      effort: 45,
      risk: 35,
      learningValue: 70,
      createdAt,
    })
  );

  const gapRecommendations = gaps.map((gap, index) =>
    createRecommendation({
      recommendationId: `${engineId}:recommendation:gap:${index + 1}` as DecisionRecommendationId,
      category: "gap",
      title: gap.title,
      summary: gap.missingInformation,
      recommendedAction: gap.recommendedFollowUp,
      brain,
      evidence: gap.evidence,
      impact: 70,
      urgency: 75,
      confidence: brain.understanding.confidence * 100,
      effort: 30,
      risk: 20,
      learningValue: 85,
      createdAt,
    })
  );

  const healthRecommendation = createRecommendation({
    recommendationId: `${engineId}:recommendation:health` as DecisionRecommendationId,
    category: "health",
    title: "Improve business readiness",
    summary: healthEvaluation.summary,
    recommendedAction: "Review the highest priority readiness gap before execution.",
    brain,
    evidence: brain.situationAnalysis.relevantEvidence,
    impact: 78,
    urgency: healthEvaluation.readinessScore < 75 ? 85 : 55,
    confidence: brain.understanding.confidence * 100,
    effort: 40,
    risk: 25,
    learningValue: 75,
    createdAt,
  });

  return [...opportunityRecommendations, ...gapRecommendations, healthRecommendation].sort(
    compareRecommendations
  );
}

function createRecommendation(input: {
  readonly recommendationId: DecisionRecommendationId;
  readonly category: DecisionRecommendationCategory;
  readonly title: string;
  readonly summary: string;
  readonly recommendedAction: string;
  readonly brain: BusinessBrainV1Snapshot;
  readonly evidence: readonly BusinessBrainV1EvidenceReference[];
  readonly impact: number;
  readonly urgency: number;
  readonly confidence: number;
  readonly effort: number;
  readonly risk: number;
  readonly learningValue: number;
  readonly createdAt: Timestamp;
}): DecisionRecommendation {
  const priorityScore = createDecisionPriorityScore({
    businessImpact: input.impact,
    urgency: input.urgency,
    confidence: input.confidence,
    effort: input.effort,
    risk: input.risk,
    learningValue: input.learningValue,
  });
  const confidenceScore = createDecisionConfidenceScore({
    evidenceQuality: input.evidence.length > 0 ? 85 : 45,
    sourceCoverage: Math.min(input.evidence.length * 12, 100),
    uncertaintyPenalty: input.brain.interpretation.uncertainty.length * 15,
    brainConfidence: input.brain.understanding.confidence * 100,
  });

  return {
    recommendationId: input.recommendationId,
    category: input.category,
    title: createRequiredString(input.title, "Recommendation title"),
    summary: createRequiredString(input.summary, "Recommendation summary"),
    recommendedAction: createRequiredString(
      input.recommendedAction,
      "Recommended action"
    ),
    priorityScore,
    confidenceScore,
    explanation: {
      reason: input.brain.interpretation.meaning,
      expectedBusinessValue: input.summary,
      tradeoffs: ["Acting now may require focused owner review."],
      riskNotes: input.brain.stateAssessment.constraints,
      dependencyNotes: input.brain.interpretation.downstreamImplications,
      evidence: input.evidence,
    },
    lifecycleStatus: "proposed",
    createdAt: createTimestamp(input.createdAt, "createdAt"),
  };
}

function createAIBusinessCoachGuidance(
  brain: BusinessBrainV1Snapshot,
  recommendations: readonly DecisionRecommendation[],
  gaps: readonly DecisionGapSignal[]
): AIBusinessCoachGuidance {
  const topRecommendation = recommendations[0];

  return {
    prompt:
      topRecommendation === undefined
        ? "Review the current business interpretation before deciding next steps."
        : `Start with: ${topRecommendation.recommendedAction}`,
    tradeoffExplanation:
      "Prioritizing one recommendation improves focus but may defer lower priority learning.",
    clarifyingQuestion:
      gaps[0] === undefined
        ? "Is this recommendation aligned with the current business priority?"
        : `Can you clarify: ${gaps[0].missingInformation}`,
    suggestedUserReview: brain.interpretation.rationale,
  };
}

function inferOpportunityType(
  insight: BusinessBrainV1Insight
): DecisionOpportunityType {
  if (insight.summary.toLowerCase().includes("customer")) return "customer";
  if (insight.summary.toLowerCase().includes("content")) return "content";
  if (insight.summary.toLowerCase().includes("operation")) return "operational";
  if (insight.category === "readiness") return "strategic";
  return "growth";
}

function compareRecommendations(
  left: DecisionRecommendation,
  right: DecisionRecommendation
): number {
  return right.priorityScore.total - left.priorityScore.total;
}

function deriveDecisionPriority(total: number): DecisionRecommendationPriority {
  if (total >= 85) return "critical";
  if (total >= 70) return "high";
  if (total >= 45) return "medium";
  return "low";
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function validateSnapshot(snapshot: DecisionEngineV1Snapshot): void {
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");
  snapshot.recommendations.forEach((recommendation) => {
    createRequiredString(recommendation.title, "Recommendation title");
    createRequiredString(recommendation.summary, "Recommendation summary");
    createTimestamp(recommendation.createdAt, "recommendation.createdAt");
  });
}

function cloneSnapshot(snapshot: DecisionEngineV1Snapshot): DecisionEngineV1Snapshot {
  return {
    ...snapshot,
    recommendations: snapshot.recommendations.map((recommendation) => ({
      ...recommendation,
      explanation: {
        ...recommendation.explanation,
        tradeoffs: [...recommendation.explanation.tradeoffs],
        riskNotes: [...recommendation.explanation.riskNotes],
        dependencyNotes: [...recommendation.explanation.dependencyNotes],
        evidence: recommendation.explanation.evidence.map((item) => ({ ...item })),
      },
    })),
    opportunities: snapshot.opportunities.map((opportunity) => ({
      ...opportunity,
      evidence: opportunity.evidence.map((item) => ({ ...item })),
    })),
    gaps: snapshot.gaps.map((gap) => ({
      ...gap,
      evidence: gap.evidence.map((item) => ({ ...item })),
    })),
    healthEvaluation: { ...snapshot.healthEvaluation },
    coachGuidance: { ...snapshot.coachGuidance },
  };
}

function createRequiredString(value: string, label: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`${label} is required.`);
  }
  return trimmed;
}

function createTimestamp(value: Timestamp, label: string): Timestamp {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`${label} must be a valid timestamp.`);
  }
  return value;
}

function createScore(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`${label} must be between 0 and 100.`);
  }
  return value;
}
