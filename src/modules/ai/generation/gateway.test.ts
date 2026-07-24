import { beforeEach, describe, expect, it, vi } from 'vitest';

const brandContextMocks = vi.hoisted(() => ({
  buildBrandContextPrompt: vi.fn(),
  getBrandContext: vi.fn(),
  getBrandDnaVersion: vi.fn(),
}));
const routerMocks = vi.hoisted(() => ({
  getRouterForTenant: vi.fn(),
  generate: vi.fn(),
}));
const quotaMocks = vi.hoisted(() => ({ enforceQuota: vi.fn() }));
const trackerMocks = vi.hoisted(() => ({ logAIUsage: vi.fn() }));

vi.mock('@/modules/brand-dna/services/BrandContextProvider', () => brandContextMocks);
vi.mock('@/modules/ai/router', () => ({ getRouterForTenant: routerMocks.getRouterForTenant }));
vi.mock('@/modules/ai/usage/quota', () => ({ enforceQuota: quotaMocks.enforceQuota }));
vi.mock('@/modules/ai/usage/tracker', () => ({ logAIUsage: trackerMocks.logAIUsage }));

import { buildGenerationContext, composeGenerationSystemPrompt, runGeneration } from './index';

const user = {
  id: 'user-1',
  tenantId: 'tenant-1',
};

const brandContext = {
  brandName: '测试品牌',
  personalName: '测试者',
  positioning: '帮助新手建立内容系统',
  audience: '创业新手',
  audiencePainPoints: ['不知道写什么'],
  messaging: { coreMessage: '内容可以更简单', uniqueAngle: '实操优先', elevatorPitch: '简单内容系统' },
  contentPillars: [],
  offer: { primary: '内容指导', transformation: '从混乱到清晰' },
  tone: '真诚直接',
  visualIdentity: { colors: [], imagePrompt: '', bannerPrompt: '' },
};

const routedResult = {
  text: 'AI output',
  tokensIn: 12,
  tokensOut: 34,
  model: 'gpt-4o-mini',
  provider: 'openai' as const,
  durationMs: 56,
  routing: {
    taskCategory: 'content_generation' as const,
    classification: {
      category: 'content_generation' as const,
      tier: 'B' as const,
      reason: 'test',
      estimatedInputTokens: 1,
      estimatedOutputTokens: 1,
    },
    selectedModel: 'gpt-4o-mini',
    selectedModelName: 'GPT-4o mini',
    selectedTier: 'B',
    provider: 'openai' as const,
    estimatedCost: 0,
    wasEscalated: false,
    originalTier: 'B',
  },
};

describe('generation gateway', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    brandContextMocks.getBrandContext.mockResolvedValue(brandContext);
    brandContextMocks.getBrandDnaVersion.mockResolvedValue(7);
    brandContextMocks.buildBrandContextPrompt.mockReturnValue('【品牌上下文】\n测试品牌');
    quotaMocks.enforceQuota.mockResolvedValue(undefined);
    routerMocks.getRouterForTenant.mockResolvedValue({ generate: routerMocks.generate });
    routerMocks.generate.mockResolvedValue(routedResult);
    trackerMocks.logAIUsage.mockResolvedValue(undefined);
  });

  it('builds a context and prompt with brand version, mode, and platform guidance', async () => {
    const context = await buildGenerationContext(user, {
      mode: 'retail',
      platform: 'xhs',
      businessPack: { promptContext: '上游注入的业务资料' },
    });
    const prompt = composeGenerationSystemPrompt(context);

    expect(context).toMatchObject({
      brandContext,
      brandDnaVersion: 7,
      mode: 'retail',
      platform: { platform: 'xhs', label: '小红书' },
    });
    expect(brandContextMocks.buildBrandContextPrompt).toHaveBeenCalledWith(brandContext);
    expect(prompt).toContain('测试品牌');
    expect(prompt).toContain('品牌 DNA 版本】7');
    expect(prompt).toContain('零售模式');
    expect(prompt).toContain('平台写作风格 — 小红书');
    expect(prompt).toContain('上游注入的业务资料');
  });

  it('runs quota, router generation, and usage logging in order', async () => {
    const calls: string[] = [];
    quotaMocks.enforceQuota.mockImplementation(async () => { calls.push('quota'); });
    routerMocks.getRouterForTenant.mockImplementation(async () => {
      calls.push('router');
      return { generate: routerMocks.generate };
    });
    routerMocks.generate.mockImplementation(async () => {
      calls.push('generate');
      return routedResult;
    });
    trackerMocks.logAIUsage.mockImplementation(async () => { calls.push('usage'); });
    const context = await buildGenerationContext(user, { mode: 'recruitment', platform: 'facebook' });

    const outcome = await runGeneration(user, {
      context,
      userMessage: 'Write a post',
      taskCategory: 'content_generation',
      feature: 'generation_gateway_test',
      fallback: 'Template fallback',
      temperature: 0.6,
      maxTokens: 500,
    });

    expect(calls).toEqual(['quota', 'router', 'generate', 'usage']);
    expect(routerMocks.generate).toHaveBeenCalledWith(expect.objectContaining({
      userMessage: 'Write a post',
      temperature: 0.6,
      maxTokens: 500,
    }), 'content_generation');
    expect(outcome).toMatchObject({ status: 'success', source: 'ai', value: 'AI output' });
  });

  it('returns an explicitly labelled fallback when the router fails', async () => {
    routerMocks.generate.mockRejectedValue(new Error('Router unavailable'));
    const context = await buildGenerationContext(user, { mode: 'retail', platform: 'instagram' });

    const outcome = await runGeneration(user, {
      context,
      userMessage: 'Write a post',
      taskCategory: 'content_generation',
      feature: 'generation_gateway_test',
      fallback: { title: '基础版本' },
    });

    expect(outcome).toEqual(expect.objectContaining({
      status: 'degraded',
      source: 'template_fallback',
      value: { title: '基础版本' },
      userVisibleLabel: 'AI 暂时不可用，这是基础版本',
      reason: 'Router unavailable',
    }));
    expect(trackerMocks.logAIUsage).not.toHaveBeenCalled();
  });
});
