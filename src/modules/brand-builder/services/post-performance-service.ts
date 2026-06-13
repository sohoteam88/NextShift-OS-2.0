import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';

export type PostPerformanceData = {
  platform: string;
  postUrl?: string;
  pillar?: string;
  format?: string;
  publishedAt: Date;
  reach: number;
  impressions?: number;
  likes: number;
  comments: number;
  shares: number;
  saves?: number;
  clicks?: number;
  contentId?: string;
  calendarId?: string;
};

function getPeriodStart(period: '7d' | '30d' | '90d'): Date {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export const postPerformanceService = {
  async create(user: AuthUser, data: PostPerformanceData) {
    return prisma.postPerformance.create({
      data: {
        id: `pp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        tenantId: user.tenantId,
        userId: user.id,
        platform: data.platform,
        postUrl: data.postUrl,
        pillar: data.pillar,
        format: data.format,
        publishedAt: data.publishedAt,
        reach: data.reach,
        impressions: data.impressions ?? 0,
        likes: data.likes,
        comments: data.comments,
        shares: data.shares,
        saves: data.saves ?? 0,
        clicks: data.clicks ?? 0,
        contentId: data.contentId,
        calendarId: data.calendarId,
      },
    });
  },

  async update(
    user: AuthUser,
    id: string,
    data: Partial<{
      reach: number;
      impressions: number;
      likes: number;
      comments: number;
      shares: number;
      saves: number;
      clicks: number;
      postUrl: string;
      notes: string;
    }>,
  ) {
    return prisma.postPerformance.update({
      where: { id, userId: user.id, tenantId: user.tenantId },
      data,
    });
  },

  async delete(user: AuthUser, id: string) {
    await prisma.postPerformance.delete({
      where: { id, userId: user.id, tenantId: user.tenantId },
    });
  },

  async list(
    user: AuthUser,
    filters: {
      platform?: string;
      pillar?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where = {
      userId: user.id,
      tenantId: user.tenantId,
      ...(filters.platform && { platform: filters.platform }),
      ...(filters.pillar && { pillar: filters.pillar }),
      ...(filters.startDate || filters.endDate
        ? {
            publishedAt: {
              ...(filters.startDate && { gte: filters.startDate }),
              ...(filters.endDate && { lte: filters.endDate }),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.postPerformance.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.postPerformance.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  async getStats(user: AuthUser, period: '7d' | '30d' | '90d') {
    const since = getPeriodStart(period);
    const posts = await prisma.postPerformance.findMany({
      where: {
        userId: user.id,
        tenantId: user.tenantId,
        publishedAt: { gte: since },
      },
    });

    if (posts.length === 0) return null;

    const total = posts.length;
    const avgReach = Math.round(posts.reduce((s, p) => s + p.reach, 0) / total);
    const avgLikes = Math.round(posts.reduce((s, p) => s + p.likes, 0) / total);
    const avgComments = Math.round(posts.reduce((s, p) => s + p.comments, 0) / total);
    const avgShares = Math.round(posts.reduce((s, p) => s + p.shares, 0) / total);
    const totalReach = posts.reduce((s, p) => s + p.reach, 0);
    const engagementRate =
      totalReach > 0
        ? (posts.reduce((s, p) => s + p.likes + p.comments + p.shares + p.saves, 0) /
            totalReach) *
          100
        : 0;

    const byPillar: Record<string, { count: number; avgReach: number; avgEngagement: number }> = {};
    for (const p of posts) {
      const key = p.pillar ?? 'other';
      if (!byPillar[key]) byPillar[key] = { count: 0, avgReach: 0, avgEngagement: 0 };
      byPillar[key]!.count++;
      byPillar[key]!.avgReach += p.reach;
      byPillar[key]!.avgEngagement += p.likes + p.comments + p.shares;
    }
    for (const v of Object.values(byPillar)) {
      v.avgReach = Math.round(v.avgReach / v.count);
      v.avgEngagement = Math.round(v.avgEngagement / v.count);
    }

    const byFormat: Record<string, { count: number; avgReach: number }> = {};
    for (const p of posts) {
      const key = p.format ?? 'post';
      if (!byFormat[key]) byFormat[key] = { count: 0, avgReach: 0 };
      byFormat[key]!.count++;
      byFormat[key]!.avgReach += p.reach;
    }
    for (const v of Object.values(byFormat)) {
      v.avgReach = Math.round(v.avgReach / v.count);
    }

    const byPlatform: Record<string, { count: number; avgReach: number }> = {};
    for (const p of posts) {
      if (!byPlatform[p.platform]) byPlatform[p.platform] = { count: 0, avgReach: 0 };
      byPlatform[p.platform]!.count++;
      byPlatform[p.platform]!.avgReach += p.reach;
    }
    for (const v of Object.values(byPlatform)) {
      v.avgReach = Math.round(v.avgReach / v.count);
    }

    const trendMap: Record<string, { reach: number; engagement: number; count: number }> = {};
    for (const p of posts) {
      const date = p.publishedAt.toISOString().split('T')[0]!;
      if (!trendMap[date]) trendMap[date] = { reach: 0, engagement: 0, count: 0 };
      trendMap[date]!.reach += p.reach;
      trendMap[date]!.engagement += p.likes + p.comments + p.shares;
      trendMap[date]!.count++;
    }
    const trend = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, reach: v.reach, engagement: v.engagement }));

    return {
      total,
      avgReach,
      avgLikes,
      avgComments,
      avgShares,
      engagementRate: +engagementRate.toFixed(2),
      byPillar,
      byFormat,
      byPlatform,
      trend,
    };
  },
};
