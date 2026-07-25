import { describe, expect, it, vi } from 'vitest';

const generationMocks = vi.hoisted(() => ({ runGeneration: vi.fn(), buildGenerationContext: vi.fn() }));

vi.mock('@/modules/ai/generation', () => ({
  runGeneration: generationMocks.runGeneration,
  buildGenerationContext: generationMocks.buildGenerationContext,
}));

import { createForkedInterviewState, setTopicFacts, setTopicOption } from './funnelDefinition';
import { filterFunnelConfirmation, generateFunnelConfirmation } from './funnelConfirmationService';

describe('forked interview confirmation generation', () => {
  it('uses the shared G0 generation gateway rather than a provider and does not use a visible fallback', async () => {
    const state = setTopicFacts(setTopicOption(createForkedInterviewState(), 'product_first'), [], true);
    generationMocks.buildGenerationContext.mockResolvedValue({ mode: 'retail' });
    generationMocks.runGeneration.mockResolvedValue({ status: 'success', source: 'ai', value: '我先体验到一些真实变化，才决定开始分享。' });

    const result = await generateFunnelConfirmation({ id: 'user-1', tenantId: 'tenant-1' }, state);

    expect(result).toEqual({ status: 'success', sentence: '我先体验到一些真实变化，才决定开始分享。' });
    expect(generationMocks.runGeneration).toHaveBeenCalledWith(
      { id: 'user-1', tenantId: 'tenant-1' },
      expect.objectContaining({ feature: 'brand_forked_interview_confirmation', fallback: '' }),
    );
  });

  it('keeps G5 failures visible and retryable instead of storing a template sentence', async () => {
    const state = setTopicFacts(setTopicOption(createForkedInterviewState(), 'product_first'), [], true);
    generationMocks.buildGenerationContext.mockResolvedValue({ mode: 'retail' });
    generationMocks.runGeneration.mockResolvedValue({ status: 'degraded', source: 'template_fallback', value: '', userVisibleLabel: 'AI 暂时不可用，这是基础版本', reason: 'router unavailable' });

    await expect(generateFunnelConfirmation({ id: 'user-1', tenantId: 'tenant-1' }, state)).resolves.toMatchObject({
      status: 'degraded', userVisibleLabel: 'AI 暂时不可用，这是基础版本',
    });
  });

  it('uses G4 rewriting to remove brand names and applies extra B-path compliance', () => {
    const a = setTopicFacts(setTopicOption(createForkedInterviewState(), 'product_first'), [], true);
    const brandFiltered = filterFunnelConfirmation('Herbalife 让我开始记录日常状态。', a);
    expect(brandFiltered).toMatchObject({ status: 'success' });
    if (brandFiltered.status === 'success') expect(brandFiltered.sentence).not.toMatch(/herbalife|贺宝芙|康宝莱/i);
    const b = setTopicFacts(setTopicOption(createForkedInterviewState(), 'opportunity_first'), [], true);
    expect(filterFunnelConfirmation('我想通过这个机会增加收入。', b)).toEqual({ status: 'rejected', reason: 'b_path_strict_compliance' });
  });
});
