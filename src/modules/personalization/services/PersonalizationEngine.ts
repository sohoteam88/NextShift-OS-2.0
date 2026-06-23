import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { MissionPlan } from '@/modules/mission-engine/contracts/MissionAuthority';
import { interviewAuthorityService } from '@/modules/interview-authority/services/InterviewAuthorityService';
import type { AgentAssetType } from '@/modules/mission-workspace/services/MissionAgentAssistanceService';
import { businessStateService } from '@/modules/business-state/services/BusinessStateService';

export type PersonalizationProfile = {
  source: 'PersonalizationEngine';
  brandDNA: {
    identity: string;
    name: string;
    positioning: string;
    tone: string;
    story: string;
  };
  businessContext: {
    businessMode: string;
    stage: string;
    currentState?: string;
    readiness?: number;
    region: string;
    language: 'en' | 'zh' | 'ms';
  };
  audience: {
    primaryAudience: string;
    pains: string[];
    goals: string[];
    objections: string[];
  };
  offer: {
    primaryOffer: string;
    promise: string;
    revenueModel: string;
  };
  missionHistory: {
    currentMission: string;
    completedMissionTitles: string[];
  };
  outcomeHistory: {
    currentOutcome: string;
    completedOutcomeIds: string[];
  };
  assetHistory: {
    titles: string[];
    themes: string[];
    avoidTopics: string[];
  };
  internalScore: {
    relevance: number;
    uniqueness: number;
    contextMatch: number;
  };
  verificationBoundary: 'personalization_does_not_affect_completion';
};

type AssetContentInput = {
  profile: PersonalizationProfile;
  plan: MissionPlan;
  assetType: AgentAssetType;
  actionLabel: string;
};

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      const record = metadataRecord(item);
      return String(record.name ?? record.title ?? record.label ?? '').trim();
    })
    .filter(Boolean);
}

function normalizeLanguage(value?: string | null): PersonalizationProfile['businessContext']['language'] {
  if (value === 'en' || value === 'ms' || value === 'zh') return value;
  if (value?.toLowerCase().startsWith('ms')) return 'ms';
  if (value?.toLowerCase().startsWith('en')) return 'en';
  return 'zh';
}

