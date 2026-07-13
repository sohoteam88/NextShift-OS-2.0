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
  CreativeStudioV1Id,
  CreativeStudioV1Snapshot,
} from "../creative-studio-v1";
import type {
  DecisionEngineV1Id,
  DecisionEngineV1Snapshot,
  DecisionRecommendationId,
} from "../decision-engine-v1";
import type {
  GrowthRecommendationId,
  GrowthRevenueV1Id,
  GrowthRevenueV1Snapshot,
  LeadIntelligenceId,
  OpportunityPipelineId,
  RevenueForecastId,
} from "../growth-revenue-v1";
import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";

export type BusinessCommandCenterV1Id = Brand<string, "BusinessCommandCenterV1Id">;
export type TodaysMissionId = Brand<string, "TodaysMissionId">;
export type BusinessScoreId = Brand<string, "BusinessScoreId">;
export type RecommendationFeedItemId = Brand<string, "RecommendationFeedItemId">;
export type RevenueForecastViewId = Brand<string, "RevenueForecastViewId">;
export type LeadForecastViewId = Brand<string, "LeadForecastViewId">;
export type TodaysOpportunityId = Brand<string, "TodaysOpportunityId">;
export type ActionReadinessSummaryId = Brand<string, "ActionReadinessSummaryId">;
export type BusinessHealthSnapshotId = Brand<string, "BusinessHealthSnapshotId">;

export type CommandCenterLifecycleStatus =
  | "drafted"
  | "reviewed"
  | "active"
  | "resolved"
  | "archived";

export type CommandCenterReadinessStatus = "ready" | "blocked" | "waiting";
export type CommandCenterHealthStatus = "healthy" | "watch" | "at_risk";
export type BusinessScoreBand = "strong" | "ready" | "needs_attention";

export interface CalculateBusinessScoreInput {
  readonly readinessScore: number;
  readonly forecastConfidence: number;
}

export interface CalculatedBusinessScore {
  readonly scoreValue: number;
  readonly scoreBand: BusinessScoreBand;
}

export interface BusinessCommandCenterSourceContext {
  readonly foundationId: BusinessFoundationId;
  readonly brainId: BusinessBrainV1Id;
  readonly engineId: DecisionEngineV1Id;
  readonly conversationId: ConversationEngineV1Id;
  readonly creativeStudioId: CreativeStudioV1Id;
  readonly growthRevenueId: GrowthRevenueV1Id;
  readonly businessName: string;
  readonly audience: string;
  readonly offer: string;
  readonly missionSource: string;
  readonly handoffIntent?: string;
}

export interface TodaysMission {
  readonly missionId: TodaysMissionId;
  readonly title: string;
  readonly primaryObjective: string;
  readonly businessRationale: string;
  readonly priority: string;
  readonly recommendedFocus: string;
  readonly evidenceSummaries: readonly string[];
}

export interface BusinessScore {
  readonly scoreId: BusinessScoreId;
  readonly scoreValue: number;
  readonly scoreBand: BusinessScoreBand;
  readonly factors: readonly string[];
  readonly confidence: number;
  readonly explanation: string;
  readonly healthReference: string;
  readonly growthReference: GrowthRevenueV1Id;
}

export interface AIRecommendationFeedItem {
  readonly feedItemId: RecommendationFeedItemId;
  readonly sourceRecommendationId?: DecisionRecommendationId | GrowthRecommendationId;
  readonly sourceLayer: "decision-engine" | "growth-revenue";
  readonly title: string;
  readonly priority: string;
  readonly confidence: number;
  readonly actionIntent: string;
  readonly readinessStatus: CommandCenterReadinessStatus;
  readonly evidenceSummaries: readonly string[];
}

export interface RevenueForecastView {
  readonly forecastViewId: RevenueForecastViewId;
  readonly forecastId: RevenueForecastId;
  readonly forecastAmount: number;
  readonly forecastWindow: string;
  readonly confidence: number;
  readonly assumptions: readonly string[];
  readonly riskNotes: readonly string[];
  readonly opportunityReferences: readonly OpportunityPipelineId[];
  readonly reviewState: string;
}

