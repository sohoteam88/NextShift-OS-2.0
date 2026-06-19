import type { AudienceSnapshot } from '../contracts/AudienceSnapshot';
import type { BusinessContextSnapshot } from '../contracts/BusinessContextSnapshot';
import type { InterviewAuthority } from '../contracts/InterviewAuthority';
import type { InterviewProfileSnapshot } from '../contracts/InterviewProfileSnapshot';
import {
  normalizeBusinessMode,
  normalizeBusinessStage,
  normalizeExperienceLevel,
  pickArray,
  pickNestedRecord,
  pickString,
  toIsoString,
  toRecord,
} from './BrandProfileAdapter';

const DIALOGUE_KEY = '__dialogue';

function readAnswers(interview: Record<string, unknown>): Record<string, unknown> {
  return toRecord(interview.answers);
}

function readDialogueSlots(answers: Record<string, unknown>): Record<string, unknown> {
  const dialogue = toRecord(answers[DIALOGUE_KEY]);
  return toRecord(dialogue.slots);
}

function slotValue(slots: Record<string, unknown>, key: string): string {
  return pickString(toRecord(slots[key]), ['value']);
}

function createdAt(interview: Record<string, unknown>) {
  return toIsoString(interview.createdAt ?? interview.created_at);
}

function updatedAt(interview: Record<string, unknown>) {
  return toIsoString(interview.updatedAt ?? interview.updated_at ?? interview.createdAt ?? interview.created_at);
}

export function adaptBrandInterviewAnswersToProfile(value: unknown): InterviewProfileSnapshot {
  const interview = toRecord(value);
  const answers = readAnswers(interview);
  const slots = readDialogueSlots(answers);

  return {
    source: 'brand_interview.answers',
    scope: 'user',
    confidence: 'derived',
    fallback: 'metadata.brand_profile',
    profileId: pickString(interview, ['id']),
    fullName: pickString(answers, ['fullName', 'name', 'personalName']),
    professionalRole: pickString(answers, ['current_occupation', 'professionalRole']) || slotValue(slots, 'current_occupation'),
    industry: pickString(answers, ['industry', 'specialty']),
    experienceLevel: normalizeExperienceLevel(answers.experienceLevel ?? answers.social_media_readiness),
    primarySkills: pickArray(answers, ['expertise', 'primarySkills', 'skills']),
    personalStory: pickString(answers, ['personal_story', 'personalStory', 'story']) || slotValue(slots, 'personal_story'),
    missionStatement: pickString(answers, ['future_goal', 'missionStatement', 'positioning']) || slotValue(slots, 'future_goal'),
    createdAt: createdAt(interview),
    updatedAt: updatedAt(interview),
  };
}

export function adaptBrandInterviewExtractedProfileToAuthority(value: unknown): InterviewAuthority {
  const interview = toRecord(value);
  const extracted = toRecord(interview.extractedProfile ?? interview.extracted_profile);
  const answers = readAnswers(interview);
  const slots = readDialogueSlots(answers);
  const profile = Object.keys(extracted).length > 0 ? extracted : answers;
  const timestamps = {
    createdAt: createdAt(interview),
    updatedAt: updatedAt(interview),
  };

  return {
    profile: {
      source: 'brand_interview.extractedProfile',
      scope: 'user',
      confidence: 'derived',
      fallback: 'metadata.brand_profile',
      profileId: pickString(profile, ['id', 'profileId', 'interview_id'], pickString(interview, ['id'])),
      fullName: pickString(profile, ['personalName', 'fullName', 'name']),
      professionalRole: pickString(profile, ['identity', 'brandName', 'current_occupation', 'professionalRole']) || slotValue(slots, 'current_occupation'),
      industry: pickString(profile, ['industry', 'specialty']),
      experienceLevel: normalizeExperienceLevel(profile.experienceLevel ?? profile.social_media_readiness),
      primarySkills: pickArray(profile, ['expertise', 'primarySkills', 'skills', 'content_pillars', 'contentPillars']),
      personalStory: pickString(profile, ['story', 'personalStory', 'personal_story']) || slotValue(slots, 'personal_story'),
      missionStatement: pickString(profile, ['positioning', 'brandPositioning', 'missionStatement', 'value_proposition', 'coreMessage']),
      ...timestamps,
    },
    audience: {
      source: 'brand_interview.extractedProfile',
      scope: 'user',
      confidence: 'derived',
      fallback: 'metadata.brand_profile',
      audienceId: pickString(profile, ['audienceId', 'audience_id'], pickString(interview, ['id'])),
      primaryAudience: pickString(profile, ['target_audience', 'targetAudience', 'audience']),
      audienceProblems: pickArray(profile, ['audience_pain_points', 'audiencePainPoints', 'audienceProblems']),
      audienceGoals: pickArray(profile, ['audienceGoals', 'audience_goals']),
      audienceObjections: pickArray(profile, ['audienceObjections', 'audience_objections']),
      audienceChannels: pickArray(profile, ['recommended_platforms', 'audienceChannels']),
      audienceLanguage: pickString(profile, ['language', 'audienceLanguage'], 'zh'),
      ...timestamps,
    },
    businessContext: {
      source: 'brand_interview.extractedProfile',
      scope: 'user',
      confidence: 'derived',
      fallback: 'metadata.brand_profile',
      businessMode: normalizeBusinessMode(profile.businessMode ?? profile.business_mode ?? answers.businessMode ?? answers.business_mode) ?? 'retail',
      primaryOffer: pickString(profile, ['primaryOffer', 'primary_offer', 'offer']),
      revenueModel: pickString(profile, ['revenueModel', 'revenue_model']),
      businessStage: normalizeBusinessStage(profile.businessStage ?? profile.business_stage),
      targetRevenueGoal: pickString(profile, ['targetRevenueGoal', 'target_revenue_goal']),
      primaryGrowthChannel: pickString(profile, ['content_direction', 'primaryGrowthChannel', 'primary_growth_channel', 'recommended_format']),
      ...timestamps,
    },
  };
}

export function readBrandInterviewBusinessMode(value: unknown) {
  const interview = toRecord(value);
  const answers = readAnswers(interview);
  const extracted = toRecord(interview.extractedProfile ?? interview.extracted_profile);
  const business = pickNestedRecord(answers, ['business', 'businessContext', 'business_context']);
  return normalizeBusinessMode(
    extracted.businessMode
      ?? extracted.business_mode
      ?? answers.businessMode
      ?? answers.business_mode
      ?? business.businessMode
      ?? business.business_mode
      ?? interview.mode,
  );
}
