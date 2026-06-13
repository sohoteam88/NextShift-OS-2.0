import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';
import type { TrafficGoal, TrafficPlatform, BudgetTier, TrafficPackage } from './types';
import { generateTrafficPackage } from './trafficGenerators';

export const trafficEngineService = {
  async generate(userId: string, goal: TrafficGoal, platform: TrafficPlatform, budget: BudgetTier): Promise<TrafficPackage> {
    const ctx = await getBrandContext(userId);
    if (!ctx) throw new Error('Brand DNA not found');

    // Check existing modules
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    const funnelExists = !!(meta.funnel_builder || meta.funnel_builder_2);
    const lmExists = !!meta.lead_magnet;
    const contentCount = await prisma.content.count({ where: { ownerId: userId } });

    const pkg = generateTrafficPackage(ctx, goal, platform, budget, funnelExists, lmExists, contentCount);
    pkg.campaign.readinessScore = pkg.readiness.score;
    await this.save(userId, pkg);
    return pkg;
  },

  async save(userId: string, pkg: TrafficPackage) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    await prisma.user.update({ where: { id: userId }, data: { metadata: { ...meta, traffic_engine: pkg as unknown as Prisma.InputJsonValue } as Prisma.InputJsonValue } });
  },

  async get(userId: string): Promise<TrafficPackage | null> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    const t = meta.traffic_engine; return t && typeof t === 'object' ? (t as TrafficPackage) : null;
  },
};
