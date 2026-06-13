// ============================================================
// Social Setup Service
// Reads/writes social setup in user.metadata.social_setup.
// All generation powered by BrandContextProvider.
// ============================================================

import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';
import type { SocialSetup } from './types';
import { EMPTY_SOCIAL_SETUP } from './types';
import { generateFacebookSetup, generateInstagramSetup, generateVisualSetup } from './socialPromptGenerator';
import { validateSocialSetup } from './socialSetupValidator';

export const socialSetupService = {
  async getSetup(userId: string): Promise<SocialSetup> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    });

    const metadata = (user?.metadata as Record<string, unknown>) ?? {};
    const setup = metadata.social_setup as SocialSetup | null;
    return setup ?? { ...EMPTY_SOCIAL_SETUP };
  },

  async generateSetup(userId: string): Promise<SocialSetup> {
    const ctx = await getBrandContext(userId);
    if (!ctx) throw new Error('Brand DNA not found. Complete Brand Discovery first.');

    const facebook = generateFacebookSetup(ctx);
    const instagram = generateInstagramSetup(ctx);
    const visual = generateVisualSetup(ctx);

    const linkStrategy = ctx.offer.primary
      ? `主链接目标: ${ctx.offer.primary}。建议使用 Linktree 或类似工具聚合多个链接。`
      : '建议设置一个聚合链接页面（如 Linktree）来展示你的主要服务和联系方式。';

    const now = new Date().toISOString();
    const setup: SocialSetup = {
      facebook,
      instagram,
      visual,
      linkStrategy,
      status: 'generated',
      createdAt: now,
      updatedAt: now,
    };

    await this.saveSetup(userId, setup);
    return setup;
  },

  async saveSetup(userId: string, setup: SocialSetup): Promise<SocialSetup> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    });

    const existingMeta = (user?.metadata as Record<string, unknown>) ?? {};
    const updated: SocialSetup = { ...setup, updatedAt: new Date().toISOString(), status: 'saved' };

    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          ...existingMeta,
          social_setup: updated as unknown as Prisma.InputJsonValue,
        } as Prisma.InputJsonValue,
      },
    });

    return updated;
  },

  async updateField<K extends keyof SocialSetup>(
    userId: string,
    field: K,
    value: SocialSetup[K],
  ): Promise<SocialSetup> {
    const current = await this.getSetup(userId);
    return this.saveSetup(userId, { ...current, [field]: value });
  },

  async getReadiness(userId: string) {
    const setup = await this.getSetup(userId);
    return validateSocialSetup(setup);
  },
};
