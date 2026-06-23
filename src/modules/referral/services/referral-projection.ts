import { localizationEngine, type LocalizedValue, type ProductLocale } from '@/modules/localization/services/LocalizationEngine';
import type { ReferralLevel, ReferralProjection, ReferralReward } from '../contracts/ReferralProjection';
import type { ReferralFacts } from './referral-facts';
import { customerSatisfactionSignals, missionConsistency, recentWinCount, referralConversionRate } from './referral-facts';
import { calculateReferralScore, referralReadinessFor } from './referral-score-engine';
import { detectReferralRisks, isAdvocacyReady } from './advocacy-detector';
import { detectReferralOpportunities, nextReferralMilestoneFor } from './referral-opportunity-engine';

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function localize(key: string, locale: ProductLocale) {
  return localizationEngine.t(key, locale);
}

function combineLocalization(locale: ProductLocale, values: LocalizedValue[]) {
  return {
    translationSource: values.some((value) => value.translationSource === 'missing')
      ? 'missing' as const
      : values.some((value) => value.translationSource === 'fallback')
        ? 'fallback' as const
        : 'registry' as const,
    fallbackUsed: values.some((value) => value.fallbackUsed),
    messageKeys: values.map((value) => value.key),
    locale,
  };
}

function referralLevelFor(facts: ReferralFacts, readiness: ReferralProjection['referralReadiness']): ReferralLevel {
  if (facts.activatedReferrals >= 8 || facts.successfulReferrals >= 5 || readiness === 'champion') return 'CHAMPION';
  if (facts.activatedReferrals >= 5 || facts.successfulReferrals >= 3 || readiness === 'ambassador') return 'AMBASSADOR';
  if (facts.activatedReferrals >= 1 || readiness === 'advocate') return 'ADVOCATE';
  if (readiness === 'ready') return 'READY';
  return 'NOT_READY';
}

function rewardsFor(level: ReferralLevel, locale: ProductLocale): ReferralReward[] {
  const rank = { NOT_READY: 0, READY: 1, ADVOCATE: 2, AMBASSADOR: 3, CHAMPION: 4 }[level];
  const rewards: Array<[ReferralReward['id'], string, number]> = [
    ['advocate_badge', 'referral.reward.advocate', 2],
    ['ambassador_badge', 'referral.reward.ambassador', 3],
    ['champion_badge', 'referral.reward.champion', 4],
    ['leaderboard', 'referral.reward.leaderboard', 4],
  ];

  return rewards.map(([id, key, requiredRank]) => ({
    id,
    type: 'recognition',
    label: localize(key, locale).value,
    earned: rank >= requiredRank,
  }));
}

export function buildReferralProjection(facts: ReferralFacts): ReferralProjection {
  const localeResolution = localizationEngine.resolveLocale({ userPreference: facts.locale });
  const locale = localeResolution.locale;
  const referralScore = calculateReferralScore(facts);
  const referralReadiness = referralReadinessFor(referralScore, facts);
  const referralOpportunities = detectReferralOpportunities(facts, referralReadiness);
  const referralRisks = detectReferralRisks(facts, referralReadiness);
  const referralRecommendation = referralOpportunities[0];
  const referralLevel = referralLevelFor(facts, referralReadiness);
  const successfulReferrals = Math.max(facts.activatedReferrals, facts.successfulReferrals);
  const pendingReferrals = typeof facts.pendingReferrals === 'number'
    ? Math.max(0, facts.pendingReferrals)
    : Math.max(0, facts.referralInvitesCreated - successfulReferrals);
  const levelLabel = localize(`referral.level.${referralLevel}`, locale);
  const opportunityLabel = localize(`referral.opportunity.${referralRecommendation.type}`, locale);
  const riskLabel = referralRisks[0] ? localize(`referral.risk.${referralRisks[0].riskCode}`, locale) : localize('referral.risk.none', locale);
  const localization = combineLocalization(locale, [levelLabel, opportunityLabel, riskLabel]);

  return {
    source: 'ReferralEngine',
    scope: 'user',
    confidence: referralScore > 0 ? 'derived' : 'fallback',
    fallback: referralScore > 0 ? 'none' : 'no_referral_readiness_signals',
    generatedAt: facts.generatedAt,
    businessMode: facts.businessMode,
    referralReadiness,
    referralScore,
    referralState: {
      referralReady: isAdvocacyReady(referralReadiness),
      referralLevel,
      referralLevelLabel: levelLabel.value,
      referralCount: facts.referralInvitesCreated,
      successfulReferrals,
      pendingReferrals,
      nextReferralOpportunity: referralRecommendation.type,
      nextReferralOpportunityLabel: opportunityLabel.value,
    },
    referralRecommendation: {
      ...referralRecommendation,
      title: opportunityLabel.value,
    },
    referralOpportunities,
    referralRisks,
    referralAttribution: facts.referralAttribution ?? [],
    referralRewards: rewardsFor(referralLevel, locale),
    nextReferralMilestone: nextReferralMilestoneFor(facts, referralReadiness, referralOpportunities[0] ?? null),
    signals: {
      valueRealizationScore: facts.valueProjection.valueRealizationScore,
      expansionScore: facts.expansionProjection.expansionScore,
      retentionScore: facts.retentionProjection.retentionScore,
      recentWins: recentWinCount(facts),
      missionCompletionConsistency: missionConsistency(facts),
      customerSatisfactionSignals: customerSatisfactionSignals(facts),
      referralInvitesCreated: facts.referralInvitesCreated,
      referralInvitesUsed: facts.referralInvitesUsed,
      referralLeads: facts.referralLeads,
      referredMembers: facts.referredMembers,
      activatedReferrals: facts.activatedReferrals,
      successfulReferrals,
      pendingReferrals,
    },
    kpis: {
      referralRate: facts.referralInvitesCreated > 0 || facts.referralLeads > 0 || facts.referredMembers > 0 ? 100 : 0,
      referralConversionRate: referralConversionRate(facts),
      advocateRate: isAdvocacyReady(referralReadiness) ? 100 : 0,
      referralReadyRate: isAdvocacyReady(referralReadiness) ? 100 : 0,
      referralParticipationRate: facts.referralInvitesCreated > 0 ? 100 : 0,
      successfulReferralRate: facts.referralInvitesCreated > 0 ? clamp((successfulReferrals / facts.referralInvitesCreated) * 100) : 0,
      activatedReferralRate: facts.referralInvitesCreated > 0 ? clamp((facts.activatedReferrals / facts.referralInvitesCreated) * 100) : 0,
    },
    localization: {
      ...localeResolution,
      translationSource: localization.translationSource,
      fallbackUsed: localeResolution.fallbackUsed || localization.fallbackUsed,
      messageKeys: localization.messageKeys,
    },
    personalization: {
      businessModel: facts.businessMode,
      audience: facts.personalization?.audience,
      offer: facts.personalization?.offer,
      stage: facts.personalization?.stage ?? facts.expansionProjection.expansionState.currentExpansionStage,
      region: facts.personalization?.region,
      locale,
    },
  };
}
