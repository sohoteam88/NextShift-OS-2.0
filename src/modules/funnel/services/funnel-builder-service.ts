import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';
import type { FunnelBuilderType, FunnelPackage } from '../types/funnel-builder';
import { generateFullFunnel } from './funnel-generators';
import { funnelHealthService } from '@/modules/funnel/services/funnel-health-service';
import { funnelService } from '@/modules/funnel/services/funnel-service';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { FunnelConfig, FunnelSection, FunnelTheme } from '@/modules/funnel/types';

const DEFAULT_THEME: FunnelTheme = { primary_color: '#2563eb', bg_color: '#ffffff', font: 'system' };

function isFunnelPackage(value: unknown): value is FunnelPackage {
  if (!value || typeof value !== 'object') return false;
  const pkg = value as Partial<FunnelPackage>;
  return (
    typeof pkg.id === 'string' &&
    typeof pkg.title === 'string' &&
    typeof pkg.funnelType === 'string' &&
    Boolean(pkg.landingPage && typeof pkg.landingPage === 'object') &&
    Boolean(pkg.thankYouPage && typeof pkg.thankYouPage === 'object') &&
    Boolean(pkg.whatsappFlow && typeof pkg.whatsappFlow === 'object') &&
    Array.isArray(pkg.emailSequence) &&
    Array.isArray(pkg.adAngles) &&
    Array.isArray(pkg.launchPlan)
  );
}

function buildLandingPageConfig(pkg: FunnelPackage): FunnelConfig {
  const landing = pkg.landingPage;
  const sections: FunnelSection[] = [
    {
      type: 'hero',
      headline: landing.headline,
      subheadline: landing.subheadline,
      cta_text: landing.heroCta,
      cta_type: 'form',
      cta_target: '#form',
    },
    {
      type: 'pain',
      title: '这页适合你，如果你正在遇到这些问题',
      items: [
        { text: landing.problem },
        { text: '你需要一个清晰入口，让潜在客户留下资料，而不是只看内容就离开。' },
        { text: '你需要后续 WhatsApp 和邮件跟进，而不是手动一个个解释。' },
      ],
    },
    {
      type: 'mechanism',
      title: '为什么这个路径有效',
      description: landing.solution,
    },
    {
      type: 'benefits',
      title: '你会获得什么',
      items: landing.benefits.slice(0, 4).map((benefit, index) => ({
        icon: ['target', 'check', 'sparkles', 'shield'][index] ?? 'check',
        title: benefit.replace(/^✅\s*/, ''),
        description: index === 0 ? landing.leadBlock : '帮助客户更快理解价值，并进入下一步行动。',
      })),
    },
    {
      type: 'testimonial',
      title: '信任基础',
      items: [{ name: 'NextShift AI COO', text: landing.credibility }],
    },
    {
      type: 'form',
      title: '领取资源',
      fields: ['name', 'whatsapp'],
      submit_text: landing.heroCta,
      success_message: pkg.thankYouPage.confirmation,
    },
    {
      type: 'faq',
      title: '常见问题',
      items: landing.faq.map((item) => ({ question: item.q, answer: item.a })),
    },
    {
      type: 'cta',
      headline: landing.finalCta,
      subheadline: pkg.thankYouPage.nextStep,
      button_text: landing.heroCta,
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

export const funnelBuilderService = {
  async generate(userId: string, funnelType: FunnelBuilderType): Promise<FunnelPackage> {
    const ctx = await getBrandContext(userId);
    if (!ctx) throw new Error('Brand DNA not found');
    const pkg = generateFullFunnel(ctx, funnelType);
    const health = funnelHealthService.evaluatePackage(pkg);
    pkg.healthScore = health.score;
    pkg.nextBestAction = funnelHealthService.getPackageAdvisor(health).nextAction;

    // Store in Funnel model via canonical write path
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true, metadata: true } });
    if (!user) throw new Error('User not found');

    await funnelService.createInternal({
      tenantId: user.tenantId,
      ownerId: userId,
      title: pkg.title,
      config: pkg as unknown as Record<string, unknown>,
    });

    await this.savePackage(userId, pkg, user.metadata);

    return pkg;
  },

  async get(userId: string): Promise<FunnelPackage | null> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    if (isFunnelPackage(meta.funnel_builder_2)) {
      return meta.funnel_builder_2;
    }

    const funnels = await prisma.funnel.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { config: true },
    });

    for (const funnel of funnels) {
      if (isFunnelPackage(funnel.config)) {
        return funnel.config;
      }
    }

    return null;
  },

  async publishLandingPage(user: AuthUser): Promise<FunnelPackage> {
    const pkg = await this.get(user.id);
    if (!pkg) throw new Error('Funnel package not generated');

    let funnel = pkg.landingPage.funnelId
      ? await prisma.funnel.findFirst({
        where: { id: pkg.landingPage.funnelId, tenantId: user.tenantId, ownerId: user.id },
      })
      : null;

    const config = buildLandingPageConfig(pkg);
    if (!funnel) {
      funnel = await funnelService.createInternal({
        tenantId: user.tenantId,
        ownerId: user.id,
        title: pkg.landingPage.headline || pkg.title,
        config: config as unknown as Record<string, unknown>,
      });
    } else {
      funnel = await prisma.funnel.update({
        where: { id: funnel.id },
        data: {
          title: pkg.landingPage.headline || funnel.title,
          config: config as unknown as Prisma.InputJsonValue,
          updatedAt: new Date(),
        },
      });
    }

    const published = await funnelService.publish(user, funnel.id);
    const nextPkg: FunnelPackage = {
      ...pkg,
      status: 'launched',
      landingPage: {
        ...pkg.landingPage,
        funnelId: published.id,
        publicPath: `/f/${published.slug}`,
        publishedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    await this.savePackage(user.id, nextPkg);
    return nextPkg;
  },

  async savePackage(userId: string, pkg: FunnelPackage, existingMetadata?: unknown) {
    const meta = existingMetadata
      ? (existingMetadata as Record<string, unknown>)
      : ((await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } }))?.metadata as Record<string, unknown>) ?? {};
    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          ...meta,
          funnel_builder_2: pkg,
        } as unknown as Prisma.InputJsonValue,
      },
    });
  },
};
