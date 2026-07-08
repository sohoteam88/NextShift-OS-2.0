import type {
  BusinessBrainV1Id,
  BusinessBrainV1Snapshot,
} from "../business-brain-v1";
import type {
  BusinessFoundationId,
  BusinessFoundationSnapshot,
} from "../business-foundation";
import type {
  ConversationEngineV1Id,
  ConversationEngineV1Snapshot,
} from "../conversation-engine-v1";
import type {
  CreativePackageId,
  CreativeStudioV1Id,
  CreativeStudioV1Snapshot,
  PublishingPackageId,
} from "../creative-studio-v1";
import type {
  DecisionEngineV1Id,
  DecisionEngineV1Snapshot,
  DecisionRecommendationId,
} from "../decision-engine-v1";
import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";

export type GrowthRevenueV1Id = Brand<string, "GrowthRevenueV1Id">;
export type FunnelIntelligenceId = Brand<string, "FunnelIntelligenceId">;
export type LeadIntelligenceId = Brand<string, "LeadIntelligenceId">;
export type CrmIntelligenceId = Brand<string, "CrmIntelligenceId">;
export type OpportunityPipelineId = Brand<string, "OpportunityPipelineId">;
export type RevenueForecastId = Brand<string, "RevenueForecastId">;
export type FollowUpIntelligenceId = Brand<string, "FollowUpIntelligenceId">;
export type ConversionOptimizationId = Brand<string, "ConversionOptimizationId">;
export type GrowthRecommendationId = Brand<string, "GrowthRecommendationId">;

export type RevenueLifecycleStatus =
  | "planned"
  | "active"
  | "reviewing"
  | "forecasted"
  | "won"
  | "lost"
  | "archived";

export type LeadFitLabel = "low" | "medium" | "high";
export type OpportunityStage = "identified" | "qualified" | "proposal" | "won" | "lost";
export type ForecastReviewState = "draft" | "reviewed";
export type FollowUpStatus = "planned" | "ready" | "completed" | "deferred";
export type GrowthRecommendationStatus = "proposed" | "accepted" | "deferred";

export interface GrowthRevenueSourceContext {
  readonly foundationId: BusinessFoundationId;
  readonly brainId: BusinessBrainV1Id;
  readonly engineId: DecisionEngineV1Id;
  readonly conversationId: ConversationEngineV1Id;
  readonly creativeStudioId: CreativeStudioV1Id;
  readonly businessName: string;
  readonly audience: string;
  readonly offer: string;
  readonly recommendationIds: readonly DecisionRecommendationId[];
  readonly creativePackageIds: readonly CreativePackageId[];
  readonly publishingPackageIds: readonly PublishingPackageId[];
  readonly handoffIntent?: string;
}

export interface FunnelIntelligence {
  readonly funnelId: FunnelIntelligenceId;
  readonly offerPath: string;
  readonly stages: readonly string[];
  readonly conversionPoints: readonly string[];
  readonly followUpSteps: readonly string[];
  readonly evidenceSummaries: readonly string[];
}

export interface LeadIntelligence {
  readonly leadId: LeadIntelligenceId;
  readonly sourceReference: string;
  readonly audienceSegment: string;
  readonly fit: LeadFitLabel;
  readonly intentSignal: string;
  readonly qualificationNotes: readonly string[];
  readonly confidence: number;
  readonly nextRecommendedAction: string;
}

export interface CrmIntelligence {
  readonly crmId: CrmIntelligenceId;
  readonly stateReference: string;
  readonly leadOrCustomerState: string;
  readonly activitySummary: string;
  readonly nextStepRecommendation: string;
  readonly ownerReference?: string;
}

export interface OpportunityPipeline {
  readonly opportunityId: OpportunityPipelineId;
  readonly stage: OpportunityStage;
  readonly estimatedValue: number;
  readonly probability: number;
  readonly riskNotes: readonly string[];
  readonly expectedNextAction: string;
  readonly linkedRecommendationIds: readonly DecisionRecommendationId[];
  readonly linkedCreativePackageIds: readonly CreativePackageId[];
}

export interface RevenueForecast {
  readonly forecastId: RevenueForecastId;
  readonly forecastAmount: number;
  readonly forecastWindow: string;
  readonly confidence: number;
  readonly assumptions: readonly string[];
  readonly riskNotes: readonly string[];
  readonly opportunityIds: readonly OpportunityPipelineId[];
  readonly reviewState: ForecastReviewState;
}