export interface LeadForecastView {
  readonly leadForecastViewId: LeadForecastViewId;
  readonly leadReference: LeadIntelligenceId;
  readonly segment: string;
  readonly fit: string;
  readonly intentSignal: string;
  readonly probability: number;
  readonly opportunityReference: OpportunityPipelineId;
  readonly nextRecommendedAction: string;
  readonly sourceEvidence: readonly string[];
}

export interface TodaysOpportunity {
  readonly opportunityViewId: TodaysOpportunityId;
  readonly opportunityReference: OpportunityPipelineId;
  readonly title: string;
  readonly expectedBusinessValue: string;
  readonly urgency: string;
  readonly riskNotes: readonly string[];
  readonly rationale: string;
  readonly linkedRecommendationIds: readonly (DecisionRecommendationId | GrowthRecommendationId)[];
}

export interface ActionReadinessSummary {
  readonly readinessSummaryId: ActionReadinessSummaryId;
  readonly readyActions: readonly string[];
  readonly blockedActions: readonly string[];
  readonly waitingActions: readonly string[];
  readonly missingInputs: readonly string[];
  readonly readinessRationale: string;
}

export interface BusinessHealthSnapshot {
  readonly healthSnapshotId: BusinessHealthSnapshotId;
  readonly healthStatus: CommandCenterHealthStatus;
  readonly riskIndicators: readonly string[];
  readonly strengthIndicators: readonly string[];
  readonly warningIndicators: readonly string[];
  readonly recommendedAttentionAreas: readonly string[];
  readonly evidenceReferences: readonly string[];
}

export interface CommandCenterIntegration {
  readonly foundationId: BusinessFoundationId;
  readonly brainId: BusinessBrainV1Id;
  readonly engineId: DecisionEngineV1Id;
  readonly conversationId: ConversationEngineV1Id;
  readonly creativeStudioId: CreativeStudioV1Id;
  readonly growthRevenueId: GrowthRevenueV1Id;
  readonly missionId: TodaysMissionId;
  readonly scoreId: BusinessScoreId;
  readonly recommendationFeedItemIds: readonly RecommendationFeedItemId[];
  readonly forecastViewId: RevenueForecastViewId;
  readonly opportunityViewId: TodaysOpportunityId;
  readonly readinessSummaryId: ActionReadinessSummaryId;
  readonly healthSnapshotId: BusinessHealthSnapshotId;
  readonly downstreamHandoffIntent?: string;
}

export interface BusinessCommandCenterV1Snapshot {
  readonly commandCenterId: BusinessCommandCenterV1Id;
  readonly businessId: BusinessId;
  readonly foundationId: BusinessFoundationId;
  readonly brainId: BusinessBrainV1Id;
  readonly engineId: DecisionEngineV1Id;
  readonly conversationId: ConversationEngineV1Id;
  readonly creativeStudioId: CreativeStudioV1Id;
  readonly growthRevenueId: GrowthRevenueV1Id;
  readonly sourceContext: BusinessCommandCenterSourceContext;
  readonly todaysMission: TodaysMission;
  readonly businessScore: BusinessScore;
  readonly aiRecommendationFeed: readonly AIRecommendationFeedItem[];
  readonly revenueForecastView: RevenueForecastView;
  readonly leadForecastView: LeadForecastView;
  readonly todaysOpportunity: TodaysOpportunity;
  readonly actionReadinessSummary: ActionReadinessSummary;
  readonly businessHealthSnapshot: BusinessHealthSnapshot;
  readonly integration: CommandCenterIntegration;
  readonly lifecycleStatus: CommandCenterLifecycleStatus;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface CreateBusinessCommandCenterV1Input {
  readonly commandCenterId: BusinessCommandCenterV1Id;
  readonly foundation: BusinessFoundationSnapshot;
  readonly brain: BusinessBrainV1Snapshot;
  readonly decisionEngine: DecisionEngineV1Snapshot;
  readonly conversation: ConversationEngineV1Snapshot;
  readonly creativeStudio: CreativeStudioV1Snapshot;
  readonly growthRevenue: GrowthRevenueV1Snapshot;
  readonly createdAt: Timestamp;
}

export interface BusinessCommandCenterV1EventMetadata {
  readonly eventId: EventId;
  readonly eventType: BusinessCommandCenterV1EventType;
  readonly aggregateId: BusinessCommandCenterV1Id;
  readonly aggregateType: "BusinessCommandCenterV1";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type BusinessCommandCenterV1EventType =
  | "BusinessCommandCenterV1Created"
  | "BusinessCommandCenterLifecycleChanged";

export interface BusinessCommandCenterV1CreatedEvent
  extends BusinessCommandCenterV1EventMetadata {
  readonly eventType: "BusinessCommandCenterV1Created";
  readonly payload: {
    readonly commandCenterId: BusinessCommandCenterV1Id;
    readonly businessId: BusinessId;
    readonly growthRevenueId: GrowthRevenueV1Id;
    readonly recommendationCount: number;
    readonly createdAt: Timestamp;
  };
}

export interface BusinessCommandCenterV1ChangedEvent
  extends BusinessCommandCenterV1EventMetadata {
  readonly eventType: "BusinessCommandCenterLifecycleChanged";
  readonly payload: {
    readonly commandCenterId: BusinessCommandCenterV1Id;
    readonly status: CommandCenterLifecycleStatus;
    readonly changedAt: Timestamp;
  };
}

export type BusinessCommandCenterV1DomainEvent =
  | BusinessCommandCenterV1CreatedEvent
  | BusinessCommandCenterV1ChangedEvent;

export class BusinessCommandCenterV1 {
  private constructor(private snapshot: BusinessCommandCenterV1Snapshot) {}