function includesAny(text: string, terms: string[]) {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function marketTheme(profile: PersonalizationProfile) {
  const text = [
    profile.audience.primaryAudience,
    profile.offer.primaryOffer,
    profile.offer.promise,
    profile.brandDNA.positioning,
  ].join(' ');

  if (includesAny(text, ['weight', 'fat', 'slim', 'health', 'wellness', '减肥', '瘦', '健康'])) {
    return {
      market: 'weight_loss',
      leadMagnetTitle: '7 Hidden Habits Preventing Fat Loss',
      pain: profile.audience.pains[0] || 'they try hard but do not see visible body changes',
      promise: profile.offer.promise || 'build healthier habits without confusing plans',
    };
  }

  if (includesAny(text, ['business opportunity', 'network', 'recruit', 'entrepreneur', '创业', '事业机会'])) {
    return {
      market: 'business_opportunity',
      leadMagnetTitle: '7 Mistakes New Entrepreneurs Make Before Their First Lead',
      pain: profile.audience.pains[0] || 'they want leads but do not know what to offer first',
      promise: profile.offer.promise || 'turn attention into qualified conversations',
    };
  }

  return {
    market: 'general',
    leadMagnetTitle: `7 Practical Steps for ${profile.audience.primaryAudience || 'Your Audience'}`,
    pain: profile.audience.pains[0] || 'they need a clearer next step',
    promise: profile.offer.promise || profile.offer.primaryOffer || 'make progress with one focused action',
  };
}

function languageInstruction(language: PersonalizationProfile['businessContext']['language']) {
  if (language === 'en') return 'Write in English with direct, useful phrasing.';
  if (language === 'ms') return 'Write in Malay with clear, practical phrasing.';
  return 'Write in Chinese with clear, practical phrasing.';
}

function stageInstruction(profile: PersonalizationProfile) {
  const state = `${profile.businessContext.currentState ?? ''} ${profile.businessContext.stage}`.toUpperCase();

  if (includesAny(state, ['brand_foundation', 'foundation'])) {
    return 'Stage context: prioritize educational assets that clarify identity, audience, and first trust signals.';
  }

  if (includesAny(state, ['lead_generation', 'lead'])) {
    return 'Stage context: prioritize conversion assets that capture and qualify leads.';
  }

  if (includesAny(state, ['customers', 'customer', 'retention'])) {
    return 'Stage context: prioritize retention and customer success assets.';
  }

  return `Stage context: tailor the asset to ${profile.businessContext.stage || 'the current business stage'}.`;
}

function historyLine(profile: PersonalizationProfile) {
  if (profile.assetHistory.avoidTopics.length === 0) return 'Previous asset topics: none yet.';
  return `Avoid repeating these previous topics: ${profile.assetHistory.avoidTopics.slice(0, 3).join(', ')}.`;
}

export function buildPersonalizedAssetContent(input: AssetContentInput): string {
  const { profile, plan, assetType } = input;
  const theme = marketTheme(profile);
  const audience = profile.audience.primaryAudience || 'your target audience';
  const offer = profile.offer.primaryOffer || plan.objective;
  const tone = profile.brandDNA.tone || 'helpful and practical';
  const identity = profile.brandDNA.identity || 'business owner';
  const language = languageInstruction(profile.businessContext.language);
  const stage = stageInstruction(profile);
  const history = historyLine(profile);

  switch (assetType) {
    case 'CONTENT_ASSET':
      return [
        `Content Draft: ${plan.objective}`,
        '',
        `Audience: ${audience}`,
        `Offer: ${offer}`,
        `Tone: ${tone}`,
        language,
        stage,
        history,
        '',
        'Hook:',
        `If ${audience} are stuck because ${theme.pain}, this is the first practical step I would show them.`,
        '',
        'Body:',
        `As a ${identity}, connect the message to ${theme.promise}. Use one specific example from ${profile.brandDNA.story || 'the customer journey'} and invite the reader to take a simple next step.`,
        '',
        'CTA:',
        `Reply with the one result you want from ${offer}, and I will suggest the next action.`,
      ].join('\n');
    case 'LEAD_MAGNET_ASSET':
      return [
        `Lead Magnet Draft: ${theme.leadMagnetTitle}`,
        '',
        `Created for: ${audience}`,
        `Offer: ${offer}`,
        `Brand angle: ${profile.brandDNA.positioning || profile.brandDNA.name || identity}`,
        language,
        stage,
        history,
        '',
        'Promise:',
        theme.promise,
        '',
        'Sections:',
        `1. Why ${audience} get stuck`,
        `2. The hidden cost of ${theme.pain}`,
        `3. A simple checklist for ${offer}`,
        '4. The first action to take today',
        '5. What to track next',
        '',
        'CTA:',
        `Use this checklist, then take the next step toward ${plan.nextMilestone}.`,
      ].join('\n');
    case 'FUNNEL_ASSET':
      return [
        `Funnel Draft: ${offer}`,
        '',
        `Audience: ${audience}`,
        `Market theme: ${theme.market}`,
        language,
        stage,
        history,
        '',
        'Landing Page Sections:',
        `1. Headline: ${theme.promise}`,
        `2. Problem: ${theme.pain}`,
        `3. Offer: ${theme.leadMagnetTitle}`,
        `4. Trust angle: ${profile.brandDNA.positioning || profile.brandDNA.story || identity}`,
        '5. CTA: Get the guide',
        '',
        'Thank You Page:',
        `Confirm delivery and invite ${audience} to reply with their biggest blocker.`,
        '',
        'Lead Flow:',
        'Opt-in -> delivery message -> personalized follow-up -> CRM note -> next mission signal.',
      ].join('\n');
    case 'TRAFFIC_ASSET':
      return [
        `Traffic Plan: ${plan.objective}`,
        '',
        `Audience: ${audience}`,
        `Offer: ${offer}`,
        language,
        stage,
        history,
        '',
        'Angles:',
        `1. Stop struggling with ${theme.pain}`,
        `2. A practical way to get ${theme.promise}`,
        `3. Why ${audience} need this now`,
        '',
        'Channels:',
        profile.audience.goals.length > 0
          ? profile.audience.goals.map((goal, index) => `${index + 1}. Content around ${goal}`).join('\n')
          : '1. Facebook groups\n2. LinkedIn posts\n3. Short educational videos',
      ].join('\n');
    case 'CRM_ASSET':
      return [
        `CRM Follow-Up: ${offer}`,
        '',
        `Audience: ${audience}`,
        `Lead source context: ${plan.objective}`,
        language,
        stage,
        history,
        '',
        'Follow-Up Sequence:',
        `Day 0: Deliver ${theme.leadMagnetTitle} and ask what feels most urgent.`,
        `Day 2: Share one tip for ${theme.pain}.`,
        `Day 5: Invite them to explore ${offer}.`,
        '',
        'Segmentation:',
        `Tag by audience goal: ${profile.audience.goals[0] || 'primary desired outcome'}.`,
      ].join('\n');
    case 'OFFER_ASSET':
      return [
        `Offer Draft: ${offer}`,
        '',
        `Audience: ${audience}`,
        `Positioning: ${profile.brandDNA.positioning || identity}`,
        language,
        stage,
        history,
        '',
        'Offer Promise:',
        theme.promise,
        '',
        'Objections To Address:',
        profile.audience.objections.length > 0
          ? profile.audience.objections.map((objection, index) => `${index + 1}. ${objection}`).join('\n')
          : '1. I do not know if this fits me\n2. I do not have time\n3. I have tried before',
      ].join('\n');
    default:
      return [
        `Draft Asset: ${plan.objective}`,
        '',
        `Audience: ${audience}`,
        `Offer: ${offer}`,
        language,
        stage,
        history,
      ].join('\n');
  }
}

function assetThemesFromTitle(title: string) {
  return title
    .replace(/^(Lead Magnet Draft|Content Draft|Funnel Draft|CRM Follow-Up|Offer Draft):\s*/i, '')
    .split(/[:|-]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);
}

async function readAssetHistory(input: { userId: string; tenantId: string }) {
  const [auditRows, contentRows] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        tenantId: input.tenantId,
        actorId: input.userId,
        action: { in: ['agent.asset.generated', 'agent.asset.updated', 'agent.asset.approved'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { metadata: true },
    }),
    prisma.content.findMany({
      where: { tenantId: input.tenantId, ownerId: input.userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { title: true, body: true },
    }),
  ]);

  const auditTitles = auditRows.flatMap((row) => {
    const asset = metadataRecord(metadataRecord(row.metadata).generatedAsset);
    const title = asset.title;
    return typeof title === 'string' && title.trim() ? [title.trim()] : [];
  });
  const contentTitles = contentRows.flatMap((row) => row.title?.trim() ? [row.title.trim()] : []);
  const titles = [...auditTitles, ...contentTitles].slice(0, 10);
  const themes = titles.flatMap(assetThemesFromTitle);

  return {
    titles,
    themes,
    avoidTopics: themes.slice(0, 5),
  };
}

