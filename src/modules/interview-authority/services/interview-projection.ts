import type { InterviewAuthority } from '../contracts/InterviewAuthority';
import type { InterviewAuthorityProjection } from '../contracts/InterviewAuthorityProjection';
import { calculateAuthorityScore } from './authority-score-engine';
import {
  calculateContentReadiness,
  calculateInterviewReadiness,
  calculateTrafficReadiness,
} from './business-readiness-engine';
import {
  classifyBrandArchetype,
  classifyBusinessMode,
  derivePersonalStoryVector,
  recommendJourneyFromInterview,
} from './interview-classifier';

function recommendedMission(projection: Pick<InterviewAuthorityProjection, 'offerStatus' | 'audienceStatus' | 'recommendedJourney'>) {
  if (projection.audienceStatus === 'missing') return 'MISSION_002';
  if (projection.recommendedJourney === 'service') return 'MISSION_003';
  if (projection.recommendedJourney === 'creator') return 'MISSION_004';
  if (projection.recommendedJourney === 'team_building') return 'MISSION_003';
  return 'MISSION_005';
}

export function projectInterviewAuthority(authority: InterviewAuthority): InterviewAuthorityProjection {
  const businessMode = classifyBusinessMode(authority);
  const contentReadiness = calculateContentReadiness(authority);
  const trafficReadiness = calculateTrafficReadiness(authority);
  const readinessScore = calculateInterviewReadiness(authority);
  const authorityScore = calculateAuthorityScore(authority);
  const offerStatus: InterviewAuthorityProjection['offerStatus'] = authority.businessContext.primaryOffer ? 'defined' : 'missing';
  const audienceStatus: InterviewAuthorityProjection['audienceStatus'] = authority.audience.primaryAudience ? 'defined' : 'missing';
  const revenueStatus: InterviewAuthorityProjection['revenueStatus'] = authority.businessContext.businessStage === 'traction'
    || authority.businessContext.businessStage === 'growth'
    || authority.businessContext.businessStage === 'scale'
    ? 'started'
    : 'none';
  const recommendedJourney = recommendJourneyFromInterview({
    businessMode,
    experienceLevel: authority.profile.experienceLevel,
    contentReadiness,
    trafficReadiness,
  });
  const base = {
    source: 'InterviewAuthorityProjection' as const,
    scope: 'user' as const,
    confidence: authority.profile.confidence === 'confirmed' || authority.businessContext.confidence === 'confirmed' ? 'confirmed' as const : 'derived' as const,
    fallback: authority.profile.fallback !== 'none' ? authority.profile.fallback : authority.businessContext.fallback,
    businessMode,
    experienceLevel: authority.profile.experienceLevel,
    offerStatus,
    audienceStatus,
    contentReadiness,
    trafficReadiness,
    revenueStatus,
    primaryOffer: authority.businessContext.primaryOffer,
    revenueModel: authority.businessContext.revenueModel,
    primaryGrowthChannel: authority.businessContext.primaryGrowthChannel,
    brandArchetype: classifyBrandArchetype(authority),
    personalStoryVector: derivePersonalStoryVector(authority),
    authorityScore,
    readinessScore,
    recommendedJourney,
  };

  return {
    ...base,
    recommendedMission: recommendedMission(base),
  };
}