  static create(
    input: CreateBusinessCommandCenterV1Input
  ): BusinessCommandCenterV1 {
    const createdAt = createTimestamp(input.createdAt, "createdAt");
    validateUpstream(
      input.foundation,
      input.brain,
      input.decisionEngine,
      input.conversation,
      input.creativeStudio,
      input.growthRevenue
    );

    const ids = createIds(input.commandCenterId);
    const evidenceSummaries = collectEvidenceSummaries(
      input.brain,
      input.decisionEngine,
      input.growthRevenue
    );
    const sourceContext: BusinessCommandCenterSourceContext = {
      foundationId: input.foundation.foundationId,
      brainId: input.brain.brainId,
      engineId: input.decisionEngine.engineId,
      conversationId: input.conversation.conversationId,
      creativeStudioId: input.creativeStudio.creativeStudioId,
      growthRevenueId: input.growthRevenue.growthRevenueId,
      businessName: input.foundation.twin.name,
      audience: input.foundation.twin.audience,
      offer: input.foundation.twin.offer,
      missionSource: input.growthRevenue.followUpIntelligence.suggestedActionIntent,
      handoffIntent:
        input.growthRevenue.integration.downstreamHandoffIntent ??
        input.creativeStudio.integration.downstreamHandoffIntent ??
        input.conversation.approval.executionHandoffIntent,
    };

    const todaysMission = createTodaysMission(
      ids.mission,
      sourceContext,
      input.growthRevenue,
      evidenceSummaries
    );
    const businessScore = createBusinessScore(
      ids.score,
      input.decisionEngine,
      input.growthRevenue
    );
    const aiRecommendationFeed = createRecommendationFeed(
      input.commandCenterId,
      input.decisionEngine,
      input.growthRevenue
    );
    const revenueForecastView = createRevenueForecastView(
      ids.forecastView,
      input.growthRevenue
    );
    const leadForecastView = createLeadForecastView(
      ids.leadForecastView,
      input.growthRevenue
    );
    const todaysOpportunity = createTodaysOpportunity(
      ids.opportunityView,
      input.growthRevenue
    );
    const actionReadinessSummary = createActionReadinessSummary(
      ids.readinessSummary,
      aiRecommendationFeed,
      input.growthRevenue
    );
    const businessHealthSnapshot = createBusinessHealthSnapshot(
      ids.healthSnapshot,
      input.decisionEngine,
      input.growthRevenue,
      evidenceSummaries
    );

    return new BusinessCommandCenterV1({
      commandCenterId: input.commandCenterId,
      businessId: input.foundation.businessId,
      foundationId: input.foundation.foundationId,
      brainId: input.brain.brainId,
      engineId: input.decisionEngine.engineId,
      conversationId: input.conversation.conversationId,
      creativeStudioId: input.creativeStudio.creativeStudioId,
      growthRevenueId: input.growthRevenue.growthRevenueId,
      sourceContext,
      todaysMission,
      businessScore,
      aiRecommendationFeed,
      revenueForecastView,
      leadForecastView,
      todaysOpportunity,
      actionReadinessSummary,
      businessHealthSnapshot,
      integration: {
        foundationId: input.foundation.foundationId,
        brainId: input.brain.brainId,
        engineId: input.decisionEngine.engineId,
        conversationId: input.conversation.conversationId,
        creativeStudioId: input.creativeStudio.creativeStudioId,
        growthRevenueId: input.growthRevenue.growthRevenueId,
        missionId: todaysMission.missionId,
        scoreId: businessScore.scoreId,
        recommendationFeedItemIds: aiRecommendationFeed.map(
          (item) => item.feedItemId
        ),
        forecastViewId: revenueForecastView.forecastViewId,
        opportunityViewId: todaysOpportunity.opportunityViewId,
        readinessSummaryId: actionReadinessSummary.readinessSummaryId,
        healthSnapshotId: businessHealthSnapshot.healthSnapshotId,
        downstreamHandoffIntent: sourceContext.handoffIntent,
      },
      lifecycleStatus: "drafted",
      createdAt,
      updatedAt: createdAt,
    });
  }

