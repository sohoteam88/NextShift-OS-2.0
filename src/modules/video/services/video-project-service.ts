import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';
import type { MasterScript, VideoHook, VideoProductionInput, VideoStrategy } from '../types';
import { masterScriptService } from './master-script-service';
import { videoStrategyService } from './video-strategy-service';
import { AppError } from '@/lib/errors';

const ownerWhere = (user: AuthUser, id: string) => ({ id, tenantId: user.tenantId, userId: user.id });

export async function requireOwnedVideoProject(user: AuthUser, id: string) {
  const project = await prisma.videoProject.findFirst({ where: ownerWhere(user, id) });
  if (!project) throw new AppError('NOT_FOUND', 404, 'Video project not found');
  return project;
}

export async function updateOwnedVideoProject(user: AuthUser, id: string, data: Prisma.VideoProjectUpdateManyMutationInput) {
  const result = await prisma.videoProject.updateMany({ where: ownerWhere(user, id), data });
  if (result.count !== 1) throw new AppError('NOT_FOUND', 404, 'Video project not found');
}

export const videoProjectService = {
  async startProject(user: AuthUser, input: VideoProductionInput) {
    const strategy = await videoStrategyService.buildStrategy(user, input);
    const hook = await masterScriptService.generateHook(user, input, strategy);

    const project = await prisma.videoProject.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        calendarId: input.calendar_id,
        topic: input.topic,
        contentPillar: input.content_pillar,
        funnelStage: input.funnel_stage,
        platform: input.platform,
        duration: input.duration,
        style: input.style,
        strategy: strategy as unknown as Prisma.InputJsonValue,
        masterScript: { hook } as unknown as Prisma.InputJsonValue,
        status: 'draft',
      },
    });

    return { project, strategy, hook };
  },

  async generateFullScript(user: AuthUser, projectId: string, chosenHook: VideoHook, input: VideoProductionInput) {
    const project = await requireOwnedVideoProject(user, projectId);

    const strategy = project.strategy as unknown as VideoStrategy;
    const masterScript = await masterScriptService.generateScript(user, input, strategy, chosenHook);

    await updateOwnedVideoProject(user, projectId, { masterScript: masterScript as unknown as Prisma.InputJsonValue, status: 'scripted' });

    const scriptedCount = await prisma.videoProject.count({
      where: { tenantId: user.tenantId, userId: user.id, status: { in: ['scripted', 'shot_planned', 'ready', 'published'] } },
    });
    const mission = scriptedCount === 1 ? await notifyMissionProgress(user, 'first_video_generated') : null;

    return { masterScript, mission };
  },

  async regenerateScene(user: AuthUser, projectId: string, sceneNumber: number, instruction: string) {
    const project = await requireOwnedVideoProject(user, projectId);

    const script = project.masterScript as unknown as MasterScript;
    const newScene = await masterScriptService.regenerateScene(user, script, sceneNumber, instruction);
    const scenes = script.scenes.map((scene) => scene.scene_number === sceneNumber ? newScene : scene);
    const nextScript = {
      ...script,
      scenes,
      cta: script.cta.scene_number === sceneNumber ? newScene : script.cta,
    };

    await updateOwnedVideoProject(user, projectId, { masterScript: nextScript as unknown as Prisma.InputJsonValue });

    return newScene;
  },

  async get(user: AuthUser, projectId: string) {
    return prisma.videoProject.findFirst({ where: ownerWhere(user, projectId) });
  },

  async list(user: AuthUser, filters?: { status?: string; platform?: string }) {
    return prisma.videoProject.findMany({
      where: {
        tenantId: user.tenantId,
        userId: user.id,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.platform ? { platform: filters.platform } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async delete(user: AuthUser, projectId: string) {
    const result = await prisma.videoProject.deleteMany({ where: ownerWhere(user, projectId) });
    if (result.count !== 1) throw new AppError('NOT_FOUND', 404, 'Video project not found');
    return { deleted: true };
  },
};
