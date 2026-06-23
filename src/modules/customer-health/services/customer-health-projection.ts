import { localizationEngine, type LocalizedValue, type ProductLocale } from '@/modules/localization/services/LocalizationEngine';
import type { CustomerHealthProjection, HealthDriver, HealthInterventionAction, HealthLevel, RiskFactor } from '../contracts/CustomerHealthProjection';
import type { CustomerHealthFacts } from './customer-health-facts';

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

function healthLevelFor(score: number, facts: CustomerHealthFacts): HealthLevel {
  if (
    facts.userSuccessProjection.successState.successLevel === 'BLOCKED'
    || facts.retentionProjection.outcomeRetention?.retentionLevel === 'STALLED'
    || facts.expansionProjection.expansionRecovery?.riskCode === 'STALLED_GROWTH'
  ) return 'CRITICAL';
  if (
    score < 45
    || facts.activationProjection.activationRisk === 'high'
    || facts.activationProjection.activationRisk === 'critical'
    || facts.retentionProjection.retentionRisk === 'high'
    || facts.retentionProjection.retentionRisk === 'critical'
    || Boolean(facts.expansionProjection.expansionRecovery?.needed)
  ) return 'AT_RISK';
  if (
    score >= 85
    && Boolean(facts.expansionProjection.expansionState?.expanding)
    && (facts.referralProjection.referralState?.successfulReferrals ?? 0) > 0
  ) return 'THRIVING';
  if (score >= 70 && (facts.retentionProjection.outcomeRetention?.retained ?? facts.retentionProjection.retentionRisk === 'low')) return 'HEALTHY';
  return 'STABLE';
}

function driversFor(facts: CustomerHealthFacts, locale: ProductLocale): HealthDriver[] {
  const drivers: HealthDriver[] = [];
  if (facts.retentionProjection.momentum?.outcomeVelocity30d && facts.retentionProjection.momentum.outcomeVelocity30d > 0) {
    drivers.push({
      type: 'outcome_velocity',
      title: localize('health.driver.outcomeVelocity', locale).value,
      reason: facts.retentionProjection.currentMomentum,
      impact: 'high',
    });
  }
  const missionSignal = facts.retentionProjection.signals?.missionCompletionFrequency;
  if (missionSignal && missionSignal.value >= missionSignal.target) {
    drivers.push({
      type: 'mission_completion_consistency',
      title: localize('health.driver.missionConsistency', locale).value,
      reason: 'Mission completion consistency is meeting the target.',
      impact: 'medium',
    });
  }
  if (facts.retentionProjection.outcomeRetention?.retained ?? facts.retentionProjection.retentionRisk === 'low') {
    drivers.push({
      type: 'retention_progress',
      title: localize('health.driver.retentionProgress', locale).value,
      reason: facts.retentionProjection.outcomeRetention?.retentionLevelLabel ?? facts.retentionProjection.retentionState,
      impact: 'high',
    });
  }
  if ((facts.expansionProjection.expansionState?.expansionProgress ?? facts.expansionProjection.expansionScore) >= 50) {
    drivers.push({
      type: 'expansion_progress',
      title: localize('health.driver.expansionProgress', locale).value,
      reason: facts.expansionProjection.expansionState?.expansionLevelLabel ?? facts.expansionProjection.expansionStage,
      impact: facts.expansionProjection.expansionState?.expanding ? 'high' : 'medium',
    });
  }
  if ((facts.referralProjection.referralState?.successfulReferrals ?? facts.referralProjection.signals?.activatedReferrals ?? 0) > 0) {
    drivers.push({
      type: 'referral_success',
      title: localize('health.driver.referralSuccess', locale).value,
      reason: `${facts.referralProjection.referralState?.successfulReferrals ?? facts.referralProjection.signals?.activatedReferrals ?? 0} activated referral(s).`,
      impact: 'high',
    });
  }
  return drivers.slice(0, 5);
}

