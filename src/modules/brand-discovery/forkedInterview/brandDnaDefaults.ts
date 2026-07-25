// eslint-disable-next-line no-restricted-imports
import type {
  BrandDNA,
  BrandDnaFieldKey,
  BrandDnaFieldProvenance,
  ContentPillar,
} from '@/modules/brand-dna/types';
import type { BusinessPack, BusinessPackTrack } from '@/modules/ai/business-pack/types';
import {
  FORKED_INTERVIEW_TOPICS,
  generationTrackForState,
  getSelectedOption,
  type ForkedInterviewState,
} from './funnelDefinition';

const FUNNEL_CONFIRMED_FIELDS: BrandDnaFieldKey[] = [
  'identity.brandPositioning',
  'audience.targetAudience',
  'messaging.coreMessage',
  'messaging.uniqueAngle',
  'content.storytellingStyle',
  'offer.primaryOffer',
  'offer.transformationPromise',
];

function isPublicForTrack(
  entry: { track: BusinessPackTrack; visibility: 'public' | 'private' },
  track: Exclude<BusinessPackTrack, 'both'>,
) {
  return entry.visibility === 'public' && (entry.track === track || entry.track === 'both');
}

function publicTrackTerm(pack: BusinessPack, track: Exclude<BusinessPackTrack, 'both'>, fallback: string) {
  const publicTerms = pack.substitutionTable.filter((entry) => isPublicForTrack(entry, track));
  return (track === 'recruitment'
    ? publicTerms.find((entry) => entry.track === track)
    : publicTerms.find((entry) => entry.track === 'both') ?? publicTerms[0]
  )?.publicTerm ?? fallback;
}

/** Applies only the public, in-scope substitutions used by the business-pack provider. */
function applyPublicSubstitutions(text: string, pack: BusinessPack, track: Exclude<BusinessPackTrack, 'both'>) {
  return pack.substitutionTable
    .filter((entry) => isPublicForTrack(entry, track))
    .reduce((result, entry) => result.replaceAll(entry.internalTerm, entry.publicTerm), text);
}

function confirmed(state: ForkedInterviewState, topicId: keyof ForkedInterviewState['topics']) {
  const topic = state.topics[topicId];
  return topic?.confirmed ? topic.confirmation?.trim() ?? '' : '';
}

function contentPillars(existing: ContentPillar[], trackTerm: string): ContentPillar[] {
  const defaults: ContentPillar[] = [
    { name: '真实经历', emoji: '💬', percentage: 40, description: '分享自己持续实践中的真实观察。' },
    { name: '日常方法', emoji: '🌿', percentage: 35, description: `用简单、可执行的方式认识${trackTerm}。` },
    { name: '陪伴答疑', emoji: '🤝', percentage: 25, description: '回应新手常见的顾虑，并一起找到下一步。' },
  ];
  return [...existing, ...defaults.filter((pillar) => !existing.some((item) => item.name === pillar.name))].slice(0, Math.max(3, existing.length));
}

function coachDefaulted(
  previous: BrandDNA,
  next: BrandDNA,
  key: BrandDnaFieldKey,
): boolean {
  const [section, field] = key.split('.') as [Exclude<keyof BrandDNA, 'meta'>, string];
  const before = previous[section] as unknown as Record<string, unknown>;
  const after = next[section] as unknown as Record<string, unknown>;
  return JSON.stringify(before[field]) !== JSON.stringify(after[field]);
}

/**
 * Completes the O2 funnel mapping without consuming private business-pack data.
 * Confirmed interview sentences retain ownership; only missing values receive
 * transparent coach defaults built from public terminology and neutral copy.
 */
