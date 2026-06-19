import type { InterviewAuthority } from '../contracts/InterviewAuthority';

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateInterviewReadiness(authority: InterviewAuthority) {
  const identity = authority.profile.fullName || authority.profile.professionalRole ? 15 : 0;
  const story = authority.profile.personalStory ? 15 : 0;
  const audience = authority.audience.primaryAudience ? 20 : 0;
  const audienceDepth = authority.audience.audienceProblems.length > 0 || authority.audience.audienceGoals.length > 0 ? 15 : 0;
  const offer = authority.businessContext.primaryOffer ? 20 : 0;
  const channel = authority.businessContext.primaryGrowthChannel || authority.audience.audienceChannels.length > 0 ? 15 : 0;

  return clamp(identity + story + audience + audienceDepth + offer + channel);
}

export function calculateContentReadiness(authority: InterviewAuthority) {
  const story = authority.profile.personalStory ? 30 : 0;
  const skills = Math.min(authority.profile.primarySkills.length * 10, 30);
  const audience = authority.audience.primaryAudience ? 20 : 0;
  const channel = authority.businessContext.primaryGrowthChannel || authority.audience.audienceChannels.length > 0 ? 20 : 0;

  return clamp(story + skills + audience + channel);
}

export function calculateTrafficReadiness(authority: InterviewAuthority) {
  const audience = authority.audience.primaryAudience ? 25 : 0;
  const channel = authority.businessContext.primaryGrowthChannel || authority.audience.audienceChannels.length > 0 ? 25 : 0;
  const offer = authority.businessContext.primaryOffer ? 25 : 0;
  const revenue = authority.businessContext.revenueModel ? 15 : 0;
  const objections = authority.audience.audienceObjections.length > 0 ? 10 : 0;

  return clamp(audience + channel + offer + revenue + objections);
}
