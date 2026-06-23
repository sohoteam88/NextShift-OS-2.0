import { localizationEngine, type LocalizedValue, type ProductLocale } from '@/modules/localization/services/LocalizationEngine';
import type { ExpansionCelebration, ExpansionLevel, ExpansionOpportunityId, ExpansionProjection, ExpansionRecovery } from '../contracts/ExpansionProjection';
import type { ExpansionFacts } from './expansion-facts';
import { hasPositiveExpansion } from './expansion-facts';
import { calculateExpansionScore, expansionStageFor } from './expansion-score-engine';
import { detectExpansionOpportunities, detectExpansionRisks, nextMilestoneFor, recoveryActionForRisk, selectCurrentGrowthLever } from './growth-lever-engine';
import { calculateScaleReadiness } from './scale-readiness-engine';

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

function inferredOutcomeCount(facts: ExpansionFacts) {
  if (typeof facts.outcomeCount === 'number') return Math.max(0, Math.round(facts.outcomeCount));

  let count = 0;
  if (facts.metrics.customers.current > 0 || facts.metrics.customers.previous > 0) count += 1;
  if (facts.metrics.revenue.current > 0 || facts.metrics.revenue.previous > 0) count += 1;
  if (facts.retentionProjection.outcomeRetention?.retained) count += 1;
  if (facts.metrics.team.current > 0 || facts.metrics.team.previous > 0) count += 1;
  if (facts.metrics.audience.current >= 5000 && facts.metrics.content.current >= 12) count += 1;
  return count;
}

function expansionLevelFor(facts: ExpansionFacts, score: number): ExpansionLevel {
  const outcomeCount = inferredOutcomeCount(facts);
  if (facts.metrics.audience.current >= 5000 && facts.metrics.content.current >= 12) return 'AUTHORITY';
  if ((facts.metrics.team.current > 0 || outcomeCount >= 4) && facts.metrics.revenue.current > 0) return 'LEADING';
  if (outcomeCount >= 4 && (score >= 85 || facts.metrics.revenue.growthRate >= 30)) return 'OPTIMIZING';
  if (score >= 70 || facts.retentionProjection.outcomeRetention?.retained || facts.metrics.revenue.current > 0) return 'SCALING';
  if (score >= 55 || outcomeCount >= 2 || facts.metrics.customers.current > 0) return 'GROWING';
  return 'EMERGING';
}

function opportunityProgress(facts: ExpansionFacts, score: number, level: ExpansionLevel) {
  const growthSignals = Object.values(facts.metrics).filter((metric) => metric.current > 0 && metric.growthRate > 0).length;
  const outcomeCount = inferredOutcomeCount(facts);
  const levelBase = {
    EMERGING: 10,
    GROWING: 30,
    SCALING: 50,
    OPTIMIZING: 70,
    LEADING: 82,
    AUTHORITY: 92,
  }[level];

  return clamp(levelBase + Math.min(12, growthSignals * 2) + Math.min(10, outcomeCount * 2) + Math.min(8, score * 0.08));
}

function recoveryFor(projection: Pick<ExpansionProjection, 'expansionRisks' | 'expansionOpportunity'>, locale: ProductLocale): ExpansionRecovery {
  const risk = projection.expansionRisks[0];
  const action = recoveryActionForRisk(risk);
  const title = localize(`expansion.recovery.${action}`, locale);
  const reason = localize(
    risk?.riskCode === 'PLATEAU'
      ? 'expansion.recovery.reason.plateau'
      : risk?.riskCode === 'STALLED_GROWTH'
        ? 'expansion.recovery.reason.stalledGrowth'
        : risk?.riskCode === 'SCALING_BLOCKED'
          ? 'expansion.recovery.reason.scalingBlocked'
          : 'expansion.recovery.reason.next',
    locale,
  );

  return {
    needed: Boolean(risk && ['PLATEAU', 'STALLED_GROWTH', 'SCALING_BLOCKED', 'LEVER_DECLINING'].includes(risk.riskCode)),
    riskCode: risk?.riskCode ?? 'none',
    action,
    title: title.value,
    reason: reason.value,
    route: risk?.route ?? projection.expansionOpportunity.route,
  };
}

