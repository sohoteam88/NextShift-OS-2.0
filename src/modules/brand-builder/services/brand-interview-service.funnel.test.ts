import { describe, expect, it, vi } from 'vitest';
import { EMPTY_BRAND_DNA } from '@/modules/brand-dna/types';
import { validateBrandDNA } from '@/modules/brand-dna/services/brandDnaValidator';
import {
  confirmTopic,
  createForkedInterviewState,
  setTopicConfirmation,
  setTopicFacts,
  setTopicOption,
} from '@/modules/brand-discovery/forkedInterview/funnelDefinition';

const prismaMocks = vi.hoisted(() => ({
  brandInterview: { findFirst: vi.fn(), update: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  user: { findUnique: vi.fn(), update: vi.fn() },
  brandProfile: { upsert: vi.fn() },
}));
const dnaMocks = vi.hoisted(() => ({ getBrandDNA: vi.fn(), saveBrandDNA: vi.fn() }));

vi.mock('@/lib/prisma', () => ({ default: prismaMocks }));
vi.mock('@/modules/brand-dna/services/brandDnaService', () => ({ brandDnaService: dnaMocks }));

import { brandInterviewService } from './brand-interview-service';

function answerCurrent(state: ReturnType<typeof createForkedInterviewState>, option: string, sentence: string) {
  return confirmTopic(setTopicConfirmation(setTopicFacts(setTopicOption(state, option), [], true), sentence));
}

describe('forked interview persistence', () => {
  it('saves confirmed stories through versioned Brand DNA and never invokes secondary extraction', async () => {
    let state = createForkedInterviewState();
    state = answerCurrent(state, 'product_first', '我先体验到变化，才决定认真开始。');
    state = answerCurrent(state, 'energy', '我现在会记录自己更稳定的日常状态。');
    state = answerCurrent(state, 'employee', '做过上班族的我，理解下班后的疲惫。');
    state = answerCurrent(state, 'retail', '我想先服务身边的同事。');
    state = setTopicConfirmation(setTopicFacts(setTopicOption(state, 'five_to_ten_hours'), [], true), '我会在晚上安排稳定的分享节奏。');

    const interview = { id: 'interview-1', mode: 'funnel', answers: { __forked_funnel: state } };
    prismaMocks.brandInterview.findFirst.mockResolvedValue(interview);
    prismaMocks.brandInterview.update.mockResolvedValue(interview);
    prismaMocks.user.findUnique.mockResolvedValue({ metadata: {} });
    prismaMocks.user.update.mockResolvedValue({});
    dnaMocks.getBrandDNA.mockResolvedValue(EMPTY_BRAND_DNA);
    dnaMocks.saveBrandDNA.mockImplementation(async (_userId: string, dna: typeof EMPTY_BRAND_DNA) => ({
      ...dna,
      meta: { ...dna.meta, version: dna.meta.version + 1 },
    }));
    const extractionSpy = vi.spyOn(brandInterviewService, 'extractBrandProfile');

    const result = await brandInterviewService.confirmForkedInterviewTopic('interview-1', { id: 'user-1', tenantId: 'tenant-1' } as any);

    expect(result.state.phase).toBe('completed');
    expect(dnaMocks.saveBrandDNA).toHaveBeenCalledWith('user-1', expect.objectContaining({
      content: expect.objectContaining({ storytellingStyle: '我会在晚上安排稳定的分享节奏。' }),
    }));
    const savedInput = dnaMocks.saveBrandDNA.mock.calls[0]?.[1];
    expect(validateBrandDNA(savedInput)).toMatchObject({ missingFields: [] });
    expect(result.dna?.meta.version).toBe(2);
    expect(extractionSpy).not.toHaveBeenCalled();
  });
});
