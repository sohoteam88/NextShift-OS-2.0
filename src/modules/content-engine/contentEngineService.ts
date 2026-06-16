// ============================================================
// Content Engine Service
// ============================================================

import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';
import type { ContentPillar } from '@/modules/brand-dna/types';
import type { GeneratedPost, ContentCalendar, ContentCalendarItem, Platform, ContentFormat, FunnelStage } from './types';
import { generateContentPillars, generateCalendar, generatePost } from './contentGenerators';

export const contentEngineService = {
  // ---- Pillars (canonical: BrandProfile.content_pillars) ----
  async getPillars(userId: string): Promise<ContentPillar[]> {
    const ctx = await getBrandContext(userId);
    if (!ctx) return [];
    if (ctx.contentPillars.length > 0) return ctx.contentPillars;
    return generateContentPillars(ctx);
  },

  async generatePillars(userId: string): Promise<ContentPillar[]> {
    const ctx = await getBrandContext(userId);
    if (!ctx) throw new Error('Brand DNA not found');
    return generateContentPillars(ctx);
  },

  async savePillars(userId: string, pillars: ContentPillar[]) {
    // Pillars are saved to BrandProfile via brandDnaService — no separate metadata needed
    const bp = await prisma.brandProfile.findUnique({ where: { userId } });
    if (bp) {
      await prisma.brandProfile.update({ where: { userId }, data: { contentPillars: pillars as unknown as Prisma.InputJsonValue } });
    }
  },

  // ---- Calendar ----
  async generateCalendar(userId: string, days: 30 | 90 | 180): Promise<ContentCalendar> {
    const ctx = await getBrandContext(userId);
    if (!ctx) throw new Error('Brand DNA not found');

    const pillars = await this.getPillars(userId);
    if (pillars.length === 0) throw new Error('Generate content pillars first');

    const items = generateCalendar(ctx, pillars, days);
    const calendar: ContentCalendar = { days, items, generatedAt: new Date().toISOString() };

    // Replace future generated calendar rows so repeated clicks do not hit the unique constraint.
    const userRecord = await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } });
    if (!userRecord) throw new Error('User record not found');

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    await prisma.contentCalendar.deleteMany({
      where: {
        userId,
        date: { gte: startDate },
      },
    });

    await prisma.contentCalendar.createMany({
      data: items.map((item) => ({
        tenantId: userRecord.tenantId,
        userId,
        date: new Date(item.date),
        pillar: item.pillar,
        pillarEmoji: item.pillarEmoji,
        title: item.title,
        hook: item.hook,
        platform: item.platform,
        format: item.format,
        status: 'planned',
      })),
    });

    return calendar;
  },

  async getCalendar(userId: string): Promise<ContentCalendar | null> {
    const items = await prisma.contentCalendar.findMany({ where: { userId }, orderBy: { date: 'asc' }, take: 180 });
    if (items.length === 0) return null;
    return { days: items.length, items: items as unknown as ContentCalendarItem[], generatedAt: items[0].createdAt.toISOString() };
  },

  // ---- Post Generation ----
  async generatePlatformPost(
    userId: string,
    tenantId: string,
    platform: Platform,
    format: ContentFormat,
    funnelStage: FunnelStage,
    pillarName?: string,
  ): Promise<GeneratedPost> {
    const ctx = await getBrandContext(userId);
    if (!ctx) throw new Error('Brand DNA not found');

    const pillars = await this.getPillars(userId);
    if (pillars.length === 0) throw new Error('No content pillars');

    const pillar = pillarName
      ? pillars.find((p) => p.name === pillarName) ?? pillars[0]
      : pillars[0];

    const post = generatePost(ctx, pillar, platform, format, funnelStage);

    // Save to Content model
    await prisma.content.create({
      data: {
        tenantId,
        ownerId: userId,
        type: format,
        platform,
        title: post.title,
        body: post.body,
        language: 'zh',
        generatedByAi: true,
        status: 'draft',
      },
    });

    return post;
  },

  async getLastPost(userId: string): Promise<GeneratedPost | null> {
    // Read from Content model (canonical source)
    const content = await prisma.content.findFirst({ where: { ownerId: userId }, orderBy: { createdAt: 'desc' } });
    if (!content) return null;
    return { id: content.id, pillar: '', pillarEmoji: '', title: content.title ?? '', hook: '', body: content.body, cta: '', hashtags: [], platform: (content.platform as GeneratedPost['platform']) ?? 'instagram', format: (content.type as GeneratedPost['format']) ?? 'text_post', funnelStage: 'awareness', status: (content.status as GeneratedPost['status']) ?? 'generated', qualityScore: 75, createdAt: content.createdAt.toISOString() };
  },

  async getPublishedCount(userId: string): Promise<number> {
    return prisma.content.count({ where: { ownerId: userId, status: 'published' } });
  },

  async markPublished(userId: string, postId: string) {
    return prisma.content.updateMany({
      where: { ownerId: userId, id: postId },
      data: { status: 'published' },
    });
  },
};
