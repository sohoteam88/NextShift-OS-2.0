import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_BRAND_DNA } from '@/modules/brand-dna/types';
import { validateBrandDNA } from '@/modules/brand-dna/services/brandDnaValidator';
import {
  confirmTopic,
  createForkedInterviewState,
  goToPreviousTopic,
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps Brand DNA version unchanged while revising topic 1 within the same path', async () => {
    let state = createForkedInterviewState();
    state = answerCurrent(state, 'product_first', '我先体验到变化，才决定认真开始。');
    state = answerCurrent(state, 'energy', '我现在会记录自己更稳定的日常状态。');
    state = goToPreviousTopic(goToPreviousTopic(state));
    const productChange = structuredClone(state.topics.product_change);
    const interview = { id: 'interview-1', mode: 'funnel', answers: { __forked_funnel: state } };
    prismaMocks.brandInterview.findFirst.mockResolvedValue(interview);
    prismaMocks.brandInterview.update.mockResolvedValue(interview);

    const result = await brandInterviewService.selectForkedInterviewOption(
      'interview-1',
      { id: 'user-1', tenantId: 'tenant-1' },
      'simultaneous',
    );

    expect(result.state.entryPath).toBe('A');
    expect(result.state.topics.product_change).toEqual(productChange);
    expect(dnaMocks.getBrandDNA).not.toHaveBeenCalled();
    expect(dnaMocks.saveBrandDNA).not.toHaveBeenCalled();
  });

  it('saves confirmed stories through versioned Brand DNA and never invokes secondary extraction', async () => {
    let state = createForkedInterviewState();
    state = answerCurrent(state, 'product_first', '我先体验到变化，才决定认真开始。');
    state = answerCurrent(state, 'energy', '我现在会记录自己更稳定的日常状态。');
    state = goToPreviousTopic(goToPreviousTopic(state));
    state = setTopicOption(state, 'opportunity_first');
    state = confirmTopic(setTopicConfirmation(
      setTopicFacts(state, [], true),
      '我先看到事业机会，才开始认真体验产品。',
    ));
    state = answerCurrent(state, 'time', '我想把时间安排得更自主一些。');
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
    expect(dnaMocks.saveBrandDNA).toHaveBeenCalledTimes(1);
    expect(dnaMocks.saveBrandDNA).toHaveBeenCalledWith('user-1', expect.objectContaining({
      content: expect.objectContaining({ storytellingStyle: '我会在晚上安排稳定的分享节奏。' }),
      messaging: expect.objectContaining({ coreMessage: expect.stringContaining('先看到事业机会') }),
      offer: expect.objectContaining({ transformationPromise: '我想把时间安排得更自主一些。' }),
    }));
    const savedInput = dnaMocks.saveBrandDNA.mock.calls[0]?.[1];
    expect(validateBrandDNA(savedInput)).toMatchObject({ missingFields: [] });
    expect(savedInput?.meta.fieldProvenance).toMatchObject({
      'messaging.coreMessage': 'user_confirmed',
      'identity.brandPositioning': 'user_confirmed',
      'content.storytellingStyle': 'user_confirmed',
    });
    expect(result.dna?.meta.version).toBe(2);
    expect(extractionSpy).not.toHaveBeenCalled();
  });
});
