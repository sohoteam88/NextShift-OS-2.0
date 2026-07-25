import { describe, expect, it } from 'vitest';
import { EMPTY_BRAND_DNA } from '@/modules/brand-dna/types';
import {
  confirmTopic,
  createForkedInterviewState,
  getFunnelTopicSequence,
  mapConfirmedFunnelToBrandDna,
  setTopicConfirmation,
  setTopicFacts,
  setTopicOption,
} from './funnelDefinition';

function answerCurrent(state: ReturnType<typeof createForkedInterviewState>, option: string, sentence: string, facts: string[] = []) {
  return confirmTopic(setTopicConfirmation(setTopicFacts(setTopicOption(state, option), facts, facts.length === 0), sentence));
}

describe('forked interview definition and state machine', () => {
  it('routes A through 2A and B through 2B', () => {
    const a = setTopicOption(createForkedInterviewState(), 'product_first');
    const b = setTopicOption(createForkedInterviewState(), 'opportunity_first');

    expect(getFunnelTopicSequence(a.entryPath)).toEqual(['entry_path', 'product_change', 'past_career', 'business_direction', 'weekly_rhythm']);
    expect(getFunnelTopicSequence(b.entryPath)).toEqual(['entry_path', 'change_reason', 'past_career', 'business_direction', 'weekly_rhythm']);
  });

  it('allows the fact follow-up to be skipped and still reaches confirmation', () => {
    const selected = setTopicOption(createForkedInterviewState(), 'product_first');
    const skipped = setTopicFacts(selected, [], true);
    expect(skipped.phase).toBe('confirmation');
    expect(skipped.topics.entry_path).toMatchObject({ facts: [], factsSkipped: true });
  });

  it('maps confirmed sentences into the stable Brand DNA fields at completion', () => {
    let state = createForkedInterviewState();
    state = answerCurrent(state, 'product_first', '我先体验到变化，才决定认真开始。');
    state = answerCurrent(state, 'energy', '我用了一段时间后，精神更稳定。', ['用了三个月']);
    state = answerCurrent(state, 'employee', '做了八年上班族的我，最懂下班后仍想照顾自己的节奏。', ['八年']);
    state = answerCurrent(state, 'retail', '我想先服务身边想照顾日常状态的同事。', ['同事']);
    state = answerCurrent(state, 'five_to_ten_hours', '我每周会在晚上安排五到十小时持续分享。', ['晚上']);

    expect(state.phase).toBe('completed');
    const dna = mapConfirmedFunnelToBrandDna(EMPTY_BRAND_DNA, state);
    expect(dna.messaging.coreMessage).toContain('体验到变化');
    expect(dna.offer.transformationPromise).toContain('精神更稳定');
    expect(dna.identity.brandPositioning).toContain('八年上班族');
    expect(dna.audience.targetAudience).toBe('同事');
    expect(dna.content.storytellingStyle).toContain('五到十小时');
  });
});