function celebrationsFor(facts: ExpansionFacts, locale: ProductLocale): ExpansionCelebration[] {
  const generatedAt = facts.generatedAt;
  const celebrations: Array<[boolean, string, string]> = [
    [facts.metrics.revenue.current > 0 || facts.metrics.revenue.previous > 0, 'first_revenue', 'expansion.celebration.firstRevenue'],
    [facts.retentionProjection.outcomeRetention?.retained ?? false, 'retention_system', 'expansion.celebration.retentionSystem'],
    [facts.metrics.team.current > 0 || facts.metrics.team.previous > 0, 'first_team_member', 'expansion.celebration.firstTeamMember'],
    [facts.metrics.audience.current >= 1000 || facts.metrics.content.current >= 8, 'authority_milestone', 'expansion.celebration.authorityMilestone'],
  ];

  return celebrations
    .filter(([enabled]) => enabled)
    .map(([, id, key]) => ({
      id,
      title: localize(key, locale).value,
      occurredAt: generatedAt,
    }));
}

export function buildExpansionProjection(facts: ExpansionFacts): ExpansionProjection {
  const localeResolution = localizationEngine.resolveLocale({ userPreference: facts.locale });
  const locale = localeResolution.locale;
  const expansionScore = calculateExpansionScore(facts);
  const expansionStage = expansionStageFor(expansionScore, facts);
  const expansionOpportunities = detectExpansionOpportunities(facts);
  const expansionRisks = detectExpansionRisks(facts);
  const currentGrowthLever = selectCurrentGrowthLever(facts, expansionOpportunities);
  const scaleReadiness = calculateScaleReadiness(facts);
  const expansionOpportunity = expansionOpportunities[0];
  const expansionLevel = expansionLevelFor(facts, expansionScore);
  const levelLabel = localize(`expansion.level.${expansionLevel}`, locale);
  const opportunityLabel = localize(`expansion.opportunity.${expansionOpportunity.opportunity}`, locale);
  const recovery = recoveryFor({ expansionRisks, expansionOpportunity }, locale);
  const recoveryTitle = localize(`expansion.recovery.${recovery.action}`, locale);
  const recoveryReason = localize(
    recovery.riskCode === 'PLATEAU'
      ? 'expansion.recovery.reason.plateau'
      : recovery.riskCode === 'STALLED_GROWTH'
        ? 'expansion.recovery.reason.stalledGrowth'
        : recovery.riskCode === 'SCALING_BLOCKED'
          ? 'expansion.recovery.reason.scalingBlocked'
          : 'expansion.recovery.reason.next',
    locale,
  );
  const localization = combineLocalization(locale, [levelLabel, opportunityLabel, recoveryTitle, recoveryReason]);
  const outcomeCount = inferredOutcomeCount(facts);
  const expanding = outcomeCount >= 3 && hasPositiveExpansion(facts.metrics) && !recovery.needed;
  const expansionProgress = opportunityProgress(facts, expansionScore, expansionLevel);

  return {
    source: 'ExpansionEngine',
    scope: 'user',
    confidence: hasPositiveExpansion(facts.metrics) ? 'derived' : 'fallback',
    fallback: hasPositiveExpansion(facts.metrics) ? 'none' : 'no_expansion_growth_detected',
    generatedAt: facts.generatedAt,
    businessMode: facts.businessMode,
    expansionScore,
    expansionStage,
    expansionState: {
      currentExpansionStage: expansionStage,
      expansionLevel,
      expansionLevelLabel: levelLabel.value,
      expansionProgress,
      nextExpansionOpportunity: expansionOpportunity.opportunity,
      nextExpansionOpportunityLabel: opportunityLabel.value,
      expanding,
    },
    currentGrowthLever,
    scaleReadiness,
    expansionOpportunity: {
      ...expansionOpportunity,
      title: opportunityLabel.value,
    },
    expansionOpportunities,
    expansionRisks,
    expansionRecovery: recovery,
    expansionCelebrations: celebrationsFor(facts, locale),
    nextGrowthMilestone: nextMilestoneFor(facts, currentGrowthLever.lever),
    metrics: facts.metrics,
    kpis: {
      leadGrowthRate: facts.metrics.leads.growthRate,
      revenueGrowthRate: facts.metrics.revenue.growthRate,
      customerGrowthRate: facts.metrics.customers.growthRate,
      teamGrowthRate: facts.metrics.team.growthRate,
      expansionSuccessRate: expansionScore,
      expansionRate: expanding ? 100 : expansionProgress,
      outcomeProgressionRate: clamp(outcomeCount * 20),
      expansionOpportunityAdoption: clamp(facts.opportunityAdoptionRate ?? expansionProgress),
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
      stage: facts.personalization?.stage ?? expansionStage,
      region: facts.personalization?.region,
      locale,
    },
  };
}
