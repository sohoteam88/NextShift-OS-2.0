import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import {
  JOURNEY_MAP,
  getNextStage,
  getTotalXP,
  type JourneyStageId,
} from '@/modules/mission/constants/journey-map';
import {
  appendCompletedCheckEntries,
  extractCheckKeys,
  toCompletedCheckEntries,
} from '@/modules/mission/utils/completed-checks';

const BRAND_DISCOVERY_CHECK = 'brand_discovery_completed';

function mergeCompletedSteps(value: unknown, stepId: string): string[] {
  const existing = Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  return Array.from(new Set([...existing, stepId]));
}

function buildBrandProfileData(user: AuthUser, profile: Record<string, unknown>) {
  return {
    tenantId: user.tenantId,
    userId: user.id,
    brandName: (profile.identity as string) ?? (profile.brandName as string) ?? '',
    personalName: (profile.personalName as string) ?? '',
    brandPositioning: (profile.positioning as string) ?? (profile.brandPositioning as string) ?? '',
    slogan: (profile.slogan as string) ?? '',
    targetAudience: (profile.target_audience as string) ?? (profile.targetAudience as string) ?? '',
    audiencePainPoints: (profile.audience_pain_points as Prisma.InputJsonValue) ?? [],
    audienceGoals: (profile.audienceGoals as Prisma.InputJsonValue) ?? [],
    audienceObjections: (profile.audienceObjections as Prisma.InputJsonValue) ?? [],
    coreMessage: (profile.coreMessage as string) ?? (profile.value_proposition as string) ?? '',
    uniqueAngle: (profile.differentiator as string) ?? (profile.uniqueAngle as string) ?? '',
    elevatorPitch: (profile.elevatorPitch as string) ?? '',
    contentTone: (profile.personality as string) ?? (profile.contentTone as string) ?? '温暖亲切',
    contentPillars: (profile.content_pillars as Prisma.InputJsonValue) ?? [],
    storytellingStyle: (profile.storytellingStyle as string) ?? '',
    primaryOffer: (profile.primaryOffer as string) ?? '',
    secondaryOffer: (profile.secondaryOffer as string) ?? '',
    transformationPromise: (profile.transformationPromise as string) ?? (profile.value_proposition as string) ?? '',
    brandColors: (profile.brandColors as Prisma.InputJsonValue) ?? ['#2563eb', '#1e40af', '#f59e0b'],
    profileImagePrompt: (profile.profileImagePrompt as string) ?? '',
    coverBannerPrompt: (profile.coverBannerPrompt as string) ?? '',
    confidenceScore: 75,
  };
}

export async function completeBrandDiscovery(
  user: AuthUser,
  interviewId: string,
  profile: Record<string, unknown>,
) {
  const completedAt = new Date().toISOString();

  return prisma.$transaction(async (tx) => {
    const dbUser = await tx.user.findUnique({
      where: { id: user.id },
      select: { metadata: true },
    });
    const metadata = dbUser?.metadata && typeof dbUser.metadata === 'object' && !Array.isArray(dbUser.metadata)
      ? dbUser.metadata as Record<string, unknown>
      : {};
    const wizardState = metadata.brand_builder_state && typeof metadata.brand_builder_state === 'object' && !Array.isArray(metadata.brand_builder_state)
      ? metadata.brand_builder_state as Record<string, unknown>
      : {};

    await tx.brandInterview.update({
      where: { id: interviewId },
      data: {
        extractedProfile: profile as Prisma.InputJsonValue,
        status: 'confirmed',
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: {
        metadata: {
          ...metadata,
          brand_profile: {
            ...profile,
            builder_completed: false,
            interview_id: interviewId,
          },
          brand_builder_state: {
            ...wizardState,
            current_step: Math.max(typeof wizardState.current_step === 'number' ? wizardState.current_step : 1, 2),
            completed_steps: mergeCompletedSteps(wizardState.completed_steps, 'interview'),
            interview_id: interviewId,
            started_at: typeof wizardState.started_at === 'string' ? wizardState.started_at : completedAt,
          },
        } as Prisma.InputJsonValue,
      },
    });

    const profileData = buildBrandProfileData(user, profile);
    await tx.brandProfile.upsert({
      where: { userId: user.id },
      create: profileData,
      update: {
        brandName: profileData.brandName || undefined,
        personalName: profileData.personalName || undefined,
        brandPositioning: profileData.brandPositioning || undefined,
        slogan: profileData.slogan || undefined,
        targetAudience: profileData.targetAudience || undefined,
        audiencePainPoints: profileData.audiencePainPoints,
        audienceGoals: profileData.audienceGoals,
        audienceObjections: profileData.audienceObjections,
        coreMessage: profileData.coreMessage || undefined,
        uniqueAngle: profileData.uniqueAngle || undefined,
        elevatorPitch: profileData.elevatorPitch || undefined,
        contentTone: profileData.contentTone || undefined,
        contentPillars: profileData.contentPillars,
        storytellingStyle: profileData.storytellingStyle || undefined,
        primaryOffer: profileData.primaryOffer || undefined,
        secondaryOffer: profileData.secondaryOffer || undefined,
        transformationPromise: profileData.transformationPromise || undefined,
        brandColors: profileData.brandColors,
        profileImagePrompt: profileData.profileImagePrompt || undefined,
        coverBannerPrompt: profileData.coverBannerPrompt || undefined,
        confidenceScore: profileData.confidenceScore,
      },
    });

    const progress = await tx.userProgress.findUnique({ where: { userId: user.id } });
    const completedChecks = progress
      ? appendCompletedCheckEntries(progress.completedChecks, [BRAND_DISCOVERY_CHECK], completedAt)
      : appendCompletedCheckEntries([], ['registered', 'approved', BRAND_DISCOVERY_CHECK], completedAt);
    const totalXp = getTotalXP(completedChecks);
    const stage = JOURNEY_MAP.find((item) => item.completion_check === BRAND_DISCOVERY_CHECK) ?? null;
    const nextStage = getNextStage(completedChecks);
    const milestonesSeen = new Set(
      Array.isArray(progress?.milestonesSeen)
        ? progress.milestonesSeen.filter((item): item is string => typeof item === 'string')
        : [],
    );

    if (stage?.is_milestone) {
      milestonesSeen.add(stage.id);
    }

    await tx.userProgress.upsert({
      where: { userId: user.id },
      create: {
        tenantId: user.tenantId,
        userId: user.id,
        currentStageId: nextStage?.id ?? 'growth_mode',
        completedChecks,
        totalXp,
        mode: 'guided',
        milestonesSeen: [...milestonesSeen],
      },
      update: {
        completedChecks,
        totalXp,
        currentStageId: (nextStage?.id ?? 'growth_mode') as JourneyStageId,
        stageStartedAt: new Date(),
        lastActivityAt: new Date(),
        milestonesSeen: [...milestonesSeen],
      },
    });

    return {
      profile,
      completedChecks: extractCheckKeys(toCompletedCheckEntries(completedChecks)),
      nextStageId: nextStage?.id ?? 'growth_mode',
    };
  });
}
