import type { BusinessId, Timestamp } from "@nextshift/shared";

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

export interface GrowthRevenueSourceContextPayload {
  readonly foundationId: string;
  readonly brainId: string;
  readonly engineId: string;
  readonly conversationId: string;
  readonly creativeStudioId: string;
  readonly businessName: string;
  readonly audience: string;
  readonly offer: string;
  readonly recommendationIds: readonly string[];
  readonly creativePackageIds: readonly string[];
  readonly publishingPackageIds: readonly string[];
  readonly handoffIntent?: string;
}

export interface FunnelIntelligencePayload {
  readonly funnelId: string;
  readonly offerPath: string;
  readonly stages: readonly string[];
  readonly conversionPoints: readonly string[];
  readonly followUpSteps: readonly string[];
  readonly evidenceSummaries: readonly string[];
}

export interface LeadIntelligencePayload {
  readonly leadId: string;
  readonly sourceReference: string;
  readonly audienceSegment: string;
  readonly fit: LeadFitLabel;
  readonly intentSignal: string;
  readonly qualificationNotes: readonly string[];
  readonly confidence: number;
  readonly nextRecommendedAction: string;
}

export interface CrmIntelligencePayload {
  readonly crmId: string;
  readonly stateReference: string;
  readonly leadOrCustomerState: string;
  readonly activitySummary: string;
  readonly nextStepRecommendation: string;
  readonly ownerReference?: string;
}

export interface OpportunityPipelinePayload {
  readonly opportunityId: string;
  readonly stage: OpportunityStage;
  readonly estimatedValue: number;
  readonly probability: number;
  readonly riskNotes: readonly string[];
  readonly expectedNextAction: string;
  readonly linkedRecommendationIds: readonly string[];
  readonly linkedCreativePackageIds: readonly string[];
}

export interface RevenueForecastPayload {
  readonly forecastId: string;
  readonly forecastAmount: number;
  readonly forecastWindow: string;
  readonly confidence: number;
  readonly assumptions: readonly string[];
  readonly riskNotes: readonly string[];
  readonly opportunityIds: readonly string[];
  readonly reviewState: ForecastReviewState;
}

export interface FollowUpIntelligencePayload {
  readonly followUpId: string;
  readonly reason: string;
  readonly targetReference: string;
  readonly suggestedTiming: string;
  readonly suggestedActionIntent: string;
  readonly rationale: string;
  readonly status: FollowUpStatus;
}

export interface ConversionOptimizationPayload {
  readonly optimizationId: string;
  readonly bottleneck: string;
  readonly hypothesis: string;
  readonly experimentIdea: string;
  readonly expectedLift: string;
  readonly evidenceSummaries: readonly string[];
}

export interface GrowthRecommendationPayload {
  readonly growthRecommendationId: string;
  readonly title: string;
  readonly priority: string;
  readonly confidence: number;
  readonly expectedBusinessValue: string;
  readonly recommendedAction: string;
  readonly evidenceSummaries: readonly string[];
  readonly status: GrowthRecommendationStatus;
}

export interface GrowthRevenueIntegrationPayload {
  readonly foundationId: string;
  readonly brainId: string;
  readonly engineId: string;
  readonly conversationId: string;
  readonly creativeStudioId: string;
  readonly funnelId: string;
  readonly opportunityId: string;
  readonly forecastId: string;
  readonly followUpId: string;
  readonly growthRecommendationIds: readonly string[];
  readonly downstreamHandoffIntent?: string;
}

export interface GrowthRevenueV1SummaryPayload {
  readonly growthRevenueId: string;
  readonly businessId: BusinessId;
  readonly foundationId: string;
  readonly brainId: string;
  readonly engineId: string;
  readonly conversationId: string;
  readonly creativeStudioId: string;
  readonly sourceContext: GrowthRevenueSourceContextPayload;
  readonly funnelIntelligence: FunnelIntelligencePayload;
  readonly leadIntelligence: LeadIntelligencePayload;
  readonly crmIntelligence: CrmIntelligencePayload;
  readonly opportunityPipeline: OpportunityPipelinePayload;
  readonly revenueForecast: RevenueForecastPayload;
  readonly followUpIntelligence: FollowUpIntelligencePayload;
  readonly conversionOptimization: ConversionOptimizationPayload;
  readonly growthRecommendations: readonly GrowthRecommendationPayload[];
  readonly integration: GrowthRevenueIntegrationPayload;
  readonly lifecycleStatus: RevenueLifecycleStatus;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export type GrowthRevenueV1EventType =
  | "GrowthRevenueV1Created"
  | "GrowthRevenueLifecycleChanged";

export interface GrowthRevenueV1CreatedPayload {
  readonly growthRevenueId: string;
  readonly businessId: BusinessId;
  readonly creativeStudioId: string;
  readonly recommendationCount: number;
  readonly createdAt: Timestamp;
}

export interface GrowthRevenueV1ChangedPayload {
  readonly growthRevenueId: string;
  readonly status: RevenueLifecycleStatus;
  readonly changedAt: Timestamp;
}