export function fillForkedInterviewBrandDnaDefaults(
  dna: BrandDNA,
  state: ForkedInterviewState,
  pack: BusinessPack,
): BrandDNA {
  const track = generationTrackForState(state);
  const trackTerm = publicTrackTerm(pack, track, track === 'recruitment' ? '在家创业系统' : '健康管理方案');
  const direction = confirmed(state, 'business_direction');
  const change = confirmed(state, state.entryPath === 'B' ? 'change_reason' : 'product_change');
  const career = confirmed(state, 'past_career');
  const rhythm = confirmed(state, 'weekly_rhythm');
  const directionOption = getSelectedOption(FORKED_INTERVIEW_TOPICS.business_direction, state.topics.business_direction)?.label ?? '';
  const audienceFacts = state.topics.business_direction?.facts?.filter(Boolean) ?? [];
  const inferredAudience = audienceFacts.join('；') || direction || `正在了解${trackTerm}的新手`;
  const base = {
    identity: {
      ...dna.identity,
      brandName: dna.identity.brandName || '真实成长分享',
      personalName: dna.identity.personalName || '品牌主理人',
      slogan: dna.identity.slogan || '用真实经历，陪你找到适合自己的下一步',
    },
    audience: {
      ...dna.audience,
      targetAudience: dna.audience.targetAudience || inferredAudience,
      audiencePainPoints: dna.audience.audiencePainPoints.length > 0 ? dna.audience.audiencePainPoints : ['不知道如何从真实经历开始分享', '担心自己无法长期保持行动节奏'],
      audienceGoals: dna.audience.audienceGoals.length > 0 ? dna.audience.audienceGoals : ['找到适合自己的日常行动方式', `清楚了解${trackTerm}的下一步`],
      audienceObjections: dna.audience.audienceObjections.length > 0 ? dna.audience.audienceObjections : ['担心公开表达不够专业', '担心自己无法持续投入'],
    },
    messaging: {
      ...dna.messaging,
      elevatorPitch: dna.messaging.elevatorPitch || `我通过真实经历与简单行动建议，陪伴新手认识${trackTerm}并找到适合自己的下一步。`,
    },
    content: {
      ...dna.content,
      contentPillars: dna.content.contentPillars.length >= 3 ? dna.content.contentPillars : contentPillars(dna.content.contentPillars, trackTerm),
    },
    offer: {
      ...dna.offer,
      secondaryOffer: dna.offer.secondaryOffer || `围绕${trackTerm}的交流与行动陪伴`,
    },
    visual: {
      ...dna.visual,
      brandColors: dna.visual.brandColors.length >= 2 ? dna.visual.brandColors : ['#2563eb', '#1e40af', '#f59e0b'],
      profileImagePrompt: dna.visual.profileImagePrompt || '自然光下的真实生活肖像，温暖、可信、简洁，不出现品牌、产品或文字。',
      coverBannerPrompt: dna.visual.coverBannerPrompt || '明亮简洁的日常成长场景，留出标题空间，温暖可信，不出现品牌、产品或文字。',
    },
  } satisfies Omit<BrandDNA, 'meta'>;
  const nextWithoutProvenance: BrandDNA = {
    ...dna,
    ...base,
    meta: { ...dna.meta },
  };
  const provenance: Partial<Record<BrandDnaFieldKey, BrandDnaFieldProvenance>> = {
    ...dna.meta.fieldProvenance,
  };

  for (const key of FUNNEL_CONFIRMED_FIELDS) {
    provenance[key] = 'user_confirmed';
  }
  for (const key of [
    'identity.brandName', 'identity.personalName', 'identity.slogan',
    'audience.targetAudience', 'audience.audiencePainPoints', 'audience.audienceGoals', 'audience.audienceObjections',
    'messaging.elevatorPitch', 'content.contentPillars', 'offer.secondaryOffer',
    'visual.brandColors', 'visual.profileImagePrompt', 'visual.coverBannerPrompt',
  ] satisfies BrandDnaFieldKey[]) {
    if (!FUNNEL_CONFIRMED_FIELDS.includes(key) && coachDefaulted(dna, nextWithoutProvenance, key)) {
      provenance[key] = 'coach_defaulted';
    }
  }

  return {
    ...nextWithoutProvenance,
    meta: { ...nextWithoutProvenance.meta, fieldProvenance: provenance },
  };
}