export interface FollowUpIntelligence {
  readonly followUpId: FollowUpIntelligenceId;
  readonly reason: string;
  readonly targetReference: string;
  readonly suggestedTiming: string;
  readonly suggestedActionIntent: string;
  readonly rationale: string;
  readonly status: FollowUpStatus;
}

export interface ConversionOptimization {
  readonly optimizationId: ConversionOptimizationId;
  readonly bottleneck: string;
  readonly hypothesis: string;
  readonly experimentIdea: string;
  readonly expectedLift: string;
  readonly evidenceSummaries: readonly string[];
}

export interface GrowthRecommendation {
  readonly growthRecommendationId: GrowthRecommendationId;
  readonly title: string;
  readonly priority: string;
  readonly confidence: number;
  readonly expectedBusinessValue: string;
  readonly recommendedAction: string;
  readonly evidenceSummaries: readonly string[];
  readonly status: GrowthRecommendationStatus;
}

export interface GrowthRevenueIntegration {
  readonly foundationId: BusinessFoundationId;
  readonly brainId: BusinessBrainV1Id;
  readonly engineId: DecisionEngineV1Id;
  readonly conversationId: ConversationEngineV1Id;
  readonly creativeStudioId: CreativeStudioV1Id;
  readonly funnelId: FunnelIntelligenceId;
  readonly opportunityId: OpportunityPipelineId;
  readonly forecastId: RevenueForecastId;
  readonly followUpId: FollowUpIntelligenceId;
  readonly growthRecommendationIds: readonly GrowthRecommendationId[];
  readonly downstreamHandoffIntent?: string;
}

export interface GrowthRevenueV1Snapshot {
  readonly growthRevenueId: GrowthRevenueV1Id;
  readonly businessId: BusinessId;
  readonly foundationId: BusinessFoundationId;
  readonly brainId: BusinessBrainV1Id;
  readonly engineId: DecisionEngineV1Id;
  readonly conversationId: ConversationEngineV1Id;
  readonly creativeStudioId: CreativeStudioV1Id;
  readonly sourceContext: GrowthRevenueSourceContext;
  readonly funnelIntelligence: FunnelIntelligence;
  readonly leadIntelligence: LeadIntelligence;
  readonly crmIntelligence: CrmIntelligence;
  readonly opportunityPipeline: OpportunityPipeline;
  readonly revenueForecast: RevenueForecast;
  readonly followUpIntelligence: FollowUpIntelligence;
  readonly conversionOptimization: ConversionOptimization;
  readonly growthRecommendations: readonly GrowthRecommendation[];
  readonly integration: GrowthRevenueIntegration;
  readonly lifecycleStatus: RevenueLifecycleStatus;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface CreateGrowthRevenueV1Input {
  readonly growthRevenueId: GrowthRevenueV1Id;
  readonly foundation: BusinessFoundationSnapshot;
  readonly brain: BusinessBrainV1Snapshot;
  readonly decisionEngine: DecisionEngineV1Snapshot;
  readonly conversation: ConversationEngineV1Snapshot;
  readonly creativeStudio: CreativeStudioV1Snapshot;
  readonly createdAt: Timestamp;
}

export interface GrowthRevenueV1EventMetadata {
  readonly eventId: EventId;
  readonly eventType: GrowthRevenueV1EventType;
  readonly aggregateId: GrowthRevenueV1Id;
  readonly aggregateType: "GrowthRevenueV1";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type GrowthRevenueV1EventType =
  | "GrowthRevenueV1Created"
  | "GrowthRevenueLifecycleChanged";

export interface GrowthRevenueV1CreatedEvent
  extends GrowthRevenueV1EventMetadata {
  readonly eventType: "GrowthRevenueV1Created";
  readonly payload: {
    readonly growthRevenueId: GrowthRevenueV1Id;
    readonly businessId: BusinessId;
    readonly creativeStudioId: CreativeStudioV1Id;
    readonly recommendationCount: number;
    readonly createdAt: Timestamp;
  };
}

export interface GrowthRevenueV1ChangedEvent
  extends GrowthRevenueV1EventMetadata {
  readonly eventType: "GrowthRevenueLifecycleChanged";
  readonly payload: {
    readonly growthRevenueId: GrowthRevenueV1Id;
    readonly status: RevenueLifecycleStatus;
    readonly changedAt: Timestamp;
  };
}

export type GrowthRevenueV1DomainEvent =
  | GrowthRevenueV1CreatedEvent
  | GrowthRevenueV1ChangedEvent;

export class GrowthRevenueV1 {
  private constructor(private snapshot: GrowthRevenueV1Snapshot) {}

