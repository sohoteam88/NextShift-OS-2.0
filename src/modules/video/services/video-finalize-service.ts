import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import { postPerformanceService } from '@/modules/brand-builder/services/post-performance-service';
import type { MasterScript, PlatformType, VideoStrategy } from '../types';
import { capcutService } from './capcut-service';
import { platformAdaptationService } from './platform-adaptation-service';
import { subtitleService } from './subtitle-service';

async function getBrandProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
  return ((user?.metadata as Record<string, unknown>)?.brand_profile as Record<string, unknown> | undefined) ?? null;
}

export const videoFinalizeService = {
  async finalize(user: AuthUser, projectId: string, additionalPlatforms: PlatformType[] = []) {
    const project = await prisma.videoProject.findFirst({ where: { id: projectId, tenantId: user.tenantId } });
    if (!project) throw new Error('Project not found');

    const script = project.masterScript as unknown as MasterScript;
    const strategy = project.strategy as unknown as VideoStrategy;
    if (!script?.scenes?.length) throw new Error('Master script not ready');

    const brandProfile = await getBrandProfile(user.id);
    const [capcutScript, platformAdaptations] = await Promise.all([
      capcutService.generate(user, script, String(brandProfile?.personality ?? 'friendly')),
      platformAdaptationService.generate(user, script, strategy, project.platform as PlatformType, additionalPlatforms),
    ]);
    const subtitleSrt = subtitleService.generateSRT(script);
    const existingAdaptations = (project.platformAdaptations as Record<string, unknown> | null) ?? {};

    await prisma.videoProject.update({
      where: { id: projectId },
      data: {
        capcutScript: capcutScript as unknown as Prisma.InputJsonValue,
        subtitleSrt,
        platformAdaptations: {
          ...existingAdaptations,
          posting_adaptations: platformAdaptations,
        } as unknown as Prisma.InputJsonValue,
        status: 'ready',
      },
    });

    return { capcutScript, subtitleSrt, platformAdaptations };
  },

  async markPublished(
    user: AuthUser,
    projectId: string,
    input: { create_performance_record?: boolean; platform?: string } = {},
  ) {
    const project = await prisma.videoProject.findFirst({ where: { id: projectId, tenantId: user.tenantId } });
    if (!project) throw new Error('Project not found');

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

    const updated = await prisma.videoProject.update({
      where: { id: projectId },
      data: { status: 'published', performanceId },
    });

    if (project.calendarId) {
      await prisma.contentCalendar.updateMany({
        where: { id: project.calendarId, tenantId: user.tenantId, userId: user.id },
        data: { status: 'published', contentId: projectId },
      });
    }

    return updated;
  },
};
