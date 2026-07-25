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

  it('rewrites brand-hidden AI output while retaining generatedByAi', async () => {
    generationMocks.runGeneration.mockResolvedValue({
      status: 'success',
      source: 'ai',
      value: {
        ...generatorMocks.generatePost.mock.results[0]?.value,
        id: 'post-temporary-id',
        pillar: '教育内容',
        pillarEmoji: '📚',
        title: 'Herbalife 奶昔的减肥习惯',
        hook: 'Herbalife 产品（整体）如何融入日常？',
        body: '很多人想让生活习惯更稳定，可以先为自己准备一份简单早餐，并记录每天的感受和变化。持续执行小行动，比突然改变所有事情更容易坚持下来。',
        cta: '留言了解 Herbalife 奶昔。',
        hashtags: ['#Herbalife', '#减肥'],
        platform: 'facebook',
        format: 'text_post',
        funnelStage: 'awareness',
        status: 'generated',
        qualityScore: 75,
        createdAt: '2026-07-15T00:00:00.000Z',
        updatedAt: '2026-07-15T00:00:00.000Z',
      },
      text: 'unused',
      result: {},
    });

    const result = await contentEngineService.generatePlatformPost(
      'owner-1',
      'tenant-1',
      'facebook',
      'text_post',
      'awareness',
    );

    expect(result.generatedByAi).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/Herbalife|贺宝芙|康宝莱|减肥/i);
    expect(result.title).toContain('营养早餐／营养代餐');
    expect(result.title).toContain('体重管理');
    expect(prismaMocks.content.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ generatedByAi: true, title: result.title, body: result.body }),
    });
  });

  it('retries rejected AI posts twice, then persists only the labelled clean template fallback', async () => {
    const rejectedAiOutcome = (body: string) => ({
      status: 'success' as const,
      source: 'ai' as const,
      value: {
        ...generatorMocks.generatePost.mock.results[0]?.value,
        id: 'post-temporary-id',
        pillar: '教育内容',
        pillarEmoji: '📚',
        title: 'Unsafe title',
        hook: 'Unsafe hook',
        body,
        cta: 'Unsafe CTA',
        hashtags: ['#unsafe'],
        platform: 'facebook',
        format: 'text_post',
        funnelStage: 'awareness',
        status: 'generated',
        qualityScore: 75,
        createdAt: '2026-07-15T00:00:00.000Z',
        updatedAt: '2026-07-15T00:00:00.000Z',
      },
      text: 'unused',
      result: {},
    });
    generationMocks.runGeneration
      .mockResolvedValueOnce(rejectedAiOutcome('加入后月入RM8,000，包赚。'))
      .mockResolvedValueOnce(rejectedAiOutcome('这个方法可以治愈问题并保证瘦。'))
      .mockResolvedValueOnce(rejectedAiOutcome('这是一款减肥药，能保证瘦下来。'));

    const result = await contentEngineService.generatePlatformPost(
      'owner-1',
      'tenant-1',
      'facebook',
      'text_post',
      'awareness',
    );

    expect(generationMocks.runGeneration).toHaveBeenCalledTimes(3);
    expect(result).toMatchObject({
      generatedByAi: false,
      degradedLabel: GENERATION_DEGRADE_LABEL,
      title: 'Temporary generated title',
    });
    expect(JSON.stringify(result)).not.toMatch(/月入|包赚|治愈|减肥药|保证瘦/i);
    expect(prismaMocks.content.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ generatedByAi: false, title: 'Temporary generated title' }),
    });
  });

  it('keeps 20 mixed dirty generations out of persisted and returned public content', async () => {
    const dirtyBodies = [
      'Herbalife 奶昔可以配合日常节奏，让你更容易安排早餐和运动时间。',
      '加入后日入RM500，包赚的机会就在这里。',
      '这不是普通建议，它可以治愈问题并保证瘦下来。',
    ];
    let call = 0;
    generationMocks.runGeneration.mockImplementation(async (_user, options) => {
      const body = dirtyBodies[call % dirtyBodies.length];
      call += 1;
      return {
        status: 'success',
        source: 'ai',
        value: {
          ...options.fallback,
          title: body.includes('Herbalife') ? 'Herbalife 奶昔日常' : '安全标题',
          hook: '从日常的小行动开始。',
          body,
          cta: '留言了解更多。',
          hashtags: body.includes('Herbalife') ? ['#Herbalife', '#减肥'] : ['#健康习惯'],
        },
        text: 'unused',
        result: {},
      };
    });

    const results = await Promise.all(Array.from({ length: 20 }, () => contentEngineService.generatePlatformPost(
      'owner-1',
      'tenant-1',
      'facebook',
      'text_post',
      'awareness',
    )));
    const badOutput = /Herbalife|贺宝芙|康宝莱|月入|日入\s*RM|包赚|治愈|减肥药|保证瘦/i;

    expect(results).toHaveLength(20);
    expect(prismaMocks.content.create).toHaveBeenCalledTimes(20);
    for (const result of results) {
      expect(JSON.stringify(result)).not.toMatch(badOutput);
    }
    for (const call of prismaMocks.content.create.mock.calls) {
      expect(JSON.stringify(call[0].data)).not.toMatch(badOutput);
    }
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
