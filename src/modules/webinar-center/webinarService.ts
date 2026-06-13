import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';
import type { WebinarPackage } from './types';
import { generateFullWebinar } from './webinarGenerators';
import { validateWebinar } from './webinarValidator';

export const webinarService = {
  async generate(userId: string): Promise<WebinarPackage> {
    const ctx = await getBrandContext(userId);
    if (!ctx) throw new Error('Brand DNA not found');
    const pkg = generateFullWebinar(ctx);
    pkg.qualityScore = validateWebinar(pkg).score;
    await this.save(userId, pkg);
    return pkg;
  },
  async save(userId: string, pkg: WebinarPackage) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    await prisma.user.update({ where: { id: userId }, data: { metadata: { ...meta, webinar: pkg as unknown as Prisma.InputJsonValue } as Prisma.InputJsonValue } });
  },
  async get(userId: string): Promise<WebinarPackage | null> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    const w = meta.webinar; return w && typeof w === 'object' ? (w as WebinarPackage) : null;
  },
  async getContext(userId: string) { const pkg = await this.get(userId); if (!pkg) return null; return { title: pkg.topic.title, promise: pkg.topic.promise, audience: pkg.strategy.targetAudience, CTA: pkg.outline.cta, outline: pkg.outline, offer: pkg.outline.offer }; },
};
