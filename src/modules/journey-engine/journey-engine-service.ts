import { businessStateService } from '@/modules/business-state/services/BusinessStateService';
import { getInterviewAuthorityProjection } from '@/modules/interview-authority/services/interview-authority-service';
import { readJourneyProgress } from '@/modules/journey/adapters/journey-adapter-diagnostics';
import type { BusinessState } from '@/modules/business-state/contracts/BusinessState';
import type { InterviewAuthorityProjection } from '@/modules/interview-authority/contracts/InterviewAuthorityProjection';
import { selectJourney, type JourneySelectionInput } from './journey-selector';
import { JOURNEY_PATHS, resolveJourneyStateMachine } from './journey-state-machine';
import { toJourneyProjection, type AdaptiveJourneyProjection } from './journey-projection';

function hasBottleneck(state: BusinessState, token: string) {
  return state.bottlenecks.some((bottleneck) => (
    bottleneck.code.includes(token) || bottleneck.domain.includes(token)
  ));
}

function buildSelectionInput(
  businessState: BusinessState,
  interview: InterviewAuthorityProjection,
  completedChecks: string[],
): JourneySelectionInput {
  const checks = new Set(completedChecks);

  return {
    businessStage: businessState.stage,
    businessMode: interview.businessMode,
    experienceLevel: interview.experienceLevel,
    offerStatus: interview.offerStatus,
    audienceStatus: interview.audienceStatus,
    revenueStatus: checks.has('first_sale_completed') ? 'started' : 'none',
    contentReadiness: checks.has('first_content_generated') ? 100 : interview.contentReadiness,
    trafficReadiness: hasBottleneck(businessState, 'traffic') ? Math.min(20, interview.trafficReadiness) : interview.trafficReadiness,
    primaryOffer: interview.primaryOffer,
    revenueModel: interview.revenueModel,
    primaryGrowthChannel: interview.primaryGrowthChannel,
    recommendedJourney: interview.recommendedJourney,
  };
}

export function projectAdaptiveJourney(input: {
  businessState: BusinessState;
  interview: InterviewAuthorityProjection;
  completedChecks: string[];
}): AdaptiveJourneyProjection {
  const selectionInput = buildSelectionInput(input.businessState, input.interview, input.completedChecks);
  const selection = selectJourney(selectionInput);
  const path = JOURNEY_PATHS[selection.journeyType];
  const missions = resolveJourneyStateMachine(path, input.completedChecks);

  return toJourneyProjection({
    selection,
    title: path.title,
    inputs: selectionInput,
    missions,
  });
}

export const journeyEngineService = {
  async getJourneyProjection(userId: string): Promise<AdaptiveJourneyProjection> {
    const [businessState, interview, progress] = await Promise.all([
      businessStateService.getBusinessState(userId),
      getInterviewAuthorityProjection(userId),
      readJourneyProgress(userId),
    ]);

    return projectAdaptiveJourney({
      businessState,
      interview,
      completedChecks: progress.completedChecks,
    });
  },
};
