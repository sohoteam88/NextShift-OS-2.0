import type { BusinessStateResult } from '@/modules/business-state/contracts/BusinessStateResult';
import type {
  BottleneckResult,
  MissionCompletionResult,
  MissionPlan,
} from '../contracts/MissionAuthority';
import type { BottleneckSignals } from './BottleneckEngine';

type MissionCompletionVerifierInput = {
  missionPlan: MissionPlan;
  businessState?: BusinessStateResult;
  bottleneckResult?: BottleneckResult;
  signals?: Partial<BottleneckSignals> | null;
  sourceAvailable?: boolean;
  now?: Date;
};

function hasCompletedState(input: MissionCompletionVerifierInput, state: BusinessStateResult['currentState']) {
  return Boolean(input.businessState?.completedStates.includes(state));
}

function resolveCheck(check: string, input: MissionCompletionVerifierInput): boolean {
  const signals = input.signals;

  switch (check) {
    case 'businessProfile.exists':
      return Boolean(signals?.businessContextExists) || hasCompletedState(input, 'BRAND_FOUNDATION');
    case 'aiInterview.completed':
      return Boolean(signals?.aiInterviewCompleted) || hasCompletedState(input, 'BRAND_FOUNDATION');
    case 'audience.defined':
      return Boolean(signals?.targetAudienceExists) || hasCompletedState(input, 'BRAND_POSITIONING');
    case 'positioning.confirmed':
      return Boolean(signals?.positioningStatementExists || signals?.nicheSelected) || hasCompletedState(input, 'BRAND_POSITIONING');
    case 'cta.confirmed':
      return Boolean(signals?.contactMethodExists || signals?.leadMagnetCtaExists || signals?.leadRouteExists);
    case 'content.draftCreated':
      return Boolean((signals?.contentDraftCount ?? 0) > 0 || signals?.contentEngineEnabled || (signals?.contentCount ?? 0) > 0);
    case 'content.published':
      return Boolean((signals?.publishedContentCount ?? 0) > 0);
    case 'leadMagnet.exists':
      return Boolean(signals?.leadMagnetExists);
    case 'leadMagnet.published':
      return Boolean(signals?.leadMagnetPublished);
    case 'cta.active':
      return Boolean(signals?.leadMagnetCtaExists || signals?.contactMethodExists || signals?.leadRouteExists);
    case 'landingPage.published':
      return Boolean(signals?.landingPagePublished);
    case 'thankYouPage.published':
      return Boolean(signals?.thankYouPagePublished);
    case 'leadRoute.active':
      return Boolean(signals?.leadRouteExists);
    case 'trafficSource.active':
      return Boolean((signals?.activeTrafficSourceCount ?? 0) > 0 || (signals?.trafficCount ?? 0) > 0);
    case 'tracking.active':
      return Boolean(signals?.signalSourceAvailable && signals?.requiredMetricsResolved && !signals?.validationFailed);
    case 'webinar.deckGenerated':
    case 'webinar.speakerScriptGenerated':
    case 'webinar.offerStackGenerated':
    case 'webinar.followUpGenerated':
      return false;
    case 'lead.followUpCompleted':
      return Boolean((signals?.crmActivityCount ?? 0) > 0 || (signals?.customerCount ?? 0) > 0);
    case 'customerOpportunity.updated':
      return Boolean((signals?.customerCount ?? 0) > 0 || (signals?.crmActivityCount ?? 0) > 0);
    case 'retentionPath.active':
      return Boolean((signals?.repeatPurchaseCount ?? 0) > 0 || (signals?.retentionRate ?? 0) >= 20);
    case 'customerFollowUp.recorded':
      return Boolean((signals?.crmActivityCount ?? 0) > 0 || (signals?.repeatPurchaseCount ?? 0) > 0);
    case 'sop.created':
      return Boolean((signals?.sopCount ?? 0) > 0);
    case 'executionOwner.assigned':
      return Boolean((signals?.teamMemberCount ?? 0) > 0 || (signals?.activeAgentCount ?? 0) > 0);
    case 'optimization.completed':
      return input.bottleneckResult?.bottleneck === 'BUSINESS_HEALTHY';
    case 'signals.available':
      return Boolean(signals?.signalSourceAvailable && signals?.requiredMetricsResolved && !signals?.validationFailed);
    default:
      return false;
  }
}

export function verifyMissionCompletion(input: MissionCompletionVerifierInput): MissionCompletionResult {
  const sourceUnavailable =
    input.sourceAvailable === false
    || input.signals?.validationFailed === true
    || input.signals?.signalSourceAvailable === false
    || input.signals?.requiredMetricsResolved === false;
  const passedChecks = sourceUnavailable
    ? []
    : input.missionPlan.completionChecks.filter((check) => resolveCheck(check, input));
  const failedChecks = input.missionPlan.completionChecks.filter((check) => !passedChecks.includes(check));
  const completed = input.missionPlan.completionChecks.length > 0 && failedChecks.length === 0 && !sourceUnavailable;
  const completionPercentage = input.missionPlan.completionChecks.length > 0
    ? Math.floor((passedChecks.length / input.missionPlan.completionChecks.length) * 100)
    : 0;

  return {
    completed,
    completionPercentage,
    completionChecks: input.missionPlan.completionChecks,
    passedChecks,
    failedChecks,
    missingChecks: failedChecks,
    nextRequiredCheck: failedChecks[0] ?? null,
    verificationStatus: sourceUnavailable ? 'VERIFYING' : completed ? 'VERIFIED' : 'BLOCKED',
    verificationSource: sourceUnavailable ? 'unavailable' : 'signal',
    verifiedAt: (input.now ?? new Date()).toISOString(),
    source: 'MissionCompletionVerifier',
  };
}

export const missionCompletionVerifier = {
  verify: verifyMissionCompletion,
};
