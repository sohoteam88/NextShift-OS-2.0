import prisma from '@/lib/prisma';
import type { InterviewAuthority } from '@/modules/interview-authority/contracts/InterviewAuthority';
import { getInterviewAuthority } from '@/modules/interview-authority/services/InterviewAuthorityService';

export type BrandBuilderProfileViewModel = Record<string, unknown>;

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function pickString(primary: string | undefined, fallback: unknown): string {
  if (primary && primary.trim()) return primary.trim();
  if (typeof fallback === 'string' && fallback.trim()) return fallback.trim();
  return '';
}

function pickArray(primary: string[] | undefined, fallback: unknown): unknown[] {
  if (Array.isArray(primary) && primary.length > 0) return primary;
  if (Array.isArray(fallback)) return fallback;
  return [];
}

function pickLegacyOnly(legacy: Record<string, unknown>, key: string): unknown {
  return legacy[key];
}

function hasValue(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return value !== null && value !== undefined;
}

function derivePillarsFromSkills(skills: string[]): { name: string; emoji: string; pct: number }[] {
  const filtered = skills.map((skill) => skill.trim()).filter(Boolean).slice(0, 5);
  if (filtered.length === 0) return [];
  const basePct = Math.floor(100 / filtered.length / 5) * 5;
  const pillars = filtered.map((name) => ({ name, emoji: '✨', pct: basePct }));
  const total = pillars.reduce((sum, pillar) => sum + pillar.pct, 0);
  pillars[pillars.length - 1]!.pct += 100 - total;
  return pillars;
}

export function toBrandBuilderProfileViewModel(
  authority: InterviewAuthority,
  legacyProfile?: Record<string, unknown> | null,
): BrandBuilderProfileViewModel {
  const legacy = legacyProfile ?? {};
  const contentPillars = Array.isArray(legacy.contentPillars)
    ? legacy.contentPillars
    : derivePillarsFromSkills(authority.profile.primarySkills);
  const platforms = Array.isArray(legacy.platforms) && legacy.platforms.length > 0
    ? legacy.platforms
    : pickArray(authority.audience.audienceChannels, []);

  return {
    ...legacy,
    identity: pickString(authority.profile.professionalRole, legacy.identity),
    personalName: pickString(authority.profile.fullName, legacy.personalName),
    brandName: pickString(authority.profile.professionalRole, legacy.brandName),
    positioning: pickString(authority.profile.missionStatement, legacy.positioning),
    brandPositioning: pickString(authority.profile.missionStatement, legacy.brandPositioning),
    target_audience: pickString(authority.audience.primaryAudience, legacy.target_audience),
    targetAudience: pickString(authority.audience.primaryAudience, legacy.targetAudience),
    audience_pain_points: pickArray(authority.audience.audienceProblems, legacy.audience_pain_points),
    audienceGoals: pickArray(authority.audience.audienceGoals, legacy.audienceGoals),
    audienceObjections: pickArray(authority.audience.audienceObjections, legacy.audienceObjections),
    primaryOffer: pickString(authority.businessContext.primaryOffer, legacy.primaryOffer),
    contentPillars,
    contentStrategy: pickLegacyOnly(legacy, 'contentStrategy'),
    platforms,
    username: pickLegacyOnly(legacy, 'username'),
    bios: pickLegacyOnly(legacy, 'bios'),
    funnelUrl: pickLegacyOnly(legacy, 'funnelUrl'),
    guideProgress: pickLegacyOnly(legacy, 'guideProgress'),
    source: {
      profile: authority.profile.source,
      audience: authority.audience.source,
      businessContext: authority.businessContext.source,
    },
  };
}

export function hasBrandBuilderProfileViewModelData(profile: BrandBuilderProfileViewModel | null | undefined): boolean {
  if (!profile) return false;
  return [
    profile.identity,
    profile.personalName,
    profile.brandName,
    profile.positioning,
    profile.brandPositioning,
    profile.target_audience,
    profile.targetAudience,
    profile.username,
    profile.bios,
  ].some(hasValue);
}

export async function getBrandBuilderProfileViewModel(userId: string): Promise<BrandBuilderProfileViewModel> {
  const [authority, user] = await Promise.all([
    getInterviewAuthority(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    }),
  ]);
  const legacyProfile = toRecord(toRecord(user?.metadata).brand_profile);
  return toBrandBuilderProfileViewModel(authority, legacyProfile);
}