export async function buildPersonalizationProfile(input: {
  user: AuthUser;
  plan: MissionPlan;
  currentOutcome?: string;
}): Promise<PersonalizationProfile> {
  const [authority, userRecord, assetHistory, completedMissions, completedOutcomes] = await Promise.all([
    interviewAuthorityService.getInterviewAuthority(input.user.id),
    prisma.user.findUnique({
      where: { id: input.user.id },
      select: { languagePreference: true, metadata: true },
    }),
    readAssetHistory({ userId: input.user.id, tenantId: input.user.tenantId }).catch(() => ({ titles: [], themes: [], avoidTopics: [] })),
    prisma.auditLog.findMany({
      where: {
        tenantId: input.user.tenantId,
        actorId: input.user.id,
        action: 'mission.decision.projected',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { metadata: true },
    }).catch(() => []),
    prisma.auditLog.findMany({
      where: {
        tenantId: input.user.tenantId,
        actorId: input.user.id,
        action: 'outcome.completed',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { targetId: true },
    }).catch(() => []),
  ]);
  const businessState = await businessStateService.getBusinessState(input.user.id).catch(() => null);
  const metadata = metadataRecord(userRecord?.metadata);
  const region = typeof metadata.region === 'string' ? metadata.region : 'Malaysia';
  const language = normalizeLanguage(input.user.preferredLanguage ?? userRecord?.languagePreference);
  const brandDNA = {
    identity: authority.profile.professionalRole || 'business owner',
    name: authority.profile.fullName || input.user.name || '',
    positioning: authority.profile.missionStatement || '',
    tone: stringArray(metadata.tone)[0] || 'practical, warm, and direct',
    story: authority.profile.personalStory || '',
  };
  const businessContext = {
    businessMode: authority.businessContext.businessMode,
    stage: businessState?.stage ?? authority.businessContext.businessStage,
    currentState: businessState?.stateResult.currentState,
    readiness: businessState?.readiness.percentage,
    region,
    language,
  };
  const audience = {
    primaryAudience: authority.audience.primaryAudience || 'new prospects',
    pains: authority.audience.audienceProblems,
    goals: authority.audience.audienceGoals,
    objections: authority.audience.audienceObjections,
  };
  const offer = {
    primaryOffer: authority.businessContext.primaryOffer || input.plan.objective,
    promise: authority.profile.missionStatement || authority.businessContext.primaryOffer || '',
    revenueModel: authority.businessContext.revenueModel || '',
  };
  const completedMissionTitles = completedMissions.flatMap((row) => {
    const metadataRecordValue = metadataRecord(row.metadata);
    const title = metadataRecordValue.missionTitle ?? metadataRecordValue.priorityAction;
    return typeof title === 'string' && title.trim() ? [title.trim()] : [];
  });

  return {
    source: 'PersonalizationEngine',
    brandDNA,
    businessContext,
    audience,
    offer,
    missionHistory: {
      currentMission: input.plan.objective,
      completedMissionTitles,
    },
    outcomeHistory: {
      currentOutcome: input.currentOutcome ?? input.plan.nextMilestone,
      completedOutcomeIds: completedOutcomes.flatMap((row) => row.targetId ? [row.targetId] : []),
    },
    assetHistory,
    internalScore: {
      relevance: audience.primaryAudience && offer.primaryOffer ? 90 : 55,
      uniqueness: assetHistory.avoidTopics.length > 0 ? 85 : 70,
      contextMatch: brandDNA.positioning || brandDNA.story ? 90 : 60,
    },
    verificationBoundary: 'personalization_does_not_affect_completion',
  };
}

export const personalizationEngine = {
  buildProfile: buildPersonalizationProfile,
  buildAssetContent: buildPersonalizedAssetContent,
};
