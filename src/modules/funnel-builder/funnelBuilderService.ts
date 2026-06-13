import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';
import type { FunnelType, FunnelPackage } from './types';
import { generateFullFunnel } from './funnelGenerators';
import { validateFunnelHealth } from './funnelHealthValidator';
import { getNextBestAction } from './funnelAdvisor';

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

export const funnelBuilderService = {
  async generate(userId: string, funnelType: FunnelType): Promise<FunnelPackage> {
    const ctx = await getBrandContext(userId);
    if (!ctx) throw new Error('Brand DNA not found');
    const pkg = generateFullFunnel(ctx, funnelType);
    pkg.healthScore = validateFunnelHealth(pkg).score;
    pkg.nextBestAction = getNextBestAction(validateFunnelHealth(pkg));

    // Store in Funnel model (canonical source)
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } });
    await prisma.funnel.create({ data: { tenantId: user!.tenantId, ownerId: userId, title: pkg.title, slug: `funnel-${Date.now()}`, config: pkg as unknown as Prisma.InputJsonValue, status: 'draft' } });
    return pkg;
  },

  async get(userId: string): Promise<FunnelPackage | null> {
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
};
