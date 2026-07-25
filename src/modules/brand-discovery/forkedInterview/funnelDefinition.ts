import type { BrandDNA } from '@/modules/brand-dna/types';
import type { ContentTrack } from '@/modules/content-engine/types';

export type EntryPath = 'A' | 'B';
export type FunnelTopicId = 'entry_path' | 'product_change' | 'change_reason' | 'past_career' | 'business_direction' | 'weekly_rhythm';
export type FunnelPhase = 'choice' | 'facts' | 'confirmation' | 'completed';
export type BusinessMode = ContentTrack | 'both';

export type FunnelOption = {
  id: string;
  label: string;
  value?: string;
};

export type FunnelTopic = {
  id: FunnelTopicId;
  label: string;
  question: string;
  options: readonly FunnelOption[];
  followUp: {
    prompt: string;
    maxSentences: 2;
    canSkip: true;
  };
  brandDnaTarget: string;
};

/**
 * The one-pager's five-topic interview, represented as data so UI and service
 * logic can traverse the same definition without hard-coded question branches.
 */
export const FORKED_INTERVIEW_TOPICS: Record<FunnelTopicId, FunnelTopic> = {
  entry_path: {
    id: 'entry_path',
    label: '入场路径',
    question: '你是怎么开始的？',
    options: [
      { id: 'product_first', label: '先用产品有效果才加入' },
      { id: 'opportunity_first', label: '先看到事业机会，产品刚开始用' },
      { id: 'simultaneous', label: '两者差不多同时' },
    ],
    followUp: { prompt: '这一题不用补充，直接让我帮你整理入场故事。', maxSentences: 2, canSkip: true },
    brandDnaTarget: '故事原型',
  },
  product_change: {
    id: 'product_change',
    label: '产品改变',
    question: '最大的变化是？',
    options: [
      { id: 'weight', label: '瘦了' }, { id: 'energy', label: '更有精神' }, { id: 'skin', label: '皮肤好' },
      { id: 'digestion', label: '肠胃好' }, { id: 'family', label: '家人受益' }, { id: 'other', label: '其他' },
    ],
    followUp: { prompt: '瘦了几公斤？用了几个月？之前试过什么没用？（最多两句，可跳过）', maxSentences: 2, canSkip: true },
    brandDnaTarget: '结果见证故事',
  },
  change_reason: {
    id: 'change_reason',
    label: '改变理由',
    question: '当时最想改变什么？',
    options: [
      { id: 'income', label: '收入不够' }, { id: 'time', label: '时间不自由' }, { id: 'career', label: '工作看不到头' },
      { id: 'family', label: '想陪家人' }, { id: 'own_business', label: '想有自己的事业' },
    ],
    followUp: { prompt: '这个状态持续几年了？是什么场合让你看到这个机会？（最多两句，可跳过）', maxSentences: 2, canSkip: true },
    brandDnaTarget: '改变宣言故事',
  },
  past_career: {
    id: 'past_career',
    label: '过去职业',
    question: '过去主要是什么身份？',
    options: [
      { id: 'employee', label: '上班族' }, { id: 'factory', label: '工厂' }, { id: 'self_employed', label: '自营' },
      { id: 'full_time_parent', label: '全职妈妈' }, { id: 'retired', label: '退休' }, { id: 'other', label: '其他' },
    ],
    followUp: { prompt: '做了几年？每天最累的是什么？（最多两句，可跳过）', maxSentences: 2, canSkip: true },
    brandDnaTarget: '职业／Twin 人设',
  },
  business_direction: {
    id: 'business_direction',
    label: '事业方向',
    question: '想先做什么？',
    options: [
      { id: 'retail', label: '卖产品' }, { id: 'recruitment', label: '建团队' }, { id: 'both', label: '都要' },
    ],
    followUp: { prompt: '身边最可能买的是哪类人？（同事／妈妈群／街坊／网友，最多两句，可跳过）', maxSentences: 2, canSkip: true },
    brandDnaTarget: 'mode + 受众',
  },
  weekly_rhythm: {
    id: 'weekly_rhythm',
    label: '投入节奏',
    question: '一周能拿出多少时间？',
    options: [
      { id: 'two_to_three_hours', label: '2–3 小时' }, { id: 'five_to_ten_hours', label: '5–10 小时' }, { id: 'full_time', label: '全职拼' },
    ],
    followUp: { prompt: '一般什么时段有空？（早／午／晚，最多两句，可跳过）', maxSentences: 2, canSkip: true },
    brandDnaTarget: '任务节奏',
  },
};

export type FunnelTopicState = {
  optionId?: string;
  facts: string[];
  factsSkipped: boolean;
  confirmation?: string;
  confirmed: boolean;
};

export type ForkedInterviewState = {
  version: 1;
  entryPath?: EntryPath;
  phase: FunnelPhase;
  currentTopicId: FunnelTopicId;
  topics: Partial<Record<FunnelTopicId, FunnelTopicState>>;
  businessMode?: BusinessMode;
};

export function createForkedInterviewState(): ForkedInterviewState {
  return { version: 1, phase: 'choice', currentTopicId: 'entry_path', topics: {} };
}

export function entryPathForOption(optionId: string): EntryPath {
  return optionId === 'opportunity_first' ? 'B' : 'A';
}