function risksFor(facts: CustomerHealthFacts, locale: ProductLocale): RiskFactor[] {
  const risks: RiskFactor[] = [];
  const daysSinceOutcome = facts.retentionProjection.momentum?.daysSinceLastOutcome;
  if (typeof daysSinceOutcome === 'number' && daysSinceOutcome >= 14) {
    risks.push({
      type: 'no_outcome_progress',
      title: localize('health.risk.noOutcomeProgress', locale).value,
      reason: `No outcome progress for ${daysSinceOutcome} days.`,
      severity: daysSinceOutcome >= 30 ? 'critical' : 'high',
      route: facts.retentionProjection.retentionRecovery?.route ?? '/mission',
    });
  }
  if (facts.userSuccessProjection.successState.successLevel === 'AT_RISK' || facts.userSuccessProjection.successState.successLevel === 'BLOCKED') {
    const blocker = facts.userSuccessProjection.blockers[0];
    risks.push({
      type: 'success_dropping',
      title: localize('health.risk.successDropping', locale).value,
      reason: blocker?.reason ?? `${facts.userSuccessProjection.currentOutcome.label} is not achieved yet.`,
      severity: facts.userSuccessProjection.successState.successLevel === 'BLOCKED' ? 'critical' : 'high',
      route: blocker?.route ?? '/mission',
    });
  }
  if (Boolean(facts.retentionProjection.retentionRecovery?.needed) || facts.retentionProjection.retentionRisk !== 'low') {
    risks.push({
      type: 'retention_declining',
      title: localize('health.risk.retentionDeclining', locale).value,
      reason: facts.retentionProjection.retentionRecovery?.reason ?? facts.retentionProjection.reEngagement?.reason ?? 'Retention signal is declining.',
      severity: facts.retentionProjection.retentionRisk === 'critical' ? 'critical' : 'high',
      route: facts.retentionProjection.retentionRecovery?.route ?? facts.retentionProjection.reEngagement?.route ?? '/dashboard',
    });
  }
  if (Boolean(facts.expansionProjection.expansionRecovery?.needed)) {
    risks.push({
      type: 'expansion_plateau',
      title: localize('health.risk.expansionPlateau', locale).value,
      reason: facts.expansionProjection.expansionRecovery?.reason ?? 'Expansion progress is stalled.',
      severity: facts.expansionProjection.expansionRecovery?.riskCode === 'STALLED_GROWTH' ? 'critical' : 'high',
      route: facts.expansionProjection.expansionRecovery?.route ?? '/mission',
    });
  }
  if ((facts.retentionProjection.momentum?.missionsCompleted ?? 0) === 0) {
    risks.push({
      type: 'no_mission_activity',
      title: localize('health.risk.noMissionActivity', locale).value,
      reason: 'No mission completion signal exists in the current health window.',
      severity: 'medium',
      route: '/journey',
    });
  }
  if ((facts.retentionProjection.momentum?.assetUtilizationCount ?? 0) === 0) {
    risks.push({
      type: 'low_asset_utilization',
      title: localize('health.risk.lowAssetUtilization', locale).value,
      reason: 'Generated or approved assets are not being used enough to support outcomes.',
      severity: 'medium',
      route: '/content-engine',
    });
  }
  if (facts.referralProjection.referralRisks[0]) {
    const referralRisk = facts.referralProjection.referralRisks[0];
    risks.push({
      type: 'referral_blocked',
      title: referralRisk.title,
      reason: referralRisk.reason,
      severity: referralRisk.priority === 'critical' ? 'critical' : referralRisk.priority === 'high' ? 'high' : 'medium',
      route: referralRisk.route,
    });
  }
  return risks.slice(0, 5);
}

