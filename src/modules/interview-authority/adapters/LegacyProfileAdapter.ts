import type { InterviewAuthority } from '../contracts/InterviewAuthority';
import {
  normalizeBusinessMode,
  normalizeBusinessStage,
  normalizeExperienceLevel,
  pickArray,
  pickString,
  toIsoString,
  toRecord,
} from './BrandProfileAdapter';

export type LegacyInterviewAuthority = InterviewAuthority & { legacy: true };

function timestamp(source: Record<string, unknown>, key: 'created' | 'updated') {
  if (key === 'created') return toIsoString(source.createdAt ?? source.created_at ?? source.generatedAt);
  return toIsoString(source.updatedAt ?? source.updated_at ?? source.generatedAt ?? source.createdAt ?? source.created_at);
}

export function adaptLegacyProfileToInterviewAuthority(value: unknown): LegacyInterviewAuthority {
  const profile = toRecord(value);
  const createdAt = timestamp(profile, 'created');
  const updatedAt = timestamp(profile, 'updated');

  return {
    legacy: true,
    profile: {
      source: 'metadata.brand_profile',
      scope: 'user',
      confidence: 'fallback',
      fallback: 'onboarding',
      profileId: pickString(profile, ['id', 'profileId', 'profile_id', 'interview_id']),
      fullName: pickString(profile, ['personalName', 'fullName', 'name']),
      professionalRole: pickString(profile, ['identity', 'brandName', 'current_occupation', 'professionalRole']),
      industry: pickString(profile, ['industry', 'specialty']),
      experienceLevel: normalizeExperienceLevel(profile.experienceLevel ?? profile.social_media_readiness),
      primarySkills: pickArray(profile, ['expertise', 'primarySkills', 'skills', 'content_pillars', 'contentPillars']),
      personalStory: pickString(profile, ['story', 'personalStory', 'personal_story']),
      missionStatement: pickString(profile, ['positioning', 'brandPositioning', 'missionStatement', 'value_proposition', 'coreMessage']),
      createdAt,
      updatedAt,
    },
    audience: {
      source: 'metadata.brand_profile',
      scope: 'user',
      confidence: 'fallback',
      fallback: 'onboarding',
      audienceId: pickString(profile, ['audienceId', 'audience_id', 'id']),
      primaryAudience: pickString(profile, ['target_audience', 'targetAudience', 'audience']),
      audienceProblems: pickArray(profile, ['audience_pain_points', 'audiencePainPoints', 'audienceProblems']),
      audienceGoals: pickArray(profile, ['audienceGoals', 'audience_goals']),
      audienceObjections: pickArray(profile, ['audienceObjections', 'audience_objections']),
      audienceChannels: pickArray(profile, ['recommended_platforms', 'audienceChannels']),
      audienceLanguage: pickString(profile, ['language', 'audienceLanguage'], 'zh'),
      createdAt,
      updatedAt,
    },
    businessContext: {
      source: 'metadata.brand_profile',
      scope: 'user',
      confidence: 'fallback',
      fallback: 'onboarding',
      businessMode: normalizeBusinessMode(profile.businessMode ?? profile.business_mode ?? profile.mode) ?? 'retail',
      primaryOffer: pickString(profile, ['primaryOffer', 'primary_offer', 'offer']),
      revenueModel: pickString(profile, ['revenueModel', 'revenue_model']),
      businessStage: normalizeBusinessStage(profile.businessStage ?? profile.business_stage),
      targetRevenueGoal: pickString(profile, ['targetRevenueGoal', 'target_revenue_goal']),
      primaryGrowthChannel: pickString(profile, ['content_direction', 'primaryGrowthChannel', 'primary_growth_channel', 'recommended_format']),
      createdAt,
      updatedAt,
    },
  };
}

export function readLegacyProfileBusinessMode(value: unknown) {
  const profile = toRecord(value);
  return normalizeBusinessMode(profile.businessMode ?? profile.business_mode ?? profile.mode);
}
