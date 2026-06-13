import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';
import type { LeadMagnetType, LeadMagnetConfig } from './types';
import { generateAssessment, generateQuiz, generateChecklist } from './leadMagnetGenerators';
import { validateLeadMagnet } from './leadMagnetValidator';

export const leadMagnetService = {
  async generate(userId: string, type: LeadMagnetType, audiencePain: string): Promise<LeadMagnetConfig> {
    const ctx = await getBrandContext(userId);
    if (!ctx) throw new Error('Brand DNA not found');

    let config: LeadMagnetConfig;
    switch (type) {
      case 'assessment': config = generateAssessment(ctx, audiencePain); break;
      case 'quiz': config = generateQuiz(ctx, audiencePain); break;
      case 'checklist': config = generateChecklist(ctx, audiencePain); break;
      default: throw new Error(`Unknown type: ${type}`);
    }

    config.qualityScore = validateLeadMagnet(config).score;
    await this.save(userId, config);
    return config;
  },

  async save(userId: string, config: LeadMagnetConfig) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    await prisma.user.update({
      where: { id: userId },
      data: { metadata: { ...meta, lead_magnet: config as unknown as Prisma.InputJsonValue } as Prisma.InputJsonValue },
    });
    return config;
  },

  async get(userId: string): Promise<LeadMagnetConfig | null> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    const lm = meta.lead_magnet;
    return lm && typeof lm === 'object' ? (lm as LeadMagnetConfig) : null;
  },

  async getContext(userId: string) {
    const config = await this.get(userId);
    if (!config) return null;
    return { title: config.title, promise: config.promise, audience: config.audiencePain, CTA: config.cta, resultLogic: config.scoreCategories, leadSegments: config.segmentation };
  },
};
