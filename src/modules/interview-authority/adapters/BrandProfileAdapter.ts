import type { AudienceSnapshot } from '../contracts/AudienceSnapshot';
import type { BusinessContextSnapshot, BusinessMode } from '../contracts/BusinessContextSnapshot';
import type { InterviewAuthority } from '../contracts/InterviewAuthority';
import type { InterviewProfileSnapshot } from '../contracts/InterviewProfileSnapshot';

type SourceConfidence = 'confirmed' | 'derived' | 'fallback';

export function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function pickString(source: Record<string, unknown>, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return fallback;
}

export function pickArray(source: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const value = source[key];
    if (!Array.isArray(value)) continue;
    return value
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        const record = toRecord(item);
        return pickString(record, ['name', 'title', 'label', 'description']);
      })
      .filter(Boolean);
  }
  return [];
}

export function pickNestedRecord(source: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  for (const key of keys) {
    const value = source[key];
    const record = toRecord(value);
    if (Object.keys(record).length > 0) return record;
  }
  return {};
}

export function toIsoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && value.trim()) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toISOString();
  }
  return new Date(0).toISOString();
}

export function normalizeExperienceLevel(value: unknown): InterviewProfileSnapshot['experienceLevel'] {
  if (value === 'intermediate' || value === 'advanced') return value;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (['experienced', 'expert', 'senior', 'scale'].includes(normalized)) return 'advanced';
    if (['some_experience', 'validation', 'traction', 'growth'].includes(normalized)) return 'intermediate';
  }
  return 'beginner';
}

export function normalizeBusinessStage(value: unknown): BusinessContextSnapshot['businessStage'] {
  if (value === 'validation' || value === 'traction' || value === 'growth' || value === 'scale') return value;
  return 'idea';
}

export function normalizeBusinessMode(value: unknown): BusinessMode | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase().replace(/[-\s]+/g, '_');
  const map: Record<string, BusinessMode> = {
    retail: 'retail',
    direct_sales: 'retail',
    product: 'retail',
    recruitment: 'recruitment',
    recruiting: 'recruitment',
    sponsor: 'recruitment',
    hybrid: 'hybrid',
    mixed: 'hybrid',
    team: 'team_building',
    team_building: 'team_building',
    team_growth: 'team_building',
    franchise: 'franchise',
    franchise_growth: 'franchise',
  };
  return map[normalized];
}

function createdAt(source: Record<string, unknown>): string {
  return toIsoString(source.createdAt ?? source.created_at ?? source.generatedAt);
}

function updatedAt(source: Record<string, unknown>): string {
  return toIsoString(source.updatedAt ?? source.updated_at ?? source.generatedAt ?? source.createdAt ?? source.created_at);
}

function readBusinessMode(source: Record<string, unknown>): BusinessMode {
  return normalizeBusinessMode(source.businessMode ?? source.business_mode ?? source.mode) ?? 'retail';
}

function buildProfileSnapshot(
  profile: Record<string, unknown>,
  source: string,
  confidence: SourceConfidence,
  fallback: string,
): InterviewProfileSnapshot {
  return {
    source,
    scope: 'user',
    confidence,
    fallback,
    profileId: pickString(profile, ['id', 'profileId', 'profile_id', 'interview_id']),
    fullName: pickString(profile, ['personalName', 'fullName', 'name']),
    professionalRole: pickString(profile, ['brandName', 'identity', 'current_occupation', 'professionalRole']),
    industry: pickString(profile, ['industry', 'specialty', 'category']),
    experienceLevel: normalizeExperienceLevel(profile.experienceLevel ?? profile.social_media_readiness ?? profile.businessStage),
    primarySkills: pickArray(profile, ['expertise', 'primarySkills', 'skills', 'content_pillars', 'contentPillars']),
    personalStory: pickString(profile, ['story', 'personalStory', 'personal_story']),
    missionStatement: pickString(profile, ['brandPositioning', 'positioning', 'missionStatement', 'value_proposition', 'coreMessage']),
    createdAt: createdAt(profile),
    updatedAt: updatedAt(profile),
  };
}

function buildAudienceSnapshot(
  profile: Record<string, unknown>,
  source: string,
  confidence: SourceConfidence,
  fallback: string,
): AudienceSnapshot {
  return {
    source,
    scope: 'user',
    confidence,
    fallback,
    audienceId: pickString(profile, ['audienceId', 'audience_id', 'id']),
    primaryAudience: pickString(profile, ['targetAudience', 'target_audience', 'audience', 'primaryAudience']),
    audienceProblems: pickArray(profile, ['audiencePainPoints', 'audience_pain_points', 'audienceProblems', 'pain_points']),
    audienceGoals: pickArray(profile, ['audienceGoals', 'audience_goals', 'goals']),
    audienceObjections: pickArray(profile, ['audienceObjections', 'audience_objections', 'objections']),
    audienceChannels: pickArray(profile, ['recommended_platforms', 'audienceChannels', 'channels']),
    audienceLanguage: pickString(profile, ['language', 'audienceLanguage'], 'zh'),
    createdAt: createdAt(profile),
    updatedAt: updatedAt(profile),
  };
}

function buildBusinessContextSnapshot(
  profile: Record<string, unknown>,
  source: string,
  confidence: SourceConfidence,
  fallback: string,
): BusinessContextSnapshot {
  return {
    source,
    scope: 'user',
    confidence,
    fallback,
    businessMode: readBusinessMode(profile),
    primaryOffer: pickString(profile, ['primaryOffer', 'primary_offer', 'offer']),
    revenueModel: pickString(profile, ['revenueModel', 'revenue_model', 'monetization']),
    businessStage: normalizeBusinessStage(profile.businessStage ?? profile.business_stage),
    targetRevenueGoal: pickString(profile, ['targetRevenueGoal', 'target_revenue_goal', 'revenue_goal']),
    primaryGrowthChannel: pickString(profile, ['primaryGrowthChannel', 'primary_growth_channel', 'content_direction', 'recommended_format']),
    createdAt: createdAt(profile),
    updatedAt: updatedAt(profile),
  };
}

export function adaptBrandProfileToInterviewAuthority(value: unknown): InterviewAuthority {
  const profile = toRecord(value);
  return {
    profile: buildProfileSnapshot(profile, 'brand_profile', 'confirmed', 'brand_interview'),
    audience: buildAudienceSnapshot(profile, 'brand_profile', 'confirmed', 'brand_interview'),
    businessContext: buildBusinessContextSnapshot(profile, 'brand_profile', 'confirmed', 'brand_interview'),
  };
}
