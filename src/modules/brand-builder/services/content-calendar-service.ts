import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { generateWithFallback } from '@/modules/ai/providers/factory';
import { enforceQuota } from '@/modules/ai/usage/quota';
import { logAIUsage } from '@/modules/ai/usage/tracker';

type AuthUser = { id: string; tenantId: string; languagePreference?: string };

export type CalendarItem = {
  id: string;
  date: Date;
  pillar: string;
  pillarEmoji: string;
  title: string;
  hook: string | null;
  platform: string;
  format: string;
  status: string;
  contentId: string | null;
  notes: string | null;
};

type BrandProfile = {
  name?: string;
  identity?: string;
  products?: string[];
  targetAudience?: string;
  valueProposition?: string;
  contentPillars?: Array<{ name: string; emoji: string; pct: number }>;
  contentStrategy?: {
    tone?: string;
    visual?: string;
    frequency?: string;
    format?: string;
  };
  platforms?: string[];
};

const DEFAULT_PILLARS = [
  { name: '产品分享', emoji: '🛍', pct: 30 },
  { name: '客户见证', emoji: '⭐', pct: 25 },
  { name: '知识科普', emoji: '💡', pct: 25 },
  { name: '生活点滴', emoji: '🌸', pct: 20 },
];

export const contentCalendarService = {
  async generate(user: AuthUser, days = 30): Promise<CalendarItem[]> {
    await enforceQuota(user.tenantId);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { metadata: true, name: true },
    });
    const meta = (dbUser?.metadata as Record<string, unknown>) ?? {};
    const profile = (meta.brand_profile as BrandProfile) ?? {};
    const pillars = profile.contentPillars ?? DEFAULT_PILLARS;
    const strategy = profile.contentStrategy ?? {};
    const platforms = profile.platforms ?? ['facebook'];
    const lang = user.languagePreference ?? 'zh';

    const systemPrompt = `You are a social media content calendar generator for a Malaysian network marketing professional. Generate a ${days}-day content calendar.

BRAND CONTEXT:
- Name: ${dbUser?.name ?? 'Creator'}
- Identity: ${profile.identity ?? profile.name ?? ''}
- Products: ${(profile.products ?? []).join(', ')}
- Target Audience: ${profile.targetAudience ?? ''}
- Value Proposition: ${profile.valueProposition ?? ''}
- Platforms: ${platforms.join(', ')}

CONTENT STRATEGY:
- Tone: ${strategy.tone ?? 'friendly'}
- Visual Style: ${strategy.visual ?? 'lifestyle'}
- Frequency: ${strategy.frequency ?? 'daily'}
- Primary Format: ${strategy.format ?? 'short_video'}
- Content Pillars (with %): ${pillars.map((p) => `${p.emoji} ${p.name} (${p.pct}%)`).join(', ')}

OUTPUT: Return a JSON array of ${days} objects, one per day, each with:
{
  "date": "YYYY-MM-DD",
  "pillar": "pillar name (string)",
  "pillar_emoji": "single emoji",
  "title": "post title (${lang === 'zh' ? 'Chinese' : lang === 'ms' ? 'Malay' : 'English'}, max 60 chars)",
  "hook": "opening hook sentence",
  "platform": "one of: ${platforms.join(' | ')}",
  "format": "one of: short_video | carousel | photo | story | live | reel"
}

Respect the pillar percentages. Vary platforms proportionally. Start dates from tomorrow.`;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startStr = tomorrow.toISOString().slice(0, 10);

    const result = await generateWithFallback({
      systemPrompt,
      userMessage: `Generate a ${days}-day content calendar starting from ${startStr}. Return ONLY the JSON array, no markdown.`,
      maxTokens: 4000,
      temperature: 0.8,
    });

    let items: Array<{
      date: string;
      pillar: string;
      pillar_emoji: string;
      title: string;
      hook?: string;
      platform: string;
      format: string;
    }>;

    try {
      const cleaned = result.text.replace(/```json\n?|\n?```/g, '').trim();
      items = JSON.parse(cleaned) as typeof items;
    } catch {
      throw new Error('Failed to parse calendar from AI response');
    }

    await logAIUsage({
      tenantId: user.tenantId,
      userId: user.id,
      feature: 'brand_builder_calendar',
      result,
    });

    // Delete existing planned items before regenerating
    await prisma.contentCalendar.deleteMany({
      where: { userId: user.id, tenantId: user.tenantId, status: 'planned' },
    });

    const toCreate = items.map((item) => ({
      id: `cc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tenantId: user.tenantId,
      userId: user.id,
      date: new Date(item.date),
      pillar: item.pillar,
      pillarEmoji: item.pillar_emoji ?? '',
      title: item.title,
      hook: item.hook ?? null,
      platform: item.platform,
      format: item.format,
      status: 'planned',
    }));

    await prisma.contentCalendar.createMany({ data: toCreate, skipDuplicates: true });

    return prisma.contentCalendar.findMany({
      where: { userId: user.id, tenantId: user.tenantId },
      orderBy: [{ date: 'asc' }, { platform: 'asc' }],
    });
  },

  async getCalendar(
    user: AuthUser,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CalendarItem[]> {
    const where: Prisma.ContentCalendarWhereInput = {
      userId: user.id,
      tenantId: user.tenantId,
    };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) (where.date as Prisma.DateTimeFilter).gte = startDate;
      if (endDate) (where.date as Prisma.DateTimeFilter).lte = endDate;
    }
    return prisma.contentCalendar.findMany({
      where,
      orderBy: [{ date: 'asc' }, { platform: 'asc' }],
    });
  },

  async updateItem(
    user: AuthUser,
    id: string,
    data: Partial<{
      status: string;
      title: string;
      hook: string;
      notes: string;
      contentId: string;
      platform: string;
      format: string;
      pillar: string;
      pillarEmoji: string;
    }>,
  ): Promise<CalendarItem> {
    return prisma.contentCalendar.update({
      where: { id, userId: user.id, tenantId: user.tenantId },
      data,
    });
  },

  async deleteItem(user: AuthUser, id: string): Promise<void> {
    await prisma.contentCalendar.delete({
      where: { id, userId: user.id, tenantId: user.tenantId },
    });
  },

  async addItem(
    user: AuthUser,
    item: {
      date: Date;
      pillar: string;
      pillarEmoji?: string;
      title: string;
      hook?: string;
      platform: string;
      format: string;
      notes?: string;
    },
  ): Promise<CalendarItem> {
    return prisma.contentCalendar.create({
      data: {
        id: `cc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        tenantId: user.tenantId,
        userId: user.id,
        date: item.date,
        pillar: item.pillar,
        pillarEmoji: item.pillarEmoji ?? '',
        title: item.title,
        hook: item.hook ?? null,
        platform: item.platform,
        format: item.format,
        notes: item.notes ?? null,
        status: 'planned',
      },
    });
  },

  async getTodayContent(user: AuthUser): Promise<CalendarItem[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return prisma.contentCalendar.findMany({
      where: {
        userId: user.id,
        tenantId: user.tenantId,
        date: { gte: today, lt: tomorrow },
      },
      orderBy: { platform: 'asc' },
    });
  },

  async getStats(user: AuthUser): Promise<{
    total: number;
    published: number;
    drafted: number;
    planned: number;
    skipped: number;
    completionRate: number;
    byPlatform: Record<string, number>;
    byPillar: Record<string, number>;
  }> {
    const items = await prisma.contentCalendar.findMany({
      where: { userId: user.id, tenantId: user.tenantId },
      select: { status: true, platform: true, pillar: true },
    });
    const total = items.length;
    const published = items.filter((i) => i.status === 'published').length;
    const drafted = items.filter((i) => i.status === 'drafted').length;
    const planned = items.filter((i) => i.status === 'planned').length;
    const skipped = items.filter((i) => i.status === 'skipped').length;
    const completionRate = total > 0 ? Math.round((published / total) * 100) : 0;

    const byPlatform: Record<string, number> = {};
    const byPillar: Record<string, number> = {};
    for (const item of items) {
      byPlatform[item.platform] = (byPlatform[item.platform] ?? 0) + 1;
      byPillar[item.pillar] = (byPillar[item.pillar] ?? 0) + 1;
    }

    return { total, published, drafted, planned, skipped, completionRate, byPlatform, byPillar };
  },
};
