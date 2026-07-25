// ============================================================
// Content Engine Service
// ============================================================

import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getBrandContext, getBrandDnaVersion } from '@/modules/brand-dna/services/BrandContextProvider';
import type { WorkspaceContext } from '@/modules/workspace/types';
import type { ContentPillar } from '@/modules/brand-dna/types';
import {
  buildGenerationContext,
  GENERATION_DEGRADE_LABEL,
  runGeneration,
  type RunGenerationOptions,
} from '@/modules/ai/generation';
import { getBusinessPackSlice } from '@/modules/ai/business-pack';
import { enforceComplianceHardFilter } from '@/modules/ai/compliance';
import {
  CONTENT_COMMAND_CENTER_PLATFORMS,
  isContentCommandCenterPlatform,
  type GeneratedPost,
  type ContentCalendar,
  type ContentCalendarItem,
  type Platform,
  type ContentFormat,
  type FunnelStage,
  type ContentStatus,
  type ContentTrack,
} from './types';
import { generateContentPillars, generateCalendar, generatePost } from './contentGenerators';
import {
  buildContentPostUserMessage,
  CONTENT_POST_JSON_SYSTEM_INSTRUCTION,
  parseGeneratedPostJson,
} from './contentPostGeneration';

const CONTENT_TRACKS: ContentTrack[] = ['retail', 'recruitment'];
const CONTENT_EDITOR_STATUSES: ContentStatus[] = [
  'draft',
  'generated',
  'copied',
  'published',
];
const MAX_COMPLIANCE_RETRIES = 2;

function filterPostForPublicOutput(post: GeneratedPost, track: ContentTrack) {
  return enforceComplianceHardFilter({
    fields: {
      title: post.title,
      hook: post.hook,
      body: post.body,
      cta: post.cta,
      hashtags: post.hashtags,
    },
    track,
  });
}

function applyFilteredFields(post: GeneratedPost, fields: {
  title: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
}): GeneratedPost {
  return { ...post, ...fields };
}

/**
 * This is only reachable when a deterministic fallback violates the same
 * public-output gate. Never persist a rejected fallback: replace its public
 * fields with a deliberately neutral, destination-safe base version instead.
 */
function buildSafeBasePost(post: GeneratedPost): GeneratedPost {
  return {
    ...post,
    title: '基础内容草稿',
    hook: '从一个小行动开始，慢慢建立适合自己的健康习惯。',
    body: '这是基础版本内容。请根据你的真实经验和受众需要补充具体建议，并在发布前完成人工审核。',
    cta: '留言告诉我你想先从哪个小行动开始。',
    hashtags: ['#健康习惯', '#日常行动'],
  };
}