function actionFor(level: HealthLevel, risks: RiskFactor[], locale: ProductLocale): CustomerHealthProjection['recommendedAction'] {
  if (level === 'HEALTHY' || level === 'THRIVING') {
    return {
      action: 'none',
      title: localize('health.action.none', locale).value,
      reason: 'Customer health does not require intervention.',
      route: '/dashboard',
    };
  }
  const primaryRisk = risks[0];
  let action: HealthInterventionAction = 'recovery_recommendation';
  if (level === 'CRITICAL') action = 'priority_escalation';
  if (primaryRisk?.type === 'no_outcome_progress' || primaryRisk?.type === 'success_dropping') action = 'outcome_recovery_mission';
  if (primaryRisk?.type === 'expansion_plateau') action = 'expansion_recovery_mission';
  if (primaryRisk?.type === 'retention_declining') action = 'retention_recovery_mission';
  if (primaryRisk?.type === 'referral_blocked') action = 'referral_recovery_mission';

  return {
    action,
    title: localize(`health.action.${action}`, locale).value,
    reason: primaryRisk?.reason ?? 'Health score dropped below the healthy range.',
    route: primaryRisk?.route ?? '/journey',
  };
}

function trendFor(score: number, previousHealthScore?: number | null): CustomerHealthProjection['healthTrend'] {
  if (typeof previousHealthScore !== 'number') {
    return { direction: 'STABLE', windowDays: 30, reason: 'No previous health score exists for comparison.' };
  }
  const delta = score - previousHealthScore;
  if (delta >= 5) return { direction: 'UP', windowDays: 30, reason: `Health score improved by ${delta} points.` };
  if (delta <= -5) return { direction: 'DOWN', windowDays: 30, reason: `Health score dropped by ${Math.abs(delta)} points.` };
  return { direction: 'STABLE', windowDays: 30, reason: 'Health score is stable in the 30 day window.' };
}

export function buildCustomerHealthProjection(facts: CustomerHealthFacts): CustomerHealthProjection {
  const localeResolution = localizationEngine.resolveLocale({ userPreference: facts.locale });
  const locale = localeResolution.locale;
  const componentScores = {
    activation: clamp(facts.activationProjection.activationScore),
    success: clamp(facts.userSuccessProjection.successScore),
    retention: clamp(facts.retentionProjection.retentionScore),
    expansion: clamp(facts.expansionProjection.expansionScore),
    referral: clamp(facts.referralProjection.referralScore),
  };
  const healthScore = clamp(
    componentScores.activation * 0.15
    + componentScores.success * 0.25
    + componentScores.retention * 0.25
    + componentScores.expansion * 0.2
    + componentScores.referral * 0.15,
  );
  const healthLevel = healthLevelFor(healthScore, facts);
  const healthLevelLabel = localize(`health.level.${healthLevel}`, locale);
  const drivers = driversFor(facts, locale);
  const risks = risksFor(facts, locale);
  const recommendedAction = actionFor(healthLevel, risks, locale);
  const actionLabel = localize(`health.action.${recommendedAction.action}`, locale);
  const localization = combineLocalization(locale, [healthLevelLabel, actionLabel]);

  return {
    source: 'CustomerHealthEngine',
    scope: 'user',
    confidence: 'derived',
    fallback: 'none',
    generatedAt: facts.generatedAt,
    customerHealth: {
      healthLevel,
      healthLevelLabel: healthLevelLabel.value,
      healthScore,
      healthDrivers: drivers,
      riskFactors: risks,
      interventionRequired: healthLevel === 'CRITICAL' || healthLevel === 'AT_RISK',
    },
    healthTrend: trendFor(healthScore, facts.previousHealthScore),
    recommendedAction,
    componentScores,
    kpis: {
      healthyUserRate: ['HEALTHY', 'THRIVING'].includes(healthLevel) ? 100 : 0,
      thrivingUserRate: healthLevel === 'THRIVING' ? 100 : 0,
      atRiskRecoveryRate: healthLevel === 'STABLE' && risks.length === 0 ? 100 : 0,
      churnPreventionRate: healthLevel === 'AT_RISK' || healthLevel === 'CRITICAL' ? 100 : 0,
    },
    localization: {
      ...localeResolution,
      translationSource: localization.translationSource,
      fallbackUsed: localeResolution.fallbackUsed || localization.fallbackUsed,
      messageKeys: localization.messageKeys,
    },
    personalization: {
      audience: facts.personalization?.audience,
      offer: facts.personalization?.offer,
      businessModel: facts.personalization?.businessModel,
      stage: facts.personalization?.stage ?? facts.expansionProjection.expansionState?.currentExpansionStage,
      locale,
    },
  };
}
