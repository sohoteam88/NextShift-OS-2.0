import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMocks = vi.hoisted(() => ({
  brandProfile: { findUnique: vi.fn(), update: vi.fn() },
  content: { create: vi.fn(), findFirst: vi.fn(), count: vi.fn(), updateMany: vi.fn() },
  contentCalendar: { findMany: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
  user: { findUnique: vi.fn(), update: vi.fn() },
}));
const brandContextMocks = vi.hoisted(() => ({
  getBrandContext: vi.fn(),
  getBrandDnaVersion: vi.fn(),
  buildBrandContextPrompt: vi.fn(),
}));
const generatorMocks = vi.hoisted(() => ({
  generateContentPillars: vi.fn(),
  generateCalendar: vi.fn(),
  generatePost: vi.fn(),
}));
const generationMocks = vi.hoisted(() => ({ runGeneration: vi.fn() }));

vi.mock('@/lib/prisma', () => ({ default: prismaMocks }));
vi.mock('@/modules/brand-dna/services/BrandContextProvider', () => brandContextMocks);
vi.mock('@/modules/ai/generation', async () => {
  const actual = await vi.importActual<typeof import('@/modules/ai/generation')>('@/modules/ai/generation');
  return { ...actual, runGeneration: generationMocks.runGeneration };
});
vi.mock('./contentGenerators', () => generatorMocks);

import { contentEngineService } from './contentEngineService';
import { CONTENT_COMMAND_CENTER_PLATFORMS } from './types';
import { composeGenerationSystemPrompt, GENERATION_DEGRADE_LABEL } from '@/modules/ai/generation';

describe('contentEngineService.generatePlatformPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    brandContextMocks.getBrandContext.mockResolvedValue({
      brandName: '测试品牌',
      personalName: '林教练',
      positioning: '帮助新手建立稳定内容习惯',
      audience: '希望改善健康习惯的上班族',
      audiencePainPoints: ['没有时间规划'],
      messaging: { coreMessage: '从一个小行动开始', uniqueAngle: '轻量实作', elevatorPitch: '每天十分钟的内容方法' },
      contentPillars: [{ name: '教育内容', emoji: '📚', percentage: 100, description: 'Useful advice' }],
      offer: { primary: '健康习惯指导', transformation: '从混乱到清晰' },
      tone: '真诚直接',
      visualIdentity: { colors: [], imagePrompt: '', bannerPrompt: '' },
    });
    brandContextMocks.getBrandDnaVersion.mockResolvedValue(9);
    brandContextMocks.buildBrandContextPrompt.mockReturnValue('【品牌上下文】\n测试品牌');
    generatorMocks.generatePost.mockReturnValue({
      id: 'post-temporary-id',
      pillar: '教育内容',
      pillarEmoji: '📚',
      title: 'Temporary generated title',
      hook: 'Hook',
      body: 'Generated body',
      cta: 'CTA',
      hashtags: ['#test'],
      platform: 'facebook',
      format: 'text_post',
      funnelStage: 'awareness',
      status: 'generated',
      qualityScore: 75,
      createdAt: '2026-07-15T00:00:00.000Z',
      updatedAt: '2026-07-15T00:00:00.000Z',
    });
    prismaMocks.content.create.mockImplementation(async ({ data }) => ({
      id: 'content-canonical-id',
      title: data.title,
      body: data.body,
      platform: data.platform,
      type: data.type,
      status: 'draft',
      createdAt: new Date('2026-07-15T01:02:03.000Z'),
      updatedAt: new Date('2026-07-15T01:03:04.000Z'),
    }));
    generationMocks.runGeneration.mockImplementation(async (_user, options) => {
      const text = JSON.stringify({
        title: '下班后也能开始的健康习惯',
        hook: '不是意志力不够，而是你还没有一个能坚持的起点。',
        body: '下班后想照顾自己，却总觉得时间不够，是许多上班族都会遇到的难题。先不要逼自己一次改变所有习惯，今晚只要准备一杯水、走十分钟路，并把明天早餐写进备忘录。小步骤更容易重复，重复才会变成真正属于你的节奏。',
        cta: '留言「开始」，我把这份十分钟行动清单发给你。',
        hashtags: ['#健康习惯', '#上班族生活', '#轻量改变'],
      });
      return {
        status: 'success',
        source: 'ai',
        value: options.parse(text),
        text,
        result: {},
      };
    });
  });

  it('generates a structured AI draft through the content gateway and persists its real source', async () => {
    const result = await contentEngineService.generatePlatformPost(
      'owner-1',
      'tenant-1',
      'facebook',
      'text_post',
      'awareness',
    );

    expect(prismaMocks.content.create).toHaveBeenCalledTimes(1);
    expect(prismaMocks.content.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        ownerId: 'owner-1',
        status: 'draft',
        title: '下班后也能开始的健康习惯',
        body: expect.stringContaining('下班后想照顾自己'),
        generatedByAi: true,
      }),
    });
    expect(result.id).toBe('content-canonical-id');
    expect(result.id).not.toBe('post-temporary-id');
    expect(result).toMatchObject({
      title: '下班后也能开始的健康习惯',
      body: expect.stringContaining('下班后想照顾自己'),
      platform: 'facebook',
      format: 'text_post',
      status: 'draft',
      createdAt: '2026-07-15T01:02:03.000Z',
    });
    expect(result.generatedByAi).toBe(true);
    expect(result.hook).toContain('不是意志力');
    expect(result.cta).toContain('留言');
    expect(result.hashtags).toEqual(['#健康习惯', '#上班族生活', '#轻量改变']);
    expect(result.body.length).toBeGreaterThan(80);
    expect(JSON.stringify(result)).not.toMatch(/\|\||很多人|我是我/);

    expect(generationMocks.runGeneration).toHaveBeenCalledWith(
      { id: 'owner-1', tenantId: 'tenant-1' },
      expect.objectContaining({
        taskCategory: 'content_generation',
        feature: 'content_engine_post',
        temperature: 0.7,
        maxTokens: 900,
      }),
    );
    const options = generationMocks.runGeneration.mock.calls[0][1];
    const systemPrompt = composeGenerationSystemPrompt(options.context);
    expect(systemPrompt).toContain('测试品牌');
    expect(systemPrompt).toContain('零售模式');
    expect(systemPrompt).toContain('平台写作风格 — Facebook');
    expect(systemPrompt).toContain('只返回合法 JSON');
    expect(options.userMessage).toContain('认知阶段');
    expect(options.userMessage).toContain('图文帖子');
    expect(options.userMessage).not.toContain('awareness');
    expect(options.userMessage).not.toContain('text_post');
  });

  it('persists a labelled template fallback without misrepresenting it as AI output', async () => {
    generationMocks.runGeneration.mockImplementation(async (_user, options) => ({
      status: 'degraded',
      source: 'template_fallback',
      value: options.fallback,
      userVisibleLabel: GENERATION_DEGRADE_LABEL,
      reason: 'Router unavailable',
    }));

    const result = await contentEngineService.generatePlatformPost(
      'owner-1',
      'tenant-1',
      'facebook',
      'text_post',
      'awareness',
    );

    expect(generationMocks.runGeneration.mock.calls[0][1].fallback).toEqual(
      expect.objectContaining({ title: 'Temporary generated title', body: 'Generated body' }),
    );
    expect(prismaMocks.content.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Temporary generated title',
        body: 'Generated body',
        generatedByAi: false,
      }),
    });
    expect(result).toMatchObject({
      generatedByAi: false,
      degradedLabel: GENERATION_DEGRADE_LABEL,
      title: 'Temporary generated title',
      body: 'Generated body',
    });
  });
});