  static create(input: CreateGrowthRevenueV1Input): GrowthRevenueV1 {
    const createdAt = createTimestamp(input.createdAt, "createdAt");
    validateUpstream(
      input.foundation,
      input.brain,
      input.decisionEngine,
      input.conversation,
      input.creativeStudio
    );
    const recommendations = input.decisionEngine.recommendations.slice(0, 3);
    const ids = createIds(input.growthRevenueId);
    const evidenceSummaries = collectEvidenceSummaries(input.brain, input.decisionEngine);
    const sourceContext: GrowthRevenueSourceContext = {
      foundationId: input.foundation.foundationId,
      brainId: input.brain.brainId,
      engineId: input.decisionEngine.engineId,
      conversationId: input.conversation.conversationId,
      creativeStudioId: input.creativeStudio.creativeStudioId,
      businessName: input.foundation.twin.name,
      audience: input.foundation.twin.audience,
      offer: input.foundation.twin.offer,
      recommendationIds: recommendations.map(
        (recommendation) => recommendation.recommendationId
      ),
      creativePackageIds: input.creativeStudio.integration.creativePackageIds,
      publishingPackageIds: input.creativeStudio.integration.publishingPackageIds,
      handoffIntent:
        input.creativeStudio.integration.downstreamHandoffIntent ??
        input.conversation.approval.executionHandoffIntent,
    };
    const funnelIntelligence = createFunnelIntelligence(
      ids.funnel,
      input.foundation,
      input.creativeStudio,
      evidenceSummaries
    );
    const leadIntelligence = createLeadIntelligence(
      ids.lead,
      input.foundation,
      input.decisionEngine
    );
    const crmIntelligence = createCrmIntelligence(
      ids.crm,
      leadIntelligence,
      input.conversation
    );
    const opportunityPipeline = createOpportunityPipeline(
      ids.opportunity,
      recommendations,
      input.creativeStudio
    );
    const revenueForecast = createRevenueForecast(
      ids.forecast,
      opportunityPipeline,
      input.decisionEngine
    );
    const followUpIntelligence = createFollowUpIntelligence(
      ids.followUp,
      leadIntelligence,
      opportunityPipeline
    );
    const conversionOptimization = createConversionOptimization(
      ids.optimization,
      funnelIntelligence,
      evidenceSummaries
    );
    const growthRecommendations = createGrowthRecommendations(
      input.growthRevenueId,
      recommendations,
      conversionOptimization
    );

    return new GrowthRevenueV1({
      growthRevenueId: input.growthRevenueId,
      businessId: input.foundation.businessId,
      foundationId: input.foundation.foundationId,
      brainId: input.brain.brainId,
      engineId: input.decisionEngine.engineId,
      conversationId: input.conversation.conversationId,
      creativeStudioId: input.creativeStudio.creativeStudioId,
      sourceContext,
      funnelIntelligence,
      leadIntelligence,
      crmIntelligence,
      opportunityPipeline,
      revenueForecast,
      followUpIntelligence,
      conversionOptimization,
      growthRecommendations,
      integration: {
        foundationId: input.foundation.foundationId,
        brainId: input.brain.brainId,
        engineId: input.decisionEngine.engineId,
        conversationId: input.conversation.conversationId,
        creativeStudioId: input.creativeStudio.creativeStudioId,
        funnelId: funnelIntelligence.funnelId,
        opportunityId: opportunityPipeline.opportunityId,
        forecastId: revenueForecast.forecastId,
        followUpId: followUpIntelligence.followUpId,
        growthRecommendationIds: growthRecommendations.map(
          (recommendation) => recommendation.growthRecommendationId
        ),
        downstreamHandoffIntent: sourceContext.handoffIntent,
      },
      lifecycleStatus: "planned",
      createdAt,
      updatedAt: createdAt,
    });
  }

  static rehydrate(snapshot: GrowthRevenueV1Snapshot): GrowthRevenueV1 {
    validateSnapshot(snapshot);
    return new GrowthRevenueV1(cloneSnapshot(snapshot));
  }

