import type { InterviewProfileSnapshot } from './InterviewProfileSnapshot';

export type InterviewAuthorityBusinessMode =
  | 'creator'
  | 'service'
  | 'retail'
  | 'team_building'
  | 'hybrid';

export type InterviewAuthorityProjection = {
  source: 'InterviewAuthorityProjection';
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';
  businessMode: InterviewAuthorityBusinessMode;
  experienceLevel: InterviewProfileSnapshot['experienceLevel'];
  offerStatus: 'missing' | 'defined';
  audienceStatus: 'missing' | 'defined';
  contentReadiness: number;
  trafficReadiness: number;
  revenueStatus: 'none' | 'started';
  primaryOffer: string;
  revenueModel: string;
  primaryGrowthChannel: string;
  brandArchetype: string;
  personalStoryVector: string[];
  authorityScore: number;
  readinessScore: number;
  recommendedJourney: 'creator' | 'service' | 'retail' | 'team_building';
  recommendedMission: string;
};