describe('contentEngineService.getLastPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refresh-hydrates the latest E1-compatible canonical text post', async () => {
    prismaMocks.content.findFirst.mockResolvedValue({
      id: 'content-refresh-id',
      title: 'Saved title',
      body: 'Saved body',
      platform: 'instagram',
      type: 'text_post',
      status: 'draft',
      createdAt: new Date('2026-07-15T02:03:04.000Z'),
      updatedAt: new Date('2026-07-15T03:04:05.000Z'),
    });

    const result = await contentEngineService.getLastPost('owner-1');

    expect(prismaMocks.content.findFirst).toHaveBeenCalledWith({
      where: {
        ownerId: 'owner-1',
        type: 'text_post',
        platform: { in: [...CONTENT_COMMAND_CENTER_PLATFORMS] },
        status: { in: ['draft', 'generated', 'copied', 'published'] },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
    expect(result).toMatchObject({
      id: 'content-refresh-id',
      title: 'Saved title',
      body: 'Saved body',
      platform: 'instagram',
      format: 'text_post',
      status: 'draft',
      createdAt: '2026-07-15T02:03:04.000Z',
      updatedAt: '2026-07-15T03:04:05.000Z',
    });
  });

  it.each([
    ['legacy post type', { type: 'post', platform: 'facebook' }],
    ['WhatsApp record', { type: 'text_post', platform: 'whatsapp' }],
    ['legacy Xiaohongshu alias', { type: 'text_post', platform: 'xiaohongshu' }],
    ['missing platform', { type: 'text_post', platform: null }],
    ['unknown status', { type: 'text_post', platform: 'facebook', status: 'archived' }],
  ])('does not expose an incompatible %s to the E1 editor', async (_case, incompatible) => {
    prismaMocks.content.findFirst.mockResolvedValue({
      id: 'content-incompatible-id',
      title: 'Not an E1 draft',
      body: 'Unsupported body',
      status: 'draft',
      createdAt: new Date('2026-07-15T02:03:04.000Z'),
      updatedAt: new Date('2026-07-15T03:04:05.000Z'),
      ...incompatible,
    });

    await expect(contentEngineService.getLastPost('owner-1')).resolves.toBeNull();
  });
});
