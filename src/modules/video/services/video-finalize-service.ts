import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import { postPerformanceService } from '@/modules/brand-builder/services/post-performance-service';
import type { MasterScript, PlatformType, VideoStrategy } from '../types';
import { capcutService } from './capcut-service';
import { platformAdaptationService } from './platform-adaptation-service';
import { subtitleService } from './subtitle-service';

import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';
import { requireOwnedVideoProject, updateOwnedVideoProject } from './video-project-service';
import { generationMetadata } from './json';

/** @deprecated Use getBrandContext() directly. Maps to legacy shape. */
async function getBrandProfile(userId: string): Promise<Record<string, unknown> | null> {
  const ctx = await getBrandContext(userId);
  if (!ctx) return null;
  return { identity: ctx.brandName, personality: ctx.tone, story: ctx.messaging.coreMessage, audience: ctx.audience };
}

export const videoFinalizeService = {
  async finalize(user: AuthUser, projectId: string, additionalPlatforms: PlatformType[] = []) {
    const project = await requireOwnedVideoProject(user, projectId);

    const script = project.masterScript as unknown as MasterScript;
    const strategy = project.strategy as unknown as VideoStrategy;
    if (!script?.scenes?.length) throw new Error('Master script not ready');

    const brandProfile = await getBrandProfile(user.id);
    const [capcutGeneration, platformAdaptationsGeneration] = await Promise.all([
      capcutService.generate(user, script, String(brandProfile?.personality ?? 'friendly'), project.platform),
      platformAdaptationService.generate(user, script, strategy, project.platform as PlatformType, additionalPlatforms),
    ]);
    const capcutScript = capcutGeneration.value;
    const platformAdaptations = platformAdaptationsGeneration.value;
    const subtitleSrt = subtitleService.generateSRT(script);
    const existingAdaptations = (project.platformAdaptations as Record<string, unknown> | null) ?? {};

    await updateOwnedVideoProject(user, projectId, {
        capcutScript: capcutScript as unknown as Prisma.InputJsonValue,
        subtitleSrt,
        platformAdaptations: {
          ...existingAdaptations,
          posting_adaptations: platformAdaptations,
        } as unknown as Prisma.InputJsonValue,
        status: 'ready',
    });

    return {
      capcutScript,
      subtitleSrt,
      platformAdaptations,
      generation: generationMetadata([capcutGeneration, platformAdaptationsGeneration]),
    };
  },

  async markPublished(
    user: AuthUser,
    projectId: string,
    input: { create_performance_record?: boolean; platform?: string } = {},
  ) {
    const project = await requireOwnedVideoProject(user, projectId);

    let performanceId = project.performanceId;
    if (input.create_performance_record && !performanceId) {
      const performance = await postPerformanceService.create(user, {
        platform: input.platform ?? project.platform,
        pillar: project.contentPillar,
        format: 'short_video',
        publishedAt: new Date(),
        reach: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        calendarId: project.calendarId ?? undefined,
      });
      performanceId = performance.id;
    }

    await updateOwnedVideoProject(user, projectId, { status: 'published', performanceId });
    const updated = await requireOwnedVideoProject(user, projectId);

    if (project.calendarId) {
      await prisma.contentCalendar.updateMany({
        where: { id: project.calendarId, tenantId: user.tenantId, userId: user.id },
        data: { status: 'published', contentId: projectId },
      });
    }

    return updated;
  },
};
