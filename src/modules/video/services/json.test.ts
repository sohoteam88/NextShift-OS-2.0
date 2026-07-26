import { describe, expect, it, vi } from 'vitest';

const generationMocks = vi.hoisted(() => ({
  buildGenerationContext: vi.fn(),
  runGeneration: vi.fn(),
}));

vi.mock('@/modules/ai/generation', () => generationMocks);

import { generateVideoJson, parseJsonFromAI } from './json';

describe('video JSON generation', () => {
  it('does not return a template value when the model response is malformed', () => {
    expect(() => parseJsonFromAI('this is not JSON')).toThrow('AI returned malformed JSON');
  });

  it('retries malformed model output and exposes the labelled degraded fallback', async () => {
    generationMocks.buildGenerationContext.mockResolvedValue({});
    generationMocks.runGeneration.mockImplementation(async (_user, options) => {
      expect(() => options.parse('not JSON')).toThrow('AI returned malformed JSON');
      return {
        status: 'degraded',
        source: 'template_fallback',
        value: options.fallback,
        userVisibleLabel: 'AI 暂时不可用，这是基础版本',
        reason: 'AI returned malformed JSON',
      };
    });

    const outcome = await generateVideoJson(
      { id: 'user-1', tenantId: 'tenant-1', email: '', role: '', name: '', preferredLanguage: 'zh', status: 'active' },
      { systemPrompt: 'Return JSON', userMessage: 'Generate', feature: 'video_json_test', fallback: { title: '基础版本' }, platform: 'tiktok' },
    );

    expect(generationMocks.runGeneration).toHaveBeenCalledTimes(2);
    expect(outcome).toMatchObject({
      status: 'degraded',
      source: 'template_fallback',
      userVisibleLabel: 'AI 暂时不可用，这是基础版本',
      value: { title: '基础版本' },
    });
  });
});
