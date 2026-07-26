import { beforeEach, describe, expect, it, vi } from 'vitest';

const generationMocks = vi.hoisted(() => ({
  buildGenerationContext: vi.fn(),
  runGeneration: vi.fn(),
}));
const businessPackMocks = vi.hoisted(() => ({ getBusinessPackSlice: vi.fn(), getComplianceRewriteRules: vi.fn() }));

vi.mock('@/modules/ai/generation', () => ({
  buildGenerationContext: generationMocks.buildGenerationContext,
  runGeneration: generationMocks.runGeneration,
  GENERATION_DEGRADE_LABEL: 'AI 暂时不可用，这是基础版本',
}));
vi.mock('@/modules/ai/business-pack', () => ({
  getBusinessPackSlice: businessPackMocks.getBusinessPackSlice,
  getComplianceRewriteRules: businessPackMocks.getComplianceRewriteRules,
}));

import { funnelCopyService, type FunnelCopyOutput } from './funnel-copy-service';

const user = { id: 'user-1', tenantId: 'tenant-1' } as never;

function safeCopy(): FunnelCopyOutput {
  return {
    hero: { headline: '从清晰行动开始', subheadline: '了解适合自己的下一步。', cta_text: '查看说明' },
    pain: { title: '常见困扰', items: [{ text: '不知道先从哪里开始。' }] },
    mechanism: { title: '简单步骤', description: '先整理重点，再决定下一步。' },
    benefits: { title: '你会获得', items: [{ icon: 'check', title: '清晰方向', description: '获得实用说明。' }] },
    faq: { title: '常见问题', items: [{ question: '适合谁？', answer: '适合希望了解下一步的人。' }] },
    cta: { headline: '准备好了吗？', subheadline: '从说明开始。', button_text: '了解更多' },
  };
}

describe('funnelCopyService.generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    businessPackMocks.getBusinessPackSlice.mockReturnValue({ promptContext: '仅限当前轨道的事业包' });
    businessPackMocks.getComplianceRewriteRules.mockReturnValue({ rewriteRules: [], redLines: [] });
    generationMocks.buildGenerationContext.mockImplementation(async (_user, options) => ({
      ...options,
      brandDnaVersion: 9,
      brandContext: null,
      platform: { platform: options.platform },
    }));
    generationMocks.runGeneration.mockImplementation(async (_user, options) => ({
      status: 'success', source: 'ai', value: safeCopy(), text: 'unused', result: { tokensIn: 10, tokensOut: 20 },
    }));
  });

  it.each(['retail', 'recruitment'] as const)('uses G0 and track-scoped G4 inputs for %s', async (track) => {
    const result = await funnelCopyService.generate(user, {
      funnelType: 'landing', track, audience: '测试受众', offer: '测试服务',
    });

    expect(result).toMatchObject({ generatedByAi: true, tokensUsed: 30 });
    expect(businessPackMocks.getBusinessPackSlice).toHaveBeenCalledWith({ track, platform: 'blog' });
    expect(generationMocks.buildGenerationContext).toHaveBeenCalledWith(user, expect.objectContaining({ mode: track, platform: 'blog' }));
    expect(generationMocks.runGeneration).toHaveBeenCalledWith(user, expect.objectContaining({
      context: expect.objectContaining({ mode: track, brandDnaVersion: 9 }),
      taskCategory: 'funnel_copy',
      feature: 'funnel_copy',
    }));
    expect(generationMocks.runGeneration.mock.calls[0][1].context.businessPack.promptContext).toContain('漏斗文案输出契约');
  });

  it('retries rejected output twice and returns only the labelled safe base', async () => {
    generationMocks.runGeneration.mockImplementation(async () => ({
      status: 'success', source: 'ai', value: { ...safeCopy(), hero: { ...safeCopy().hero, headline: '加入后月入RM8,000，包赚。' } }, text: 'unsafe', result: { tokensIn: 1, tokensOut: 1 },
    }));

    const result = await funnelCopyService.generate(user, {
      funnelType: 'landing', track: 'recruitment', audience: '测试受众', offer: '测试服务',
    });

    expect(generationMocks.runGeneration).toHaveBeenCalledTimes(3);
    expect(result).toMatchObject({ generatedByAi: false, degradedLabel: 'AI 暂时不可用，这是基础版本' });
    expect(JSON.stringify(result.copy)).not.toMatch(/月入|包赚|RM8,000/);
  });

  it('returns the gateway degrade label instead of presenting a template as AI output', async () => {
    generationMocks.runGeneration.mockImplementation(async (_user, options) => ({
      status: 'degraded', source: 'template_fallback', value: options.fallback,
      userVisibleLabel: 'AI 暂时不可用，这是基础版本', reason: 'provider unavailable',
    }));

    const result = await funnelCopyService.generate(user, {
      funnelType: 'landing', track: 'retail', audience: '测试受众', offer: '测试服务',
    });

    expect(result).toMatchObject({ generatedByAi: false, degradedLabel: 'AI 暂时不可用，这是基础版本', tokensUsed: 0 });
  });
});
