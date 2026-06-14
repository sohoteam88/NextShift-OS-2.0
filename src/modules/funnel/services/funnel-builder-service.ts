import prisma from '@/lib/prisma';
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';
import type { FunnelBuilderType, FunnelPackage } from '../types/funnel-builder';
import { generateFullFunnel } from './funnel-generators';
import { funnelHealthService } from '@/modules/funnel/services/funnel-health-service';
import { funnelService } from '@/modules/funnel/services/funnel-service';

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
  async generate(userId: string, funnelType: FunnelBuilderType): Promise<FunnelPackage> {
    const ctx = await getBrandContext(userId);
    if (!ctx) throw new Error('Brand DNA not found');
    const pkg = generateFullFunnel(ctx, funnelType);
    const health = funnelHealthService.evaluatePackage(pkg);
    pkg.healthScore = health.score;
    pkg.nextBestAction = funnelHealthService.getPackageAdvisor(health).nextAction;

    // Store in Funnel model via canonical write path
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } });
    await funnelService.createInternal({
      tenantId: user!.tenantId,
      ownerId: userId,
      title: pkg.title,
      config: pkg as unknown as Record<string, unknown>,
    });
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
