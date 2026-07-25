import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import { getBrandContext, getBrandDnaVersion } from '@/modules/brand-dna/services/BrandContextProvider';
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
import type { WorkspaceContext } from '@/modules/workspace/types';
import { generateLeadMagnet } from './leadMagnetGenerators';
import { validateLeadMagnet } from './leadMagnetValidator';
import { AppError } from '@/lib/errors';
import {
  buildGenerationContext,
  GENERATION_DEGRADE_LABEL,
  runGeneration,
} from '@/modules/ai/generation';
import { getBusinessPackSlice } from '@/modules/ai/business-pack';
import { enforceComplianceHardFilter } from '@/modules/ai/compliance';
import {
  buildLeadMagnetUserMessage,
  LEAD_MAGNET_JSON_SYSTEM_INSTRUCTION,
  parseGeneratedLeadMagnet,
} from './leadMagnetPostGeneration';

const DEFAULT_THEME: FunnelTheme = {
  primary_color: '#2563eb',
  bg_color: '#ffffff',
  font: 'system',
};
const LEAD_MAGNET_TRACKS: LeadMagnetTrack[] = ['retail', 'recruitment'];

async function withLockedUser<T>(
  userId: string,
  mutate: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id" FROM "users" WHERE "id" = ${userId}::uuid FOR UPDATE
    `);
    if (locked.length !== 1) throw new AppError('NOT_FOUND', 404, 'User not found');
    return mutate(tx);
  });
}

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

function isLeadMagnetTrack(value: unknown): value is LeadMagnetTrack {
  return value === 'retail' || value === 'recruitment';
}

function resolveWorkspaceTrack(
  track: LeadMagnetTrack,
  workspaceContext?: WorkspaceContext,
): LeadMagnetTrack {
  const configuredTrack = workspaceContext?.workspaceConfig.contentTrack;
  return isLeadMagnetTrack(configuredTrack) ? configuredTrack : track;
}

function workspaceMetadata(workspaceContext?: WorkspaceContext): LeadMagnetConfig['workspaceContext'] {
  if (!workspaceContext) return undefined;

  return {
    workspaceId: workspaceContext.workspaceId,
    workspaceType: workspaceContext.workspaceType,
    templateNamespace: workspaceContext.templateNamespace,
    themeKey: workspaceContext.themeKey,
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

const MAX_COMPLIANCE_RETRIES = 2;

/** Filters every public copy destination through G4 before it can be returned or stored. */
function filterLeadMagnetForPublicOutput(config: LeadMagnetConfig, track: LeadMagnetTrack): LeadMagnetConfig | null {
  let rejected = false;
  const text = (value: string) => {
    const verdict = enforceComplianceHardFilter({
      fields: { title: '', hook: '', body: value, cta: '', hashtags: [] },
      track,
    });
    if (verdict.status === 'rejected') {
      rejected = true;
      return value;
    }
    return verdict.fields.body;
  };
  const texts = (values: string[]) => values.map(text);
  const landingPage = config.landingPage && {
    ...config.landingPage,
    headline: text(config.landingPage.headline), subheadline: text(config.landingPage.subheadline),
    painBullets: texts(config.landingPage.painBullets), mechanism: text(config.landingPage.mechanism),
    benefitBullets: texts(config.landingPage.benefitBullets), formTitle: text(config.landingPage.formTitle), ctaText: text(config.landingPage.ctaText),
  };
  const cta = {
    ...config.cta,
    headline: text(config.cta.headline), buttonText: text(config.cta.buttonText),
    description: text(config.cta.description), whatsappCta: text(config.cta.whatsappCta), funnelCta: text(config.cta.funnelCta),
  };
  const resultCta = {
    ...config.resultPage.cta,
    headline: text(config.resultPage.cta.headline), buttonText: text(config.resultPage.cta.buttonText),
    description: text(config.resultPage.cta.description), whatsappCta: text(config.resultPage.cta.whatsappCta), funnelCta: text(config.resultPage.cta.funnelCta),
  };
  const next: LeadMagnetConfig = {
    ...config,
    title: text(config.title), promise: text(config.promise), description: text(config.description), audiencePain: text(config.audiencePain),
    ...(landingPage ? { landingPage } : {}), cta,
    ...(config.sections ? { sections: config.sections.map((section) => ({ ...section, title: text(section.title), body: text(section.body), bullets: texts(section.bullets) })) } : {}),
    ...(config.checklistItems ? { checklistItems: config.checklistItems.map((item) => ({ ...item, text: text(item.text) })) } : {}),
    resultPage: {
      ...config.resultPage,
      scoreLabel: text(config.resultPage.scoreLabel), categoryLabel: text(config.resultPage.categoryLabel),
      explanation: text(config.resultPage.explanation), recommendations: texts(config.resultPage.recommendations),
      nextAction: text(config.resultPage.nextAction), cta: resultCta,
    },
    segmentation: {
      ...config.segmentation,
      nextAction: text(config.segmentation.nextAction), followUpStrategy: text(config.segmentation.followUpStrategy),
    },
  };
  return rejected ? null : next;
}

function buildSafeBaseLeadMagnet(config: LeadMagnetConfig): LeadMagnetConfig {
  const cta = { headline: '准备好开始下一步吗？', buttonText: '领取资源', description: '留下联系方式以接收资源和下一步说明。', whatsappCta: '你好，我想领取这份资源。', funnelCta: '进入领取页' };
  return {
    ...config,
    title: '实用行动资源', promise: '用一份清晰资源整理你的下一步行动。', description: '用一份清晰资源整理你的下一步行动。', audiencePain: '不知道下一步该从哪里开始。', cta,
    ...(config.landingPage ? { landingPage: { ...config.landingPage, headline: '从一个清晰的小行动开始', subheadline: '领取资源，整理适合自己的下一步。', painBullets: ['不知道先做什么', '行动容易中断', '需要一份清晰指引'], mechanism: '通过简单步骤，把想法整理成可执行行动。', benefitBullets: ['看清当前重点', '完成一个小行动', '获得下一步指引'], formTitle: '领取资源', ctaText: '领取资源' } } : {}),
    ...(config.sections ? { sections: config.sections.map((section, index) => ({ ...section, title: `行动步骤 ${index + 1}`, body: '从一个小行动开始，并根据自己的情况调整。', bullets: ['确认当前重点', '完成一个小行动', '记录你的发现'] })) } : {}),
    ...(config.checklistItems ? { checklistItems: config.checklistItems.map((item, index) => ({ ...item, text: `完成行动步骤 ${index + 1}` })) } : {}),
    resultPage: { ...config.resultPage, scoreLabel: '你的下一步', categoryLabel: '资源已准备好', explanation: '从一个小行动开始，慢慢建立适合自己的节奏。', recommendations: ['阅读资源', '完成第一步', '需要时寻求支持'], nextAction: '领取资源后完成第一步', cta },
    segmentation: { ...config.segmentation, nextAction: '领取资源后完成第一步', followUpStrategy: '先了解对方的目标和当前需要。' },
  };
}

export const leadMagnetService = {
  async generate(
    userId: string,
    tenantId: string,
    type: LeadMagnetType,
    track: LeadMagnetTrack = 'retail',
    workspaceContext?: WorkspaceContext,
  ): Promise<LeadMagnetConfig> {
    const ctx = await getBrandContext(userId);
    if (!ctx) throw new Error('请先完成品牌资料');

    const activeTrack = resolveWorkspaceTrack(track, workspaceContext);
    const fallback = {
      ...adaptConfigForTrack(generateLeadMagnet(ctx, type), activeTrack),
      brandDnaVersion: await getBrandDnaVersion(userId),
      workspaceContext: workspaceMetadata(workspaceContext),
    };
    const user = { id: userId, tenantId };
    const platform = 'blog' as const;
    const businessPack = getBusinessPackSlice({ track: activeTrack, platform });
    const context = await buildGenerationContext(user, {
      mode: activeTrack,
      platform,
      businessPack: {
        ...businessPack,
        promptContext: [businessPack.promptContext, LEAD_MAGNET_JSON_SYSTEM_INSTRUCTION].filter(Boolean).join('\n\n'),
      },
    });
    const options = {
      context,
      userMessage: buildLeadMagnetUserMessage({ type, track: activeTrack, fallback }),
      taskCategory: 'content_generation' as const,
      feature: 'lead_magnet_generation',
      fallback,
      parse: (text: string) => parseGeneratedLeadMagnet(text, fallback),
      temperature: 0.7,
      maxTokens: 2_000,
    };
    let outcome = await runGeneration(user, options);
    let config = filterLeadMagnetForPublicOutput(outcome.value, activeTrack);
    let retries = 0;
    while (!config && outcome.source === 'ai' && retries < MAX_COMPLIANCE_RETRIES) {
      retries += 1;
      outcome = await runGeneration(user, options);
      config = filterLeadMagnetForPublicOutput(outcome.value, activeTrack);
    }
    let generatedByAi = outcome.source === 'ai';
    let degradedLabel = outcome.status === 'degraded' ? outcome.userVisibleLabel : undefined;
    if (!config) {
      config = filterLeadMagnetForPublicOutput(fallback, activeTrack)
        ?? filterLeadMagnetForPublicOutput(buildSafeBaseLeadMagnet(fallback), activeTrack)!;
      generatedByAi = false;
      degradedLabel = GENERATION_DEGRADE_LABEL;
    }
    config = { ...config, generatedByAi, ...(degradedLabel ? { degradedLabel } : {}) };
    config.qualityScore = validateLeadMagnet(config).score;
    await this.saveTrack(userId, activeTrack, config);
    return config;
  },

  async publish(user: AuthUser, workspaceContext?: WorkspaceContext): Promise<LeadMagnetConfig> {
    const config = await this.get(user.id);
    if (!config) throw new Error('Lead magnet not generated');

    const funnelConfig = buildLandingPageConfig(config);
    const funnel = await funnelService.createInternal({
      tenantId: user.tenantId,
      ownerId: user.id,
      title: config.landingPage?.headline ?? config.title,
      config: funnelConfig as unknown as Record<string, unknown>,
      workspaceContext,
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
      workspaceContext: workspaceMetadata(workspaceContext) ?? config.workspaceContext,
    };

    await this.save(user.id, nextConfig);
    return nextConfig;
  },

  async save(userId: string, config: LeadMagnetConfig) {
    const json = JSON.stringify(config);
    await withLockedUser(userId, async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      UPDATE "users"
      SET "metadata" = jsonb_set(COALESCE("metadata", '{}'::jsonb), '{lead_magnet}', ${json}::jsonb, true),
          "updated_at" = NOW()
      WHERE "id" = ${userId}::uuid RETURNING "id"
      `);
      if (rows.length !== 1) throw new AppError('NOT_FOUND', 404, 'User not found');
    });
    return config;
  },

  async saveTrack(
    userId: string,
    track: LeadMagnetTrack,
    config: LeadMagnetConfig,
  ) {
    const json = JSON.stringify(config);
    const metadataWithTracks = Prisma.sql`jsonb_set(COALESCE("metadata", '{}'::jsonb), '{lead_magnet_tracks}', COALESCE("metadata"->'lead_magnet_tracks', '{}'::jsonb), true)`;
    const nextMetadata = track === 'retail'
      ? Prisma.sql`jsonb_set(jsonb_set(${metadataWithTracks}, '{lead_magnet_tracks,retail}', ${json}::jsonb, true), '{lead_magnet}', ${json}::jsonb, true)`
      : Prisma.sql`jsonb_set(${metadataWithTracks}, '{lead_magnet_tracks,recruitment}', ${json}::jsonb, true)`;
    await withLockedUser(userId, async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        UPDATE "users" SET "metadata" = ${nextMetadata}, "updated_at" = NOW()
        WHERE "id" = ${userId}::uuid RETURNING "id"
      `);
      if (rows.length !== 1) throw new AppError('NOT_FOUND', 404, 'User not found');
    });
    return config;
  },

  async updateTrack(userId: string, track: LeadMagnetTrack, id: string, patch: { title?: string; promise?: string; description?: string; whatsappCta?: string }) {
    return withLockedUser(userId, async (tx) => {
      // The row lock is the concurrency authority: every patch is computed from
      // the latest committed canonical object. Disjoint patches merge; if two
      // patches target the same field, the last lock holder to commit wins.
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { metadata: true },
      });
      const metadata = (user?.metadata as Record<string, unknown>) ?? {};
      const stored =
        metadata.lead_magnet_tracks &&
        typeof metadata.lead_magnet_tracks === 'object'
          ? (metadata.lead_magnet_tracks as Record<string, unknown>)
          : {};
      const current = isLeadMagnetConfig(stored[track])
        ? stored[track]
        : null;
      if (!current || current.id !== id) {
        throw new AppError('NOT_FOUND', 404, 'Lead magnet not found');
      }

      const persisted: LeadMagnetConfig = {
        ...current,
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.promise !== undefined ? { promise: patch.promise } : {}),
        ...(patch.description !== undefined
          ? { description: patch.description }
          : {}),
        cta: {
          ...current.cta,
          ...(patch.whatsappCta !== undefined
            ? { whatsappCta: patch.whatsappCta }
            : {}),
        },
        updatedAt: new Date().toISOString(),
      };
      const json = JSON.stringify(persisted);
      const idPath = track === 'retail'
        ? Prisma.sql`'{lead_magnet_tracks,retail,id}'`
        : Prisma.sql`'{lead_magnet_tracks,recruitment,id}'`;
      const nextMetadata = track === 'retail'
        ? Prisma.sql`jsonb_set(jsonb_set(COALESCE("metadata", '{}'::jsonb), '{lead_magnet_tracks,retail}', ${json}::jsonb, true), '{lead_magnet}', ${json}::jsonb, true)`
        : Prisma.sql`jsonb_set(COALESCE("metadata", '{}'::jsonb), '{lead_magnet_tracks,recruitment}', ${json}::jsonb, true)`;
      const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        UPDATE "users" SET "metadata" = ${nextMetadata}, "updated_at" = NOW()
        WHERE "id" = ${userId}::uuid AND "metadata" #>> ${idPath} = ${id}
        RETURNING "id"
      `);
      if (rows.length !== 1) throw new AppError('NOT_FOUND', 404, 'Lead magnet not found');
      return persisted;
    });
  },

  async deleteTrack(userId: string, track: LeadMagnetTrack, id: string) {
    const idPath = track === 'retail' ? Prisma.sql`'{lead_magnet_tracks,retail,id}'` : Prisma.sql`'{lead_magnet_tracks,recruitment,id}'`;
    const nextMetadata = track === 'retail'
      ? Prisma.sql`COALESCE("metadata", '{}'::jsonb) #- '{lead_magnet_tracks,retail}' #- '{lead_magnet}'`
      : Prisma.sql`COALESCE("metadata", '{}'::jsonb) #- '{lead_magnet_tracks,recruitment}'`;
    await withLockedUser(userId, async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        UPDATE "users" SET "metadata" = ${nextMetadata}, "updated_at" = NOW()
        WHERE "id" = ${userId}::uuid AND "metadata" #>> ${idPath} = ${id}
        RETURNING "id"
      `);
      if (rows.length !== 1) throw new AppError('NOT_FOUND', 404, 'Lead magnet not found');
    });
    return { deleted: true };
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