export function getFunnelTopicSequence(entryPath?: EntryPath): FunnelTopicId[] {
  return ['entry_path', entryPath === 'B' ? 'change_reason' : 'product_change', 'past_career', 'business_direction', 'weekly_rhythm'];
}

export function getTopic(state: ForkedInterviewState): FunnelTopic {
  return FORKED_INTERVIEW_TOPICS[state.currentTopicId];
}

export function getSelectedOption(topic: FunnelTopic, topicState?: FunnelTopicState): FunnelOption | undefined {
  return topic.options.find((option) => option.id === topicState?.optionId);
}

export function setTopicOption(state: ForkedInterviewState, optionId: string): ForkedInterviewState {
  const topic = getTopic(state);
  if (!topic.options.some((option) => option.id === optionId)) throw new Error('Invalid funnel option');
  const next: ForkedInterviewState = structuredClone(state);
  next.topics[topic.id] = { facts: [], factsSkipped: false, confirmed: false, optionId };
  if (topic.id === 'entry_path') next.entryPath = entryPathForOption(optionId);
  if (topic.id === 'business_direction') next.businessMode = optionId as BusinessMode;
  next.phase = 'facts';
  return next;
}

export function setTopicFacts(state: ForkedInterviewState, facts: string[], factsSkipped: boolean): ForkedInterviewState {
  const next: ForkedInterviewState = structuredClone(state);
  const previous = next.topics[next.currentTopicId];
  if (!previous?.optionId) throw new Error('Choose an option before adding facts');
  next.topics[next.currentTopicId] = { ...previous, facts: facts.map((fact) => fact.trim()).filter(Boolean).slice(0, 2), factsSkipped, confirmed: false };
  next.phase = 'confirmation';
  return next;
}

export function setTopicConfirmation(state: ForkedInterviewState, confirmation: string): ForkedInterviewState {
  const next: ForkedInterviewState = structuredClone(state);
  const previous = next.topics[next.currentTopicId];
  if (!previous?.optionId) throw new Error('Choose an option before generating confirmation');
  next.topics[next.currentTopicId] = { ...previous, confirmation: confirmation.trim(), confirmed: false };
  next.phase = 'confirmation';
  return next;
}

export function confirmTopic(state: ForkedInterviewState): ForkedInterviewState {
  const next: ForkedInterviewState = structuredClone(state);
  const current = next.topics[next.currentTopicId];
  if (!current?.confirmation?.trim()) throw new Error('Generate a confirmation before continuing');
  next.topics[next.currentTopicId] = { ...current, confirmed: true };
  const sequence = getFunnelTopicSequence(next.entryPath);
  const nextIndex = sequence.indexOf(next.currentTopicId) + 1;
  if (nextIndex >= sequence.length) {
    next.phase = 'completed';
    return next;
  }
  next.currentTopicId = sequence[nextIndex];
  next.phase = 'choice';
  return next;
}

export function generationTrackForState(state: ForkedInterviewState): ContentTrack {
  // "both" is a business-direction value, not a ContentTrack. Before topic 4
  // is known (and for both) the public retail slice is the conservative prompt
  // context; the separate businessMode remains faithfully persisted.
  return state.businessMode === 'recruitment' ? 'recruitment' : 'retail';
}

function confirmed(state: ForkedInterviewState, topicId: FunnelTopicId): string {
  return state.topics[topicId]?.confirmed ? state.topics[topicId]?.confirmation?.trim() ?? '' : '';
}

/** Maps confirmed wording directly into the stable Brand DNA contract. */
export function mapConfirmedFunnelToBrandDna(current: BrandDNA, state: ForkedInterviewState): BrandDNA {
  const entry = confirmed(state, 'entry_path');
  const change = confirmed(state, state.entryPath === 'B' ? 'change_reason' : 'product_change');
  const career = confirmed(state, 'past_career');
  const direction = confirmed(state, 'business_direction');
  const rhythm = confirmed(state, 'weekly_rhythm');
  const businessTopic = state.topics.business_direction;
  const directionOption = getSelectedOption(FORKED_INTERVIEW_TOPICS.business_direction, businessTopic)?.label ?? '';
  const audienceFacts = businessTopic?.facts ?? [];

  return {
    ...current,
    identity: { ...current.identity, brandPositioning: career || current.identity.brandPositioning },
    audience: { ...current.audience, targetAudience: audienceFacts.join('；') || current.audience.targetAudience },
    messaging: {
      ...current.messaging,
      coreMessage: [entry, change].filter(Boolean).join(' ' ) || current.messaging.coreMessage,
      uniqueAngle: career || current.messaging.uniqueAngle,
    },
    content: { ...current.content, storytellingStyle: rhythm || current.content.storytellingStyle },
    offer: {
      ...current.offer,
      primaryOffer: directionOption || current.offer.primaryOffer,
      transformationPromise: change || current.offer.transformationPromise,
    },
    meta: { ...current.meta, updatedAt: new Date().toISOString() },
  };
}

export function funnelProfileForInterview(state: ForkedInterviewState, dna: BrandDNA) {
  return {
    funnel: state,
    entry_story: confirmed(state, 'entry_path'),
    transformation_story: confirmed(state, state.entryPath === 'B' ? 'change_reason' : 'product_change'),
    career_twin: confirmed(state, 'past_career'),
    business_direction: confirmed(state, 'business_direction'),
    business_mode: state.businessMode,
    task_rhythm: confirmed(state, 'weekly_rhythm'),
    dna_version: dna.meta.version,
  };
}
