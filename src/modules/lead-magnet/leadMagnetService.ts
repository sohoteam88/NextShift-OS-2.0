import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';
import { funnelService } from '@/modules/funnel/services/funnel-service';
import type {
  FunnelConfig,
  FunnelSection,
  FunnelTheme,
} from '@/modules/funnel/types';
import type {
  LeadMagnetType,
  LeadMagnetConfig,
  LeadMagnetTrack,
} from './types';
import { generateLeadMagnet } from './leadMagnetGenerators';
import { validateLeadMagnet } from './leadMagnetValidator';

const DEFAULT_THEME: FunnelTheme = {
  primary_color: '#2563eb',
  bg_color: '#ffffff',
  font: 'system',
};
const LEAD_MAGNET_TRACKS: LeadMagnetTrack[] = ['retail', 'recruitment'];

function isLeadMagnetConfig(value: unknown): value is LeadMagnetConfig {
  return Boolean(
    value &&
    typeof value === 'object' &&
    typeof (value as Partial<LeadMagnetConfig>).title === 'string',
  );
}

function adaptConfigForTrack(
  config: LeadMagnetConfig,
  track: LeadMagnetTrack,
): LeadMagnetConfig {
  if (track === 'retail') {
    return {
      ...config,
      track,
      title: config.title.replace(
        /行动清单|启动指南|快速启动模板/g,
        (match) => `客户${match}`,
      ),
      cta: {
        ...config.cta,
        buttonText: '领取资源',
        whatsappCta:
          config.cta.whatsappCta ||
          '你好，我想领取资源，并了解适合我的下一步方案。',
        funnelCta: '进入领取页',
      },
    };
  }

  const recruitmentTitle = config.title.replace(
    /行动清单|启动指南|快速启动模板/g,
    (match) => `伙伴${match}`,
  );
  const promise =
    '帮助想开始副业或了解合作机会的人，看清适不适合、怎么起步，以及下一步该问什么。';

  return {
    ...config,
    track,
    title: recruitmentTitle,
    promise,
    description: promise,
    landingPage: config.landingPage
      ? {
          ...config.landingPage,
          headline: recruitmentTitle,
          subheadline: promise,
          formTitle: '免费领取合作起步资源',
          ctaText: '了解合作',
        }
      : config.landingPage,
    cta: {
      ...config.cta,
      headline: '领取你的合作起步资源',
      buttonText: '了解合作',
      description: '留下联系方式，系统会把起步资源和下一步合作说明发送给你。',
      whatsappCta: '你好，我想了解合作机会，并领取新手起步资源。',
      funnelCta: '进入合作领取页',
    },
    resultPage: {
      ...config.resultPage,
      explanation: promise,
      recommendations: [
        '领取合作起步资源',
        '确认自己适合的开始方式',
        '通过 WhatsApp 了解团队支持',
      ],
      nextAction: '领取资源后进入 WhatsApp 了解合作路径',
    },
    segmentation: {
      ...config.segmentation,
      nextAction: '领取合作资源并进入 WhatsApp 跟进',
      followUpStrategy:
        '发送资源后，先确认对方目标、可投入时间和想了解的合作疑问。',
    },
  };
}

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
        description:
          index === 0 ? config.promise : '帮助你更快进入下一步行动。',
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
  async generate(
    userId: string,
    type: LeadMagnetType,
    track: LeadMagnetTrack = 'retail',
  ): Promise<LeadMagnetConfig> {
    const ctx = await getBrandContext(userId);
    if (!ctx) throw new Error('请先完成品牌资料');

    const config = adaptConfigForTrack(generateLeadMagnet(ctx, type), track);
    config.qualityScore = validateLeadMagnet(config).score;
    await this.saveTrack(userId, track, config);
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          ...meta,
          lead_magnet: config as unknown as Prisma.InputJsonValue,
        } as Prisma.InputJsonValue,
      },
    });
    return config;
  },

  async saveTrack(
    userId: string,
    track: LeadMagnetTrack,
    config: LeadMagnetConfig,
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    const existing =
      meta.lead_magnet_tracks && typeof meta.lead_magnet_tracks === 'object'
        ? (meta.lead_magnet_tracks as Record<string, unknown>)
        : {};

    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          ...meta,
          lead_magnet:
            track === 'retail'
              ? (config as unknown as Prisma.InputJsonValue)
              : meta.lead_magnet,
          lead_magnet_tracks: {
            ...existing,
            [track]: config,
          },
        } as unknown as Prisma.InputJsonValue,
      },
    });
    return config;
  },

  async get(userId: string): Promise<LeadMagnetConfig | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    const lm = meta.lead_magnet;
    return lm && typeof lm === 'object' ? (lm as LeadMagnetConfig) : null;
  },

  async getTracks(
    userId: string,
  ): Promise<Record<LeadMagnetTrack, LeadMagnetConfig | null>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    const stored =
      meta.lead_magnet_tracks && typeof meta.lead_magnet_tracks === 'object'
        ? (meta.lead_magnet_tracks as Record<string, unknown>)
        : {};

    return LEAD_MAGNET_TRACKS.reduce(
      (acc, track) => {
        acc[track] = isLeadMagnetConfig(stored[track]) ? stored[track] : null;
        return acc;
      },
      {} as Record<LeadMagnetTrack, LeadMagnetConfig | null>,
    );
  },

  async getContext(userId: string) {
    const config = await this.get(userId);
    if (!config) return null;
    return {
      title: config.title,
      promise: config.promise,
      audience: config.audiencePain,
      CTA: config.cta,
      landingPage: config.landingPage,
      leadSegments: config.segmentation,
    };
  },
};
