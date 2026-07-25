import { describe, expect, it } from 'vitest';
import { EMPTY_BRAND_DNA } from '@/modules/brand-dna/types';
import { businessPack } from '@/modules/ai/business-pack';
import { validateBrandDNA } from '@/modules/brand-dna/services/brandDnaValidator';
import { fillForkedInterviewBrandDnaDefaults } from './brandDnaDefaults';
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

  it.each([
    ['A', 'product_first', 'energy', '我开始记录更稳定的日常状态。'],
    ['B', 'opportunity_first', 'time', '我想把时间安排得更自主一些。'],
  ] as const)('fills every required DNA field and provenance for path %s', (_path, entryOption, changeOption, changeSentence) => {
    let state = createForkedInterviewState();
    state = answerCurrent(state, entryOption, '这是我确认过的入场故事。');
    state = answerCurrent(state, changeOption, changeSentence);
    state = answerCurrent(state, 'employee', '我过去是上班族，也理解忙碌后的疲惫。');
    state = answerCurrent(state, 'retail', '我想先服务身边愿意交流的同事。', ['身边同事']);
    state = answerCurrent(state, 'five_to_ten_hours', '我会在晚上安排稳定的分享节奏。');

    const completed = fillForkedInterviewBrandDnaDefaults(
      mapConfirmedFunnelToBrandDna(EMPTY_BRAND_DNA, state),
      state,
      businessPack,
    );

    expect(validateBrandDNA(completed).missingFields).toEqual([]);
    expect(completed.meta.fieldProvenance).toMatchObject({
      'messaging.coreMessage': 'user_confirmed',
      'offer.primaryOffer': 'user_confirmed',
      'identity.brandName': 'coach_defaulted',
      'messaging.elevatorPitch': 'coach_defaulted',
      'visual.profileImagePrompt': 'coach_defaulted',
    });
    expect(JSON.stringify(completed)).not.toMatch(/herbalife|贺宝芙|康宝莱|RM\d|\d+\s*(公斤|kg)|收入保证/i);
  });
});
