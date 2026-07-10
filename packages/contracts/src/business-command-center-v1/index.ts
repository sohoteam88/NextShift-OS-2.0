import type { BusinessId, Timestamp } from "@nextshift/shared";

export type CommandCenterLifecycleStatus =
  | "drafted"
  | "reviewed"
  | "active"
  | "resolved"
  | "archived";

export type CommandCenterReadinessStatus = "ready" | "blocked" | "waiting";
export type CommandCenterHealthStatus = "healthy" | "watch" | "at_risk";

export interface BusinessCommandCenterSourceContextPayload {
  readonly foundationId: string;
  readonly brainId: string;
  readonly engineId: string;
  readonly conversationId: string;
  readonly creativeStudioId: string;
  readonly growthRevenueId: string;
  readonly businessName: string;
  readonly audience: string;
  readonly offer: string;
  readonly missionSource: string;
  readonly handoffIntent?: string;
}

export interface TodaysMissionPayload {
  readonly missionId: string;
  readonly title: string;
  readonly primaryObjective: string;
  readonly businessRationale: string;
  readonly priority: string;
  readonly recommendedFocus: string;
  readonly evidenceSummaries: readonly string[];
}

export interface BusinessScorePayload {
  readonly scoreId: string;
  readonly scoreValue: number;
  readonly scoreBand: string;
  readonly factors: readonly string[];
  readonly confidence: number;
  readonly explanation: string;
  readonly healthReference: string;
  readonly growthReference: string;
}

export interface AIRecommendationFeedItemPayload {
  readonly feedItemId: string;
  readonly sourceRecommendationId?: string;
  readonly sourceLayer: "decision-engine" | "growth-revenue";
  readonly title: string;
  readonly priority: string;
  readonly confidence: number;
  readonly actionIntent: string;
  readonly readinessStatus: CommandCenterReadinessStatus;
  readonly evidenceSummaries: readonly string[];
}

export interface RevenueForecastViewPayload {
  readonly forecastViewId: string;
  readonly forecastId: string;
  readonly forecastAmount: number;
  readonly forecastWindow: string;
  readonly confidence: number;
  readonly assumptions: readonly string[];
  readonly riskNotes: readonly string[];
  readonly opportunityReferences: readonly string[];
  readonly reviewState: string;
}

export interface LeadForecastViewPayload {
  readonly leadForecastViewId: string;
  readonly leadReference: string;
  readonly segment: string;
  readonly fit: string;
  readonly intentSignal: string;
  readonly probability: number;
  readonly opportunityReference: string;
  readonly nextRecommendedAction: string;
  readonly sourceEvidence: readonly string[];
}

export interface TodaysOpportunityPayload {
  readonly opportunityViewId: string;
  readonly opportunityReference: string;
  readonly title: string;
  readonly expectedBusinessValue: string;
  readonly urgency: string;
  readonly riskNotes: readonly string[];
  readonly rationale: string;
  readonly linkedRecommendationIds: readonly string[];
}

export interface ActionReadinessSummaryPayload {
  readonly readinessSummaryId: string;
  readonly readyActions: readonly string[];
  readonly blockedActions: readonly string[];
  readonly waitingActions: readonly string[];
  readonly missingInputs: readonly string[];
  readonly readinessRationale: string;
}

export interface BusinessHealthSnapshotPayload {
  readonly healthSnapshotId: string;
  readonly healthStatus: CommandCenterHealthStatus;
  readonly riskIndicators: readonly string[];
  readonly strengthIndicators: readonly string[];
  readonly warningIndicators: readonly string[];
  readonly recommendedAttentionAreas: readonly string[];
  readonly evidenceReferences: readonly string[];
}

export interface CommandCenterIntegrationPayload {
  readonly foundationId: string;
  readonly brainId: string;
  readonly engineId: string;
  readonly conversationId: string;
  readonly creativeStudioId: string;
  readonly growthRevenueId: string;
  readonly missionId: string;
  readonly scoreId: string;
  readonly recommendationFeedItemIds: readonly string[];
  readonly forecastViewId: string;
  readonly opportunityViewId: string;
  readonly readinessSummaryId: string;
  readonly healthSnapshotId: string;
  readonly downstreamHandoffIntent?: string;
}

export interface BusinessCommandCenterV1SummaryPayload {
  readonly commandCenterId: string;
  readonly businessId: BusinessId;
  readonly foundationId: string;
  readonly brainId: string;
  readonly engineId: string;
  readonly conversationId: string;
  readonly creativeStudioId: string;
  readonly growthRevenueId: string;
  readonly sourceContext: BusinessCommandCenterSourceContextPayload;
  readonly todaysMission: TodaysMissionPayload;
  readonly businessScore: BusinessScorePayload;
  readonly aiRecommendationFeed: readonly AIRecommendationFeedItemPayload[];
  readonly revenueForecastView: RevenueForecastViewPayload;
  readonly leadForecastView: LeadForecastViewPayload;
  readonly todaysOpportunity: TodaysOpportunityPayload;
  readonly actionReadinessSummary: ActionReadinessSummaryPayload;
  readonly businessHealthSnapshot: BusinessHealthSnapshotPayload;
  readonly integration: CommandCenterIntegrationPayload;
  readonly lifecycleStatus: CommandCenterLifecycleStatus;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export type BusinessCommandCenterV1EventType =
  | "BusinessCommandCenterV1Created"
  | "BusinessCommandCenterLifecycleChanged";

export interface BusinessCommandCenterV1CreatedPayload {
  readonly commandCenterId: string;
  readonly businessId: BusinessId;
  readonly growthRevenueId: string;
  readonly recommendationCount: number;
  readonly createdAt: Timestamp;
}

export interface BusinessCommandCenterV1ChangedPayload {
  readonly commandCenterId: string;
  readonly status: CommandCenterLifecycleStatus;
  readonly changedAt: Timestamp;
}