function isContentCalendar(value: unknown): value is ContentCalendar {
  return Boolean(value && typeof value === 'object' && Array.isArray((value as Partial<ContentCalendar>).items));
}

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
  async generateCalendar(userId: string, days: 30 | 90 | 180, track: ContentTrack = 'retail', workspaceContext?: WorkspaceContext): Promise<ContentCalendar> {
    const ctx = await getBrandContext(userId);
    if (!ctx) throw new Error('Brand DNA not found');

    const pillars = await this.getPillars(userId);
    if (pillars.length === 0) throw new Error('Generate content pillars first');

    const activeTrack = resolveContentTrack(track, workspaceContext);
    const items = generateCalendar(ctx, pillars, days, activeTrack);
    const calendar: ContentCalendar = {
      days,
      track: activeTrack,
      items,
      generatedAt: new Date().toISOString(),
      brandDnaVersion: await getBrandDnaVersion(userId),
    };
    await this.saveTrackCalendar(userId, activeTrack, calendar);

    if (activeTrack !== 'retail') {
      return calendar;
    }

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

  async saveTrackCalendar(userId: string, track: ContentTrack, calendar: ContentCalendar) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    const existing = (meta.content_engine_track_calendars && typeof meta.content_engine_track_calendars === 'object')
      ? meta.content_engine_track_calendars as Record<string, unknown>
      : {};

    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          ...meta,
          content_engine_track_calendars: {
            ...existing,
            [track]: calendar,
          },
        } as unknown as Prisma.InputJsonValue,
      },
    });
  },

  async getCalendar(userId: string): Promise<ContentCalendar | null> {
    const items = await prisma.contentCalendar.findMany({ where: { userId }, orderBy: { date: 'asc' }, take: 180 });
    if (items.length === 0) return null;
    return { days: items.length, items: items as unknown as ContentCalendarItem[], generatedAt: items[0].createdAt.toISOString() };
  },

  async getTrackCalendars(userId: string): Promise<Record<ContentTrack, ContentCalendar | null>> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    const stored = (meta.content_engine_track_calendars && typeof meta.content_engine_track_calendars === 'object')
      ? meta.content_engine_track_calendars as Record<string, unknown>
      : {};

    return CONTENT_TRACKS.reduce((acc, track) => {
      acc[track] = isContentCalendar(stored[track]) ? stored[track] : null;
      return acc;
    }, {} as Record<ContentTrack, ContentCalendar | null>);
  },

  // ---- Post Generation ----
  async generatePlatformPost(
    userId: string,
    tenantId: string,
    platform: Platform,
    format: ContentFormat,
    funnelStage: FunnelStage,
    pillarName?: string,
    workspaceContext?: WorkspaceContext,
  ): Promise<GeneratedPost> {
    const ctx = await getBrandContext(userId);
    if (!ctx) throw new Error('Brand DNA not found');
    const workspacePromptUsed = workspaceContext
      ? `workspace:${workspaceContext.activeWorkspaceType}`
      : undefined;

    const pillars = await this.getPillars(userId);
    if (pillars.length === 0) throw new Error('No content pillars');

    const pillar = pillarName
      ? pillars.find((p) => p.name === pillarName) ?? pillars[0]
      : pillars[0];

    const fallback = generatePost(ctx, pillar, platform, format, funnelStage);
    const mode = resolveContentTrack('retail', workspaceContext);
    const user = { id: userId, tenantId };
    const businessPack = getBusinessPackSlice({ track: mode, platform });
    const generationContext = await buildGenerationContext(user, {
      mode,
      platform,
      // Keep G1's parser contract alongside O1's real, public-safe context.
      businessPack: {
        ...businessPack,
        promptContext: [businessPack.promptContext, CONTENT_POST_JSON_SYSTEM_INSTRUCTION]
          .filter(Boolean)
          .join('\n\n'),
      },
    });
    const generationOptions: RunGenerationOptions<GeneratedPost> = {
      context: generationContext,
      userMessage: buildContentPostUserMessage({ pillar, platform, format, funnelStage }),
      taskCategory: 'content_generation',
      feature: 'content_engine_post',
      fallback,
      parse: (text) => parseGeneratedPostJson(text, fallback),
      temperature: 0.7,
      maxTokens: 900,
    };
    let outcome = await runGeneration(user, generationOptions);
    let post = outcome.value;
    let compliance = filterPostForPublicOutput(post, mode);
    let complianceRetries = 0;

    // A reject is never user-visible or persisted. Regenerate a bounded number
    // of times through the same G0 gateway before falling back to the known
    // deterministic template path.
    while (
      compliance.status === 'rejected'
      && outcome.source === 'ai'
      && complianceRetries < MAX_COMPLIANCE_RETRIES
    ) {
      complianceRetries += 1;
      outcome = await runGeneration(user, generationOptions);
      post = outcome.value;
      compliance = filterPostForPublicOutput(post, mode);
    }

    let generatedByAi = outcome.source === 'ai';
    let degradedLabel = outcome.status === 'degraded'
      ? outcome.userVisibleLabel
      : undefined;

    if (compliance.status === 'rejected') {
      // The AI exhausted its compliance retries, or the gateway degraded to a
      // template that still failed the zero-trust check. Filter the existing
      // template too; a bad template becomes a neutral safe base, never a
      // rejected public result.
      const fallbackCompliance = filterPostForPublicOutput(fallback, mode);
      post = fallbackCompliance.status === 'rejected'
        ? buildSafeBasePost(fallback)
        : applyFilteredFields(fallback, fallbackCompliance.fields);
      generatedByAi = false;
      degradedLabel = GENERATION_DEGRADE_LABEL;
    } else {
      post = applyFilteredFields(post, compliance.fields);
    }

    // Save to the canonical Content model and return its identity. The client
    // must PATCH this record rather than using the temporary generator ID.
    const content = await prisma.content.create({
      data: {
        tenantId,
        ownerId: userId,
        type: format,
        platform,
        title: post.title,
        body: post.body,
        language: 'zh',
        generatedByAi,
        promptUsed: workspacePromptUsed,
        status: 'draft',
      },
    });

    return {
      ...post,
      id: content.id,
      title: content.title ?? post.title,
      body: content.body,
      platform,
      format,
      status: 'draft',
      generatedByAi,
      ...(degradedLabel
        ? { degradedLabel }
        : {}),
      createdAt: content.createdAt.toISOString(),
      updatedAt: content.updatedAt.toISOString(),
    };
  },

  async getLastPost(userId: string): Promise<GeneratedPost | null> {
    // The shared Content table also stores legacy `post`, `whatsapp`, and
    // `xiaohongshu` records. Only hydrate the latest record whose persisted
    // type/platform/status are compatible with the E1 Command Center editor.
    const content = await prisma.content.findFirst({
      where: {
        ownerId: userId,
        type: 'text_post',
        platform: { in: [...CONTENT_COMMAND_CENTER_PLATFORMS] },
        status: { in: CONTENT_EDITOR_STATUSES },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
    if (
      !content ||
      content.type !== 'text_post' ||
      !isContentCommandCenterPlatform(content.platform) ||
      !isContentStatus(content.status)
    ) {
      return null;
    }

    return {
      id: content.id,
      pillar: '',
      pillarEmoji: '',
      title: content.title ?? '',
      hook: '',
      body: content.body,
      cta: '',
      hashtags: [],
      platform: content.platform,
      format: 'text_post',
      funnelStage: 'awareness',
      status: content.status,
      qualityScore: 75,
      createdAt: content.createdAt.toISOString(),
      updatedAt: content.updatedAt.toISOString(),
    };
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

function resolveContentTrack(track: ContentTrack, workspaceContext?: WorkspaceContext): ContentTrack {
  const configuredTrack = workspaceContext?.workspaceConfig.contentTrack;

  return CONTENT_TRACKS.includes(configuredTrack as ContentTrack)
    ? configuredTrack as ContentTrack
    : track;
}

function isContentStatus(value: string): value is ContentStatus {
  return CONTENT_EDITOR_STATUSES.some((status) => status === value);
}