  static rehydrate(
    snapshot: BusinessCommandCenterV1Snapshot
  ): BusinessCommandCenterV1 {
    validateSnapshot(snapshot);
    return new BusinessCommandCenterV1(cloneSnapshot(snapshot));
  }

  get commandCenterId(): BusinessCommandCenterV1Id {
    return this.snapshot.commandCenterId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get growthRevenueId(): GrowthRevenueV1Id {
    return this.snapshot.growthRevenueId;
  }

  review(reviewedAt: Timestamp): void {
    this.transition("reviewed", reviewedAt);
  }

  activate(activatedAt: Timestamp): void {
    this.transition("active", activatedAt);
  }

  resolve(resolvedAt: Timestamp): void {
    this.transition("resolved", resolvedAt);
  }

  archive(archivedAt: Timestamp): void {
    this.transition("archived", archivedAt);
  }

  toSnapshot(): BusinessCommandCenterV1Snapshot {
    return cloneSnapshot(this.snapshot);
  }

  private transition(
    status: CommandCenterLifecycleStatus,
    changedAt: Timestamp
  ): void {
    const timestamp = createTimestamp(changedAt, "changedAt");
    this.replace({
      ...this.snapshot,
      lifecycleStatus: status,
      updatedAt: timestamp,
    });
  }

  private replace(snapshot: BusinessCommandCenterV1Snapshot): void {
    validateSnapshot(snapshot);
    this.snapshot = cloneSnapshot(snapshot);
  }
}

function createTodaysMission(
  missionId: TodaysMissionId,
  source: BusinessCommandCenterSourceContext,
  growthRevenue: GrowthRevenueV1Snapshot,
  evidenceSummaries: readonly string[]
): TodaysMission {
  return {
    missionId,
    title: `Focus ${source.businessName} on ${growthRevenue.opportunityPipeline.expectedNextAction}`,
    primaryObjective: growthRevenue.followUpIntelligence.suggestedActionIntent,
    businessRationale: growthRevenue.followUpIntelligence.rationale,
    priority: growthRevenue.growthRecommendations[0]?.priority ?? "medium",
    recommendedFocus: growthRevenue.conversionOptimization.hypothesis,
    evidenceSummaries,
  };
}

function createBusinessScore(
  scoreId: BusinessScoreId,
  decisionEngine: DecisionEngineV1Snapshot,
  growthRevenue: GrowthRevenueV1Snapshot
): BusinessScore {
  const score = calculateBusinessScore({
    readinessScore: decisionEngine.healthEvaluation.readinessScore,
    forecastConfidence: growthRevenue.revenueForecast.confidence,
  });

  return {
    scoreId,
    ...score,
    factors: [
      decisionEngine.healthEvaluation.summary,
      `Forecast confidence ${growthRevenue.revenueForecast.confidence}`,
      `Lead fit ${growthRevenue.leadIntelligence.fit}`,
    ],
    confidence: growthRevenue.revenueForecast.confidence,
    explanation: "Score combines decision readiness with current growth forecast confidence.",
    healthReference: decisionEngine.healthEvaluation.summary,
    growthReference: growthRevenue.growthRevenueId,
  };
}

function createRecommendationFeed(
  commandCenterId: BusinessCommandCenterV1Id,
  decisionEngine: DecisionEngineV1Snapshot,
  growthRevenue: GrowthRevenueV1Snapshot
): readonly AIRecommendationFeedItem[] {
  const decisionItems = decisionEngine.recommendations.slice(0, 2).map(
    (recommendation, index): AIRecommendationFeedItem => ({
      feedItemId: `${commandCenterId}:recommendation:decision:${index + 1}` as RecommendationFeedItemId,
      sourceRecommendationId: recommendation.recommendationId,
      sourceLayer: "decision-engine",
      title: recommendation.title,
      priority: recommendation.priorityScore.priority,
      confidence: recommendation.confidenceScore.score,
      actionIntent: recommendation.recommendedAction,
      readinessStatus:
        recommendation.confidenceScore.score >= 0.75 ? "ready" : "waiting",
      evidenceSummaries: recommendation.explanation.evidence.map(
        (evidence) => evidence.summary
      ),
    })
  );

  const growthItems = growthRevenue.growthRecommendations.slice(0, 2).map(
    (recommendation, index): AIRecommendationFeedItem => ({
      feedItemId: `${commandCenterId}:recommendation:growth:${index + 1}` as RecommendationFeedItemId,
      sourceRecommendationId: recommendation.growthRecommendationId,
      sourceLayer: "growth-revenue",
      title: recommendation.title,
      priority: recommendation.priority,
      confidence: recommendation.confidence,
      actionIntent: recommendation.recommendedAction,
      readinessStatus: recommendation.confidence >= 0.75 ? "ready" : "waiting",
      evidenceSummaries: recommendation.evidenceSummaries,
    })
  );

  return [...decisionItems, ...growthItems];
}

function createRevenueForecastView(
  forecastViewId: RevenueForecastViewId,
  growthRevenue: GrowthRevenueV1Snapshot
): RevenueForecastView {
  return {
    forecastViewId,
    forecastId: growthRevenue.revenueForecast.forecastId,
    forecastAmount: growthRevenue.revenueForecast.forecastAmount,
    forecastWindow: growthRevenue.revenueForecast.forecastWindow,
    confidence: growthRevenue.revenueForecast.confidence,
    assumptions: growthRevenue.revenueForecast.assumptions,
    riskNotes: growthRevenue.revenueForecast.riskNotes,
    opportunityReferences: growthRevenue.revenueForecast.opportunityIds,
    reviewState: growthRevenue.revenueForecast.reviewState,
  };
}

function createLeadForecastView(
  leadForecastViewId: LeadForecastViewId,
  growthRevenue: GrowthRevenueV1Snapshot
): LeadForecastView {
  return {
    leadForecastViewId,
    leadReference: growthRevenue.leadIntelligence.leadId,
    segment: growthRevenue.leadIntelligence.audienceSegment,
    fit: growthRevenue.leadIntelligence.fit,
    intentSignal: growthRevenue.leadIntelligence.intentSignal,
    probability: growthRevenue.opportunityPipeline.probability,
    opportunityReference: growthRevenue.opportunityPipeline.opportunityId,
    nextRecommendedAction: growthRevenue.leadIntelligence.nextRecommendedAction,
    sourceEvidence: growthRevenue.leadIntelligence.qualificationNotes,
  };
}

function createTodaysOpportunity(
  opportunityViewId: TodaysOpportunityId,
  growthRevenue: GrowthRevenueV1Snapshot
): TodaysOpportunity {
  return {
    opportunityViewId,
    opportunityReference: growthRevenue.opportunityPipeline.opportunityId,
    title: growthRevenue.opportunityPipeline.expectedNextAction,
    expectedBusinessValue:
      growthRevenue.growthRecommendations[0]?.expectedBusinessValue ??
      `Forecast ${growthRevenue.revenueForecast.forecastAmount}`,
    urgency:
      growthRevenue.followUpIntelligence.suggestedTiming === "within 24 hours"
        ? "today"
        : "scheduled",
    riskNotes: growthRevenue.opportunityPipeline.riskNotes,
    rationale: growthRevenue.followUpIntelligence.rationale,
    linkedRecommendationIds: [
      ...growthRevenue.opportunityPipeline.linkedRecommendationIds,
      ...growthRevenue.integration.growthRecommendationIds,
    ],
  };
}

function createActionReadinessSummary(
  readinessSummaryId: ActionReadinessSummaryId,
  feed: readonly AIRecommendationFeedItem[],
  growthRevenue: GrowthRevenueV1Snapshot
): ActionReadinessSummary {
  return {
    readinessSummaryId,
    readyActions: feed
      .filter((item) => item.readinessStatus === "ready")
      .map((item) => item.actionIntent),
    blockedActions: [],
    waitingActions: feed
      .filter((item) => item.readinessStatus === "waiting")
      .map((item) => item.actionIntent),
    missingInputs:
      growthRevenue.revenueForecast.riskNotes.length > 0
        ? growthRevenue.revenueForecast.riskNotes
        : [],
    readinessRationale:
      "Readiness summarizes recommended actions without triggering execution.",
  };
}

function createBusinessHealthSnapshot(
  healthSnapshotId: BusinessHealthSnapshotId,
  decisionEngine: DecisionEngineV1Snapshot,
  growthRevenue: GrowthRevenueV1Snapshot,
  evidenceSummaries: readonly string[]
): BusinessHealthSnapshot {
  const readinessScore = normalizeReadinessScore(
    decisionEngine.healthEvaluation.readinessScore
  );
  const status: CommandCenterHealthStatus =
    readinessScore >= 80
      ? "healthy"
      : readinessScore >= 60
        ? "watch"
        : "at_risk";

  return {
    healthSnapshotId,
    healthStatus: status,
    riskIndicators: [
      `Operating health: ${decisionEngine.healthEvaluation.operatingHealth}`,
      ...growthRevenue.revenueForecast.riskNotes,
    ],
    strengthIndicators: [
      `Strategic clarity: ${decisionEngine.healthEvaluation.strategicClarity}`,
      `Customer clarity: ${decisionEngine.healthEvaluation.customerClarity}`,
      `Content readiness: ${decisionEngine.healthEvaluation.contentReadiness}`,
      `Knowledge completeness: ${decisionEngine.healthEvaluation.knowledgeCompleteness}`,
    ],
    warningIndicators: growthRevenue.opportunityPipeline.riskNotes,
    recommendedAttentionAreas: [
      growthRevenue.conversionOptimization.bottleneck,
      growthRevenue.followUpIntelligence.reason,
    ],
    evidenceReferences: evidenceSummaries,
  };
}

export function normalizeReadinessScore(score: number): number {
  return score > 1 ? score : score * 100;
}

export function calculateBusinessScore(
  input: CalculateBusinessScoreInput
): CalculatedBusinessScore {
  const readinessScore = normalizeReadinessScore(input.readinessScore);
  const scoreValue = Math.round(
    (readinessScore + input.forecastConfidence * 100) / 2
  );

  return {
    scoreValue,
    scoreBand:
      scoreValue >= 80
        ? "strong"
        : scoreValue >= 60
          ? "ready"
          : "needs_attention",
  };
}

function collectEvidenceSummaries(
  brain: BusinessBrainV1Snapshot,
  decisionEngine: DecisionEngineV1Snapshot,
  growthRevenue: GrowthRevenueV1Snapshot
): readonly string[] {
  return [
    brain.understanding.summary,
    ...decisionEngine.recommendations.flatMap((recommendation) =>
      recommendation.explanation.evidence.map((evidence) => evidence.summary)
    ),
    ...growthRevenue.conversionOptimization.evidenceSummaries,
  ];
}

function createIds(commandCenterId: BusinessCommandCenterV1Id): {
  readonly mission: TodaysMissionId;
  readonly score: BusinessScoreId;
  readonly forecastView: RevenueForecastViewId;
  readonly leadForecastView: LeadForecastViewId;
  readonly opportunityView: TodaysOpportunityId;
  readonly readinessSummary: ActionReadinessSummaryId;
  readonly healthSnapshot: BusinessHealthSnapshotId;
} {
  return {
    mission: `${commandCenterId}:mission:today` as TodaysMissionId,
    score: `${commandCenterId}:score:business` as BusinessScoreId,
    forecastView: `${commandCenterId}:forecast:revenue` as RevenueForecastViewId,
    leadForecastView: `${commandCenterId}:forecast:lead` as LeadForecastViewId,
    opportunityView: `${commandCenterId}:opportunity:today` as TodaysOpportunityId,
    readinessSummary: `${commandCenterId}:readiness:summary` as ActionReadinessSummaryId,
    healthSnapshot: `${commandCenterId}:health:snapshot` as BusinessHealthSnapshotId,
  };
}

function validateUpstream(
  foundation: BusinessFoundationSnapshot,
  brain: BusinessBrainV1Snapshot,
  decisionEngine: DecisionEngineV1Snapshot,
  conversation: ConversationEngineV1Snapshot,
  creativeStudio: CreativeStudioV1Snapshot,
  growthRevenue: GrowthRevenueV1Snapshot
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
  if (creativeStudio.businessId !== growthRevenue.businessId) {
    throw new Error("Creative Studio and Growth & Revenue must share a business.");
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
  if (creativeStudio.creativeStudioId !== growthRevenue.creativeStudioId) {
    throw new Error("Growth & Revenue must come from the supplied Creative Studio.");
  }
}

function validateSnapshot(snapshot: BusinessCommandCenterV1Snapshot): void {
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");
  createRequiredString(snapshot.sourceContext.businessName, "Business name");
  createRequiredString(snapshot.todaysMission.primaryObjective, "Mission objective");
  createRequiredString(snapshot.revenueForecastView.forecastWindow, "Forecast window");
}

function cloneSnapshot(
  snapshot: BusinessCommandCenterV1Snapshot
): BusinessCommandCenterV1Snapshot {
  return {
    ...snapshot,
    sourceContext: { ...snapshot.sourceContext },
    todaysMission: {
      ...snapshot.todaysMission,
      evidenceSummaries: [...snapshot.todaysMission.evidenceSummaries],
    },
    businessScore: {
      ...snapshot.businessScore,
      factors: [...snapshot.businessScore.factors],
    },
    aiRecommendationFeed: snapshot.aiRecommendationFeed.map((item) => ({
      ...item,
      evidenceSummaries: [...item.evidenceSummaries],
    })),
    revenueForecastView: {
      ...snapshot.revenueForecastView,
      assumptions: [...snapshot.revenueForecastView.assumptions],
      riskNotes: [...snapshot.revenueForecastView.riskNotes],
      opportunityReferences: [
        ...snapshot.revenueForecastView.opportunityReferences,
      ],
    },
    leadForecastView: {
      ...snapshot.leadForecastView,
      sourceEvidence: [...snapshot.leadForecastView.sourceEvidence],
    },
    todaysOpportunity: {
      ...snapshot.todaysOpportunity,
      riskNotes: [...snapshot.todaysOpportunity.riskNotes],
      linkedRecommendationIds: [
        ...snapshot.todaysOpportunity.linkedRecommendationIds,
      ],
    },
    actionReadinessSummary: {
      ...snapshot.actionReadinessSummary,
      readyActions: [...snapshot.actionReadinessSummary.readyActions],
      blockedActions: [...snapshot.actionReadinessSummary.blockedActions],
      waitingActions: [...snapshot.actionReadinessSummary.waitingActions],
      missingInputs: [...snapshot.actionReadinessSummary.missingInputs],
    },
    businessHealthSnapshot: {
      ...snapshot.businessHealthSnapshot,
      riskIndicators: [...snapshot.businessHealthSnapshot.riskIndicators],
      strengthIndicators: [...snapshot.businessHealthSnapshot.strengthIndicators],
      warningIndicators: [...snapshot.businessHealthSnapshot.warningIndicators],
      recommendedAttentionAreas: [
        ...snapshot.businessHealthSnapshot.recommendedAttentionAreas,
      ],
      evidenceReferences: [...snapshot.businessHealthSnapshot.evidenceReferences],
    },
    integration: {
      ...snapshot.integration,
      recommendationFeedItemIds: [
        ...snapshot.integration.recommendationFeedItemIds,
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
