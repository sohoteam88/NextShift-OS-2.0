import type { InterviewAuthority } from '../contracts/InterviewAuthority';
import { adaptBrandInterviewAnswersToProfile, adaptBrandInterviewExtractedProfileToAuthority, readBrandInterviewBusinessMode } from './BrandInterviewAdapter';
import { adaptBrandProfileToInterviewAuthority, normalizeBusinessMode, toRecord } from './BrandProfileAdapter';
import { adaptLegacyProfileToInterviewAuthority, readLegacyProfileBusinessMode } from './LegacyProfileAdapter';
import { adaptOnboardingContextToInterviewAuthority, readOnboardingBusinessMode } from './OnboardingContextAdapter';

export interface InterviewAuthoritySources {
  brandProfile?: unknown;
  brandInterview?: unknown;
  metadata?: unknown;
}

function hasValues(value: unknown): boolean {
  return Object.keys(toRecord(value)).length > 0;
}

function readLegacyProfile(metadata: unknown) {
  return toRecord(metadata).brand_profile;
}

function readBrandProfileBusinessMode(value: unknown) {
  const profile = toRecord(value);
  return normalizeBusinessMode(profile.businessMode ?? profile.business_mode ?? profile.mode);
}

function applyBusinessModePriority(authority: InterviewAuthority, sources: InterviewAuthoritySources): InterviewAuthority {
  const metadata = toRecord(sources.metadata);
  const legacyProfile = readLegacyProfile(metadata);
  const businessMode =
    readBrandProfileBusinessMode(sources.brandProfile)
    ?? readBrandInterviewBusinessMode(sources.brandInterview)
    ?? readLegacyProfileBusinessMode(legacyProfile)
    ?? readOnboardingBusinessMode(metadata);

  if (!businessMode) return authority;

  return {
    ...authority,
    businessContext: {
      ...authority.businessContext,
      businessMode,
    },
  };
}

export function assembleInterviewAuthority(sources: InterviewAuthoritySources): InterviewAuthority {
  const metadata = toRecord(sources.metadata);
  const legacyProfile = readLegacyProfile(metadata);
  let authority: InterviewAuthority;

  if (hasValues(sources.brandProfile)) {
    authority = adaptBrandProfileToInterviewAuthority(sources.brandProfile);
  } else if (hasValues(toRecord(sources.brandInterview).extractedProfile ?? toRecord(sources.brandInterview).extracted_profile)) {
    authority = adaptBrandInterviewExtractedProfileToAuthority(sources.brandInterview);
  } else if (hasValues(sources.brandInterview)) {
    const fallback = adaptOnboardingContextToInterviewAuthority(metadata);
    authority = {
      ...fallback,
      profile: adaptBrandInterviewAnswersToProfile(sources.brandInterview),
    };
  } else if (hasValues(legacyProfile)) {
    authority = adaptLegacyProfileToInterviewAuthority(legacyProfile);
  } else {
    authority = adaptOnboardingContextToInterviewAuthority(metadata);
  }

  return applyBusinessModePriority(authority, sources);
}
