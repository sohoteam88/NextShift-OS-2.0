// Reuses existing VideoProject Prisma model
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';
import type { VideoBrief, VideoPackage } from './types';
import { generateVideoStrategy, generateHooks, generateShotList, generateBrollList, generateVeoPrompt, generateMiniMaxPrompt, generateCapCutScript, generateSubtitles, generatePlatformAdaptations, scriptForDuration } from './videoGenerators';
import { validateVideoPackage } from './videoQualityValidator';

async function createFullPackage(ctx: Awaited<ReturnType<typeof getBrandContext>>, brief: VideoBrief): Promise<VideoPackage> {
  if (!ctx) throw new Error('Brand DNA not found');

  const strategy = generateVideoStrategy(ctx, brief);
  const hooks = generateHooks(ctx, brief);
  const selectedHook = hooks[0].text;
  const masterScript = scriptForDuration(ctx, selectedHook, brief); // fallback inline
  const shotList = generateShotList(brief);
  const brollList = generateBrollList();
  const veoPrompt = generateVeoPrompt(brief, shotList, ctx);
  const minimaxPrompt = generateMiniMaxPrompt(brief, shotList);
  const capcutScript = generateCapCutScript(brief.videoLength);
  const subtitles = generateSubtitles(masterScript);
  const platformAdaptations = generatePlatformAdaptations(ctx, brief);

  const pkg: VideoPackage = { brief, strategy, hooks, selectedHook, masterScript, shotList, brollList, veoPrompt, minimaxPrompt, capcutScript, subtitles, platformAdaptations, qualityScore: 0, status: 'scripted' };
  pkg.qualityScore = validateVideoPackage(pkg).score;
  return pkg;
}

export const videoProductionService = {
  async generateVideoPackage(userId: string, tenantId: string, brief: VideoBrief): Promise<VideoPackage> {
    const ctx = await getBrandContext(userId);
    if (!ctx) throw new Error('Brand DNA not found. Complete Brand Discovery first.');

    const pkg = await createFullPackage(ctx, brief);

    // Save to VideoProject
    await prisma.videoProject.create({
      data: {
        tenantId,
        userId,
        topic: brief.contentPillar,
        contentPillar: brief.contentPillar,
        funnelStage: brief.funnelStage,
        platform: brief.platformType,
        duration: `${brief.videoLength}s`,
        style: brief.videoType,
        strategy: pkg.strategy as unknown as Prisma.InputJsonValue,
        masterScript: { hook: pkg.selectedHook, script: pkg.masterScript } as unknown as Prisma.InputJsonValue,
        shotList: pkg.shotList as unknown as Prisma.InputJsonValue,
        brollList: pkg.brollList as unknown as Prisma.InputJsonValue,
        veoPrompt: pkg.veoPrompt,
        minimaxPrompt: pkg.minimaxPrompt,
        capcutScript: { timeline: pkg.capcutScript } as unknown as Prisma.InputJsonValue,
        subtitleSrt: pkg.subtitles,
        platformAdaptations: pkg.platformAdaptations as unknown as Prisma.InputJsonValue,
        status: 'draft',
      },
    });

    return pkg;
  },

  async getLatestPackage(userId: string): Promise<VideoPackage | null> {
    // Read from VideoProject model (canonical source)
    const vp = await prisma.videoProject.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
    if (!vp) return null;
    // Reconstruct VideoPackage from VideoProject fields
    const strategy = (vp.strategy as unknown as VideoPackage['strategy']) ?? {} as VideoPackage['strategy'];
    const brief = { contentPillar: vp.contentPillar, audiencePain: '', funnelStage: vp.funnelStage as VideoPackage['brief']['funnelStage'], platformType: vp.platform as VideoPackage['brief']['platformType'], videoType: vp.style as VideoPackage['brief']['videoType'], videoLength: parseInt(vp.duration) as VideoPackage['brief']['videoLength'] || 30, tone: '', ctaGoal: '' };
    return { brief, strategy, hooks: [], selectedHook: ((vp.masterScript as Record<string,unknown>)?.hook as string) ?? '', masterScript: ((vp.masterScript as Record<string,unknown>)?.script as string) ?? '', shotList: (vp.shotList as unknown as VideoPackage['shotList']) ?? [], brollList: (vp.brollList as unknown as VideoPackage['brollList']) ?? [], veoPrompt: vp.veoPrompt ?? '', minimaxPrompt: vp.minimaxPrompt ?? '', capcutScript: ((vp.capcutScript as Record<string,unknown>)?.timeline as string) ?? '', subtitles: vp.subtitleSrt ?? '', platformAdaptations: (vp.platformAdaptations as unknown as VideoPackage['platformAdaptations']) ?? [], qualityScore: 0, status: (vp.status as VideoPackage['status']) };
  },

  async markReady(userId: string) {
    const projects = await prisma.videoProject.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 1 });
    if (projects.length === 0) throw new Error('No video project found');
    await prisma.videoProject.update({ where: { id: projects[0].id }, data: { status: 'scripted' } });
  },
};