  get growthRevenueId(): GrowthRevenueV1Id {
    return this.snapshot.growthRevenueId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get creativeStudioId(): CreativeStudioV1Id {
    return this.snapshot.creativeStudioId;
  }

  activate(activatedAt: Timestamp): void {
    this.transition("active", activatedAt);
  }

  review(reviewedAt: Timestamp): void {
    this.transition("reviewing", reviewedAt);
  }

  markForecasted(forecastedAt: Timestamp): void {
    const timestamp = createTimestamp(forecastedAt, "forecastedAt");
    this.replace({
      ...this.snapshot,
      revenueForecast: {
        ...this.snapshot.revenueForecast,
        reviewState: "reviewed",
      },
      lifecycleStatus: "forecasted",
      updatedAt: timestamp,
    });
  }

  markWon(wonAt: Timestamp): void {
    this.transition("won", wonAt);
  }

  markLost(lostAt: Timestamp): void {
    this.transition("lost", lostAt);
  }

  archive(archivedAt: Timestamp): void {
    this.transition("archived", archivedAt);
  }

  toSnapshot(): GrowthRevenueV1Snapshot {
    return cloneSnapshot(this.snapshot);
  }

  private transition(status: RevenueLifecycleStatus, changedAt: Timestamp): void {
    const timestamp = createTimestamp(changedAt, "changedAt");
    this.replace({
      ...this.snapshot,
      lifecycleStatus: status,
      updatedAt: timestamp,
    });
  }

  private replace(snapshot: GrowthRevenueV1Snapshot): void {
    validateSnapshot(snapshot);
    this.snapshot = cloneSnapshot(snapshot);
  }
}

function createFunnelIntelligence(
  funnelId: FunnelIntelligenceId,
  foundation: BusinessFoundationSnapshot,
  creativeStudio: CreativeStudioV1Snapshot,
  evidenceSummaries: readonly string[]
): FunnelIntelligence {
  return {
    funnelId,
    offerPath: `${foundation.twin.offer} for ${foundation.twin.audience}`,
    stages: ["awareness", "interest", "qualification", "offer", "follow-up"],
    conversionPoints: [
      creativeStudio.contentPackage.objective,
      creativeStudio.publishingPackage.channelTarget,
    ],
    followUpSteps: ["qualify lead", "confirm need", "present next action"],
    evidenceSummaries,
  };
}

function createLeadIntelligence(
  leadId: LeadIntelligenceId,
  foundation: BusinessFoundationSnapshot,
  decisionEngine: DecisionEngineV1Snapshot
): LeadIntelligence {
  return {
    leadId,
    sourceReference: decisionEngine.opportunities[0]?.opportunityId ?? "manual-lead-source",
    audienceSegment: foundation.customerMemory[0]?.segment ?? foundation.twin.audience,
    fit:
      decisionEngine.healthEvaluation.customerClarity === "high"
        ? "high"
        : "medium",
    intentSignal:
      decisionEngine.opportunities[0]?.valueSignal ??
      foundation.twin.valueProposition,
    qualificationNotes: [
      foundation.customerMemory[0]?.need ?? foundation.twin.valueProposition,
      decisionEngine.coachGuidance.suggestedUserReview,
    ],
    confidence: decisionEngine.recommendations[0]?.confidenceScore.score ?? 0.7,
    nextRecommendedAction:
      decisionEngine.recommendations[0]?.recommendedAction ??
      "Qualify the lead against the current offer.",
  };
}

function createCrmIntelligence(
  crmId: CrmIntelligenceId,
  lead: LeadIntelligence,
  conversation: ConversationEngineV1Snapshot
): CrmIntelligence {
  return {
    crmId,
    stateReference: lead.leadId,
    leadOrCustomerState: lead.fit === "high" ? "qualified" : "needs_review",
    activitySummary: conversation.strategyChat.evidenceSummary,
    nextStepRecommendation: lead.nextRecommendedAction,
    ownerReference: conversation.approval.actorReference,
  };
}

function createOpportunityPipeline(
  opportunityId: OpportunityPipelineId,
  recommendations: readonly DecisionEngineV1Snapshot["recommendations"][number][],
  creativeStudio: CreativeStudioV1Snapshot
): OpportunityPipeline {
  const topRecommendation = recommendations[0];
  return {
    opportunityId,
    stage: "qualified",
    estimatedValue: recommendations.length * 1000,
    probability: topRecommendation?.confidenceScore.score ?? 0.65,
    riskNotes: topRecommendation?.explanation.riskNotes ?? [],
    expectedNextAction:
      topRecommendation?.recommendedAction ??
      "Review creative handoff and qualify revenue opportunity.",
    linkedRecommendationIds: recommendations.map(
      (recommendation) => recommendation.recommendationId
    ),
    linkedCreativePackageIds: creativeStudio.integration.creativePackageIds,
  };
}

function createRevenueForecast(
  forecastId: RevenueForecastId,
  opportunity: OpportunityPipeline,
  decisionEngine: DecisionEngineV1Snapshot
): RevenueForecast {
  return {
    forecastId,
    forecastAmount: Math.round(opportunity.estimatedValue * opportunity.probability),
    forecastWindow: "next 30 days",
    confidence: Math.min(
      1,
      (opportunity.probability + decisionEngine.healthEvaluation.readinessScore) / 2
    ),
    assumptions: [
      "Forecast is derived from current opportunity and readiness signals.",
      decisionEngine.healthEvaluation.summary,
    ],
    riskNotes: opportunity.riskNotes,
    opportunityIds: [opportunity.opportunityId],
    reviewState: "draft",
  };
}

function createFollowUpIntelligence(
  followUpId: FollowUpIntelligenceId,
  lead: LeadIntelligence,
  opportunity: OpportunityPipeline
): FollowUpIntelligence {
  return {
    followUpId,
    reason: "Move qualified lead through opportunity pipeline.",
    targetReference: opportunity.opportunityId,
    suggestedTiming: "within 24 hours",
    suggestedActionIntent: lead.nextRecommendedAction,
    rationale: lead.intentSignal,
    status: "planned",
  };
}

function createConversionOptimization(
  optimizationId: ConversionOptimizationId,
  funnel: FunnelIntelligence,
  evidenceSummaries: readonly string[]
): ConversionOptimization {
  return {
    optimizationId,
    bottleneck: funnel.conversionPoints[0] ?? "offer clarity",
    hypothesis: "A clearer offer path will improve lead qualification.",
    experimentIdea: "Review creative package messaging before channel execution.",
    expectedLift: "Improved qualified lead conversion readiness.",
    evidenceSummaries,
  };
}

function createGrowthRecommendations(
  growthRevenueId: GrowthRevenueV1Id,
  recommendations: readonly DecisionEngineV1Snapshot["recommendations"][number][],
  optimization: ConversionOptimization
): readonly GrowthRecommendation[] {
  const sourceRecommendations =
    recommendations.length > 0
      ? recommendations
      : [
          {
            title: "Improve conversion path",
            priorityScore: { priority: "medium" },
            confidenceScore: { score: 0.65 },
            explanation: {
              expectedBusinessValue: optimization.expectedLift,
              evidence: [],
            },
            recommendedAction: optimization.experimentIdea,
          },
        ];

  return sourceRecommendations.map((recommendation, index) => ({
    growthRecommendationId: `${growthRevenueId}:growth-recommendation:${index + 1}` as GrowthRecommendationId,
    title: recommendation.title,
    priority: recommendation.priorityScore.priority,
    confidence: recommendation.confidenceScore.score,
    expectedBusinessValue: recommendation.explanation.expectedBusinessValue,
    recommendedAction: recommendation.recommendedAction,
    evidenceSummaries:
      "evidence" in recommendation.explanation
        ? recommendation.explanation.evidence.map((evidence) => evidence.summary)
        : optimization.evidenceSummaries,
    status: "proposed",
  }));
}

function collectEvidenceSummaries(
  brain: BusinessBrainV1Snapshot,
  decisionEngine: DecisionEngineV1Snapshot
): readonly string[] {
  return [
    brain.understanding.summary,
    ...decisionEngine.recommendations.flatMap((recommendation) =>
      recommendation.explanation.evidence.map((evidence) => evidence.summary)
    ),
  ];
}

function createIds(growthRevenueId: GrowthRevenueV1Id): {
  readonly funnel: FunnelIntelligenceId;
  readonly lead: LeadIntelligenceId;
  readonly crm: CrmIntelligenceId;
  readonly opportunity: OpportunityPipelineId;
  readonly forecast: RevenueForecastId;
  readonly followUp: FollowUpIntelligenceId;
  readonly optimization: ConversionOptimizationId;
} {
  return {
    funnel: `${growthRevenueId}:funnel:primary` as FunnelIntelligenceId,
    lead: `${growthRevenueId}:lead:primary` as LeadIntelligenceId,
    crm: `${growthRevenueId}:crm:primary` as CrmIntelligenceId,
    opportunity: `${growthRevenueId}:opportunity:primary` as OpportunityPipelineId,
    forecast: `${growthRevenueId}:forecast:primary` as RevenueForecastId,
    followUp: `${growthRevenueId}:follow-up:primary` as FollowUpIntelligenceId,
    optimization: `${growthRevenueId}:optimization:primary` as ConversionOptimizationId,
  };
}

function validateUpstream(
  foundation: BusinessFoundationSnapshot,
  brain: BusinessBrainV1Snapshot,
  decisionEngine: DecisionEngineV1Snapshot,
  conversation: ConversationEngineV1Snapshot,
  creativeStudio: CreativeStudioV1Snapshot
): void {
  if (foundation.businessId !== brain.businessId) {
    throw new Error("Business Foundation and Business Brain must share a business.");
  }
  if (brain.businessId !== decisionEngine.businessId) {
    throw new Error("Business Brain and Decision Engine must share a business.");
  }
  if (decisionEngine.businessId !== conversation.businessId) {
    throw new Error("Decision Engine and Conversation Engine must share a business.");
  }
  if (conversation.businessId !== creativeStudio.businessId) {
    throw new Error("Conversation Engine and Creative Studio must share a business.");
  }
  if (brain.brainId !== decisionEngine.brainId) {
    throw new Error("Decision Engine must come from the supplied Business Brain.");
  }
  if (decisionEngine.engineId !== conversation.engineId) {
    throw new Error("Conversation Engine must come from the supplied Decision Engine.");
  }
  if (conversation.conversationId !== creativeStudio.conversationId) {
    throw new Error("Creative Studio must come from the supplied Conversation Engine.");
  }
}

function validateSnapshot(snapshot: GrowthRevenueV1Snapshot): void {
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");
  createRequiredString(snapshot.sourceContext.businessName, "Business name");
  createRequiredString(snapshot.funnelIntelligence.offerPath, "Offer path");
  createRequiredString(snapshot.revenueForecast.forecastWindow, "Forecast window");
}

function cloneSnapshot(snapshot: GrowthRevenueV1Snapshot): GrowthRevenueV1Snapshot {
  return {
    ...snapshot,
    sourceContext: {
      ...snapshot.sourceContext,
      recommendationIds: [...snapshot.sourceContext.recommendationIds],
      creativePackageIds: [...snapshot.sourceContext.creativePackageIds],
      publishingPackageIds: [...snapshot.sourceContext.publishingPackageIds],
    },
    funnelIntelligence: {
      ...snapshot.funnelIntelligence,
      stages: [...snapshot.funnelIntelligence.stages],
      conversionPoints: [...snapshot.funnelIntelligence.conversionPoints],
      followUpSteps: [...snapshot.funnelIntelligence.followUpSteps],
      evidenceSummaries: [...snapshot.funnelIntelligence.evidenceSummaries],
    },
    leadIntelligence: {
      ...snapshot.leadIntelligence,
      qualificationNotes: [...snapshot.leadIntelligence.qualificationNotes],
    },
    crmIntelligence: { ...snapshot.crmIntelligence },
    opportunityPipeline: {
      ...snapshot.opportunityPipeline,
      riskNotes: [...snapshot.opportunityPipeline.riskNotes],
      linkedRecommendationIds: [
        ...snapshot.opportunityPipeline.linkedRecommendationIds,
      ],
      linkedCreativePackageIds: [
        ...snapshot.opportunityPipeline.linkedCreativePackageIds,
      ],
    },
    revenueForecast: {
      ...snapshot.revenueForecast,
      assumptions: [...snapshot.revenueForecast.assumptions],
      riskNotes: [...snapshot.revenueForecast.riskNotes],
      opportunityIds: [...snapshot.revenueForecast.opportunityIds],
    },
    followUpIntelligence: { ...snapshot.followUpIntelligence },
    conversionOptimization: {
      ...snapshot.conversionOptimization,
      evidenceSummaries: [...snapshot.conversionOptimization.evidenceSummaries],
    },
    growthRecommendations: snapshot.growthRecommendations.map(
      (recommendation) => ({
        ...recommendation,
        evidenceSummaries: [...recommendation.evidenceSummaries],
      })
    ),
    integration: {
      ...snapshot.integration,
      growthRecommendationIds: [
        ...snapshot.integration.growthRecommendationIds,
      ],
    },
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
