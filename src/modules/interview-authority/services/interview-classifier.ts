import type { InterviewAuthority } from '../contracts/InterviewAuthority';
import type {
  InterviewAuthorityBusinessMode,
  InterviewAuthorityProjection,
} from '../contracts/InterviewAuthorityProjection';

function includesAny(value: string, tokens: string[]) {
  const normalized = value.toLowerCase();
  return tokens.some((token) => normalized.includes(token));
}

export function classifyBusinessMode(authority: InterviewAuthority): InterviewAuthorityBusinessMode {
  const mode = authority.businessContext.businessMode;
  const offer = authority.businessContext.primaryOffer;
  const revenueModel = authority.businessContext.revenueModel;
  const growthChannel = authority.businessContext.primaryGrowthChannel;
  const role = authority.profile.professionalRole;

  if (mode === 'team_building' || mode === 'recruitment' || mode === 'franchise') return 'team_building';
  if (mode === 'hybrid') return 'hybrid';
  if (includesAny(`${offer} ${revenueModel}`, ['service', 'consult', 'coaching', 'program', '服务', '咨询', '课程'])) return 'service';
  if (includesAny(`${growthChannel} ${role}`, ['creator', 'content', 'video', 'social', '内容', '创作者'])) return 'creator';
  return 'retail';
}

export function classifyBrandArchetype(authority: InterviewAuthority): string {
  const text = [
    authority.profile.professionalRole,
    authority.profile.primarySkills.join(' '),
    authority.profile.personalStory,
    authority.profile.missionStatement,
  ].join(' ').toLowerCase();

  if (includesAny(text, ['coach', 'mentor', 'teacher', '教练', '导师', '教育'])) return 'teacher';
  if (includesAny(text, ['leader', 'team', 'recruit', '团队', '领导', '招募'])) return 'leader';
  if (includesAny(text, ['story', 'creator', 'content', 'video', '故事', '内容'])) return 'creator';
  if (includesAny(text, ['health', 'wellness', 'beauty', 'product', '健康', '产品'])) return 'trusted_advisor';
  return 'operator';
}

export function derivePersonalStoryVector(authority: InterviewAuthority): string[] {
  return [
    authority.profile.personalStory,
    authority.profile.missionStatement,
    ...authority.profile.primarySkills,
    ...authority.audience.audienceProblems,
    ...authority.audience.audienceGoals,
  ]
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function recommendJourneyFromInterview(input: {
  businessMode: InterviewAuthorityBusinessMode;
  experienceLevel: InterviewAuthorityProjection['experienceLevel'];
  contentReadiness: number;
  trafficReadiness: number;
}): InterviewAuthorityProjection['recommendedJourney'] {
  if (input.businessMode === 'team_building') return 'team_building';
  if (input.businessMode === 'service') return 'service';
  if (input.businessMode === 'creator') return 'creator';
  if (input.businessMode === 'hybrid') {
    return input.contentReadiness >= input.trafficReadiness ? 'creator' : 'service';
  }
  if (input.experienceLevel !== 'beginner' && input.contentReadiness >= input.trafficReadiness) return 'creator';
  return 'retail';
}
