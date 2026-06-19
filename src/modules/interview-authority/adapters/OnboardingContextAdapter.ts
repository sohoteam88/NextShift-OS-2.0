import type { InterviewAuthority } from '../contracts/InterviewAuthority';
import {
  normalizeBusinessMode,
  normalizeBusinessStage,
  pickArray,
  pickNestedRecord,
  pickString,
  toIsoString,
  toRecord,
} from './BrandProfileAdapter';
import type { LegacyInterviewAuthority } from './LegacyProfileAdapter';

function timestamp(source: Record<string, unknown>, fallback?: unknown) {
  return toIsoString(source.updatedAt ?? source.updated_at ?? source.completed_at ?? fallback);
}

export function adaptOnboardingContextToInterviewAuthority(value: unknown): LegacyInterviewAuthority {
  const metadata = toRecord(value);
  const onboarding = toRecord(metadata.onboarding);
  const goals = pickNestedRecord(metadata, ['goals']);
  const brand = pickNestedRecord(metadata, ['brand_positioning']);
  const createdAt = timestamp(onboarding, metadata.createdAt ?? metadata.created_at);
  const updatedAt = timestamp(onboarding, metadata.updatedAt ?? metadata.updated_at);
  const source = 'onboarding';

  const authority: InterviewAuthority = {
    profile: {
      source,
      scope: 'user',
      confidence: 'fallback',
      fallback: 'none',
      profileId: '',
      fullName: pickString(metadata, ['name', 'fullName', 'personalName']),
      professionalRole: pickString(goals, ['specialty']) || pickString(brand, ['positioning']),
      industry: pickString(goals, ['specialty']),
      experienceLevel: 'beginner',
      primarySkills: pickArray(brand, ['content_pillars']),
      personalStory: '',
      missionStatement: pickString(brand, ['positioning', 'why_this_works']),
      createdAt,
      updatedAt,
    },
    audience: {
      source,
      scope: 'user',
      confidence: 'fallback',
      fallback: 'none',
      audienceId: '',
      primaryAudience: pickString(goals, ['target_audience']) || pickString(brand, ['audience']),
      audienceProblems: [],
      audienceGoals: pickArray(goals, ['health_goals']),
      audienceObjections: [],
      audienceChannels: [],
      audienceLanguage: pickString(metadata, ['languagePreference', 'language'], 'zh'),
      createdAt,
      updatedAt,
    },
    businessContext: {
      source,
      scope: 'user',
      confidence: 'fallback',
      fallback: 'none',
      businessMode: normalizeBusinessMode(metadata.businessMode ?? metadata.business_mode ?? onboarding.businessMode ?? onboarding.business_mode) ?? 'retail',
      primaryOffer: '',
      revenueModel: '',
      businessStage: normalizeBusinessStage(metadata.businessStage ?? metadata.business_stage),
      targetRevenueGoal: '',
      primaryGrowthChannel: '',
      createdAt,
      updatedAt,
    },
  };

  return { ...authority, legacy: true };
}

export function readOnboardingBusinessMode(value: unknown) {
  const metadata = toRecord(value);
  const onboarding = toRecord(metadata.onboarding);
  return normalizeBusinessMode(metadata.businessMode ?? metadata.business_mode ?? onboarding.businessMode ?? onboarding.business_mode);
}
