import type { BusinessStage } from '@/modules/business-state/contracts/BusinessStage';
import type { InterviewAuthorityBusinessMode } from '@/modules/interview-authority/contracts/InterviewAuthorityProjection';
import type { InterviewProfileSnapshot } from '@/modules/interview-authority/contracts/InterviewProfileSnapshot';

export type AdaptiveJourneyType =
  | 'creator'
  | 'service'
  | 'retail'
  | 'team_building';

export type JourneySelectionInput = {
  businessStage: BusinessStage;
  businessMode: InterviewAuthorityBusinessMode;
  experienceLevel: InterviewProfileSnapshot['experienceLevel'];
  offerStatus: 'missing' | 'defined';
  audienceStatus: 'missing' | 'defined';
  revenueStatus: 'none' | 'started';
  contentReadiness: number;
  trafficReadiness: number;
  primaryOffer?: string;
  revenueModel?: string;
  primaryGrowthChannel?: string;
  recommendedJourney?: AdaptiveJourneyType;
};

export type JourneySelection = {
  journeyType: AdaptiveJourneyType;
  reason: string;
};

function includesAny(value: string | undefined, tokens: string[]) {
  const normalized = value?.toLowerCase() ?? '';
  return tokens.some((token) => normalized.includes(token));
}

export function selectJourney(input: JourneySelectionInput): JourneySelection {
  if (input.recommendedJourney) {
    return {
      journeyType: input.recommendedJourney,
      reason: `Selected ${input.recommendedJourney} journey from Interview Authority Projection.`,
    };
  }

  if (input.businessMode === 'team_building') {
    return {
      journeyType: 'team_building',
      reason: `Selected team building journey from business mode ${input.businessMode}.`,
    };
  }

  if (
    input.businessMode === 'service'
    || includesAny(input.primaryOffer, ['service', 'consult', 'coaching', 'program', '服务', '咨询', '课程'])
    || includesAny(input.revenueModel, ['service', 'consult', 'coaching', 'retainer'])
  ) {
    return {
      journeyType: 'service',
      reason: 'Selected service journey from offer or revenue model.',
    };
  }

  if (
    input.businessMode === 'creator'
    || includesAny(input.primaryGrowthChannel, ['content', 'creator', 'video', 'social', '内容'])
    || (input.experienceLevel !== 'beginner' && input.contentReadiness >= input.trafficReadiness)
  ) {
    return {
      journeyType: 'creator',
      reason: 'Selected creator journey from content readiness or growth channel.',
    };
  }

  return {
    journeyType: 'retail',
    reason: `Selected retail journey from business mode ${input.businessMode}.`,
  };
}
