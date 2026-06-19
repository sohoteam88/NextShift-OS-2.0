import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';
import { funnelService } from '@/modules/funnel/services/funnel-service';
import type { FunnelConfig, FunnelSection, FunnelTheme } from '@/modules/funnel/types';
import type { LeadMagnetType, LeadMagnetConfig } from './types';
import { generateLeadMagnet } from './leadMagnetGenerators';
import { validateLeadMagnet } from './leadMagnetValidator';

const DEFAULT_THEME: FunnelTheme = { primary_color: '#2563eb', bg_color: '#ffffff', font: 'system' };

function buildLandingPageConfig(config: LeadMagnetConfig): FunnelConfig {
  const landing = config.landingPage;
  if (!landing) throw new Error('Landing page not generated');

  const sections: FunnelSection[] = [
    {
      type: 'hero',
      headline: landing.headline,
      subheadline: landing.subheadline,
      cta_text: landing.ctaText,
      cta_type: 'form',
      cta_target: '#form',
    },
    {
      type: 'pain',
      title: '这份资源适合你，如果你正在遇到这些问题',
      items: landing.painBullets.map((text) => ({ text })),
    },
    {
      type: 'mechanism',
      title: '为什么这份资源有效',
      description: landing.mechanism,
    },
    {
      type: 'benefits',
      title: '你会拿到什么',
      items: landing.benefitBullets.map((benefit, index) => ({
        icon: ['check', 'target', 'sparkles'][index] ?? 'check',
        title: benefit,
        description: index === 0 ? config.promise : '帮助你更快进入下一步行动。',
      })),
    },
    {
      type: 'form',
      title: landing.formTitle,
      fields: ['name', 'whatsapp'],
      submit_text: landing.ctaText,
      success_message: '资源领取成功，我们会通过 WhatsApp 发送下一步。',
    },
    {
      type: 'cta',
      headline: config.cta.headline,
      subheadline: config.cta.description,
      button_text: landing.ctaText,
      button_type: 'form',
      button_target: '#form',
    },
  ];

  return {
    type: 'lead_magnet',
    theme: DEFAULT_THEME,
    sections,
  };
}

export const leadMagnetService = {
  async generate(userId: string, type: LeadMagnetType): Promise<LeadMagnetConfig> {
    const ctx = await getBrandContext(userId);
    if (!ctx) throw new Error('Brand DNA not found');

    const config = generateLeadMagnet(ctx, type);
    config.qualityScore = validateLeadMagnet(config).score;
    await this.save(userId, config);
    return config;
  },

  async publish(user: AuthUser): Promise<LeadMagnetConfig> {
    const config = await this.get(user.id);
    if (!config) throw new Error('Lead magnet not generated');

    const funnelConfig = buildLandingPageConfig(config);
    const funnel = await funnelService.createInternal({
      tenantId: user.tenantId,
      ownerId: user.id,
      title: config.landingPage?.headline ?? config.title,
      config: funnelConfig as unknown as Record<string, unknown>,
    });
    const published = await funnelService.publish(user, funnel.id);
    const nextConfig: LeadMagnetConfig = {
      ...config,
      status: 'published',
      landingPage: {
        ...config.landingPage!,
        funnelId: published.id,
        publicPath: `/f/${published.slug}`,
        publishedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    await this.save(user.id, nextConfig);
    return nextConfig;
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
    return { title: config.title, promise: config.promise, audience: config.audiencePain, CTA: config.cta, landingPage: config.landingPage, leadSegments: config.segmentation };
  },
};
