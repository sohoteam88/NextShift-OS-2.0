import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';
import type { MasterScript, VideoHook, VideoProductionInput, VideoStrategy } from '../types';
import { masterScriptService } from './master-script-service';
import { videoStrategyService } from './video-strategy-service';

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
    const project = await prisma.videoProject.findFirst({ where: { id: projectId, tenantId: user.tenantId } });
    if (!project) throw new Error('Project not found');

    const strategy = project.strategy as unknown as VideoStrategy;
    const masterScript = await masterScriptService.generateScript(user, input, strategy, chosenHook);

    await prisma.videoProject.update({
      where: { id: projectId },
      data: { masterScript: masterScript as unknown as Prisma.InputJsonValue, status: 'scripted' },
    });

    const scriptedCount = await prisma.videoProject.count({
      where: { tenantId: user.tenantId, userId: user.id, status: { in: ['scripted', 'shot_planned', 'ready', 'published'] } },
    });
    const mission = scriptedCount === 1 ? await notifyMissionProgress(user, 'first_video_generated') : null;

    return { masterScript, mission };
  },

  async regenerateScene(user: AuthUser, projectId: string, sceneNumber: number, instruction: string) {
    const project = await prisma.videoProject.findFirst({ where: { id: projectId, tenantId: user.tenantId } });
    if (!project) throw new Error('Project not found');

    const script = project.masterScript as unknown as MasterScript;
    const newScene = await masterScriptService.regenerateScene(user, script, sceneNumber, instruction);
    const scenes = script.scenes.map((scene) => scene.scene_number === sceneNumber ? newScene : scene);
    const nextScript = {
      ...script,
      scenes,
      cta: script.cta.scene_number === sceneNumber ? newScene : script.cta,
    };

    await prisma.videoProject.update({
      where: { id: projectId },
      data: { masterScript: nextScript as unknown as Prisma.InputJsonValue },
    });

    return newScene;
  },

  async get(user: AuthUser, projectId: string) {
    return prisma.videoProject.findFirst({ where: { id: projectId, tenantId: user.tenantId } });
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
    await prisma.videoProject.deleteMany({ where: { id: projectId, tenantId: user.tenantId, userId: user.id } });
    return { deleted: true };
  },
};
