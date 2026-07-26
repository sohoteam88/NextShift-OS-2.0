import { Prisma } from '@prisma/client';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { AIVideoPromptResult, BRollItem, MasterScript } from '../types';
import { aiVideoPromptService } from './ai-video-prompt-service';
import { brollService } from './broll-service';
import { shotListService } from './shot-list-service';
import { requireOwnedVideoProject, updateOwnedVideoProject } from './video-project-service';
import { generationMetadata } from './json';

export const productionPlanService = {
  async generateProductionPlan(user: AuthUser, projectId: string) {
    const project = await requireOwnedVideoProject(user, projectId);

    const script = project.masterScript as unknown as MasterScript;
    if (!script?.scenes?.length) throw new Error('Master script not ready');

    const [shotListGeneration, brollListGeneration] = await Promise.all([
      shotListService.generate(user, script, project.style, project.platform),
      brollService.generate(user, script, project.style, project.platform),
    ]);
    const shotList = shotListGeneration.value;
    const brollList = brollListGeneration.value;

    let aiScenes = [...new Set(
      brollList
        .filter((item: BRollItem) => item.source_suggestion === 'ai_generated')
        .map((item) => item.scene_number),
    )];

    if (project.style === 'faceless' && aiScenes.length === 0) {
      aiScenes = script.scenes.map((scene) => scene.scene_number);
    }

    let veoResult: AIVideoPromptResult | null = null;
    let minimaxResult: AIVideoPromptResult | null = null;
    const generations: Array<{ status: 'success' | 'degraded'; userVisibleLabel?: string }> = [
      shotListGeneration,
      brollListGeneration,
    ];

    if (aiScenes.length > 0) {
      const [veoGeneration, minimaxGeneration] = await Promise.all([
        aiVideoPromptService.generateVeoPrompt(user, script, project.platform, aiScenes),
        aiVideoPromptService.generateMiniMaxPrompt(user, script, project.platform, aiScenes),
      ]);
      veoResult = veoGeneration.value;
      minimaxResult = minimaxGeneration.value;
      generations.push(veoGeneration, minimaxGeneration);
    }

    await updateOwnedVideoProject(user, projectId, {
        shotList: shotList as unknown as Prisma.InputJsonValue,
        brollList: brollList as unknown as Prisma.InputJsonValue,
        veoPrompt: veoResult?.combined ?? null,
        minimaxPrompt: minimaxResult?.combined ?? null,
        platformAdaptations: {
          ai_video_prompts: {
            veo: veoResult,
            minimax: minimaxResult,
          },
        } as unknown as Prisma.InputJsonValue,
        status: 'shot_planned',
    });

    return {
      shotList,
      brollList,
      veoPrompts: veoResult,
      minimaxPrompts: minimaxResult,
      aiScenes,
      generation: generationMetadata(generations),
    };
  },
};
