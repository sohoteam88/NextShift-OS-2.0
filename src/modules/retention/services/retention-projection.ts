import type {
  MomentumWin,
  OutcomeRetentionLevel,
  OutcomeRetentionState,
  RetentionProjection,
  RetentionSignal,
} from '../contracts/RetentionProjection';
import type { OutcomeTemplateId } from '@/modules/mission-engine/services/OutcomeOrchestrator';
import { localizationEngine, type LocalizedValue, type ProductLocale } from '@/modules/localization/services/LocalizationEngine';
import { inactivityFlagFor, outcomeDaysInactive, outcomeRetentionRiskFor, retentionRiskFor, retentionStateFor } from './engagement-detector';
import { calculateMomentumScore, currentStreakFromActiveDays } from './momentum-engine';
import {
  calculateRetentionScore,
  daysInactive,
  executionConsistency,
  missionCompletionRate,
  type RetentionFacts,
} from './retention-score-engine';

function signal(key: string, label: string, value: number, target: number, unit: RetentionSignal['unit']): RetentionSignal {
  return { key, label, value, target, unit };
}

const NEXT_OUTCOME: Record<OutcomeTemplateId, OutcomeTemplateId> = {
  FIRST_LEAD: 'FIRST_CUSTOMER',
  FIRST_CUSTOMER: 'FIRST_REVENUE',
  FIRST_REVENUE: 'RETENTION_SYSTEM',
  RETENTION_SYSTEM: 'TEAM_SCALING',
  TEAM_SCALING: 'AUTHORITY_BUILDING',
  AUTHORITY_BUILDING: 'FIRST_LEAD',
};

function localize(key: string, locale: ProductLocale) {
  return localizationEngine.t(key, locale);
}

function combineLocalization(values: LocalizedValue[]) {
  return {
    translationSource: values.some((value) => value.translationSource === 'missing')
      ? 'missing' as const
      : values.some((value) => value.translationSource === 'fallback')
        ? 'fallback' as const
        : 'registry' as const,
    fallbackUsed: values.some((value) => value.fallbackUsed),
    messageKeys: values.map((value) => value.key),
  };
}

function outcomeLabel(outcome: OutcomeTemplateId, locale: ProductLocale) {
  return localize(`success.outcome.${outcome}`, locale);
}

function nextOutcomeFor(input: {
  currentOutcome?: OutcomeTemplateId;
  outcomeCompletionCount: number;
}): OutcomeTemplateId {
  if (input.currentOutcome) return NEXT_OUTCOME[input.currentOutcome];
  if (input.outcomeCompletionCount >= 3) return 'RETENTION_SYSTEM';
  if (input.outcomeCompletionCount >= 2) return 'FIRST_REVENUE';
  if (input.outcomeCompletionCount >= 1) return 'FIRST_CUSTOMER';
  return 'FIRST_LEAD';
}

function retentionLevelFor(input: {
  facts: RetentionFacts & { recentWins: MomentumWin[] };
  momentumScore: number;
  risk: RetentionProjection['retentionRisk'];
}): OutcomeRetentionLevel {
  const outcomeCount = input.facts.outcomeCompletionCount ?? 0;
  const progress = input.facts.currentOutcomeProgressPercentage ?? 0;
  const daysSinceOutcome = outcomeDaysInactive(input.facts);

  if (outcomeCount >= 4 && input.momentumScore >= 75) return 'EXPANDING';
  if (outcomeCount >= 2 && input.risk === 'low') return 'RETAINED';
  if (daysSinceOutcome !== null && daysSinceOutcome >= 30) return 'STALLED';
  if (daysSinceOutcome !== null && daysSinceOutcome >= 14) return 'AT_RISK';
  if (outcomeCount >= 2) return 'RETAINED';
  if (input.momentumScore >= 65 && progress > 0) return 'MOMENTUM';
  if (outcomeCount === 1 && progress > 0) return 'ACTIVE_PROGRESS';
  if (outcomeCount === 1) return 'NEW_SUCCESS';
  if (progress > 0) return 'ACTIVE_PROGRESS';
  return 'AT_RISK';
}

function stageFor(level: OutcomeRetentionLevel): OutcomeRetentionState['currentStage'] {
  if (level === 'EXPANDING') return 'EXPANDING';
  if (level === 'RETAINED') return 'RETAINED';
  if (level === 'NEW_SUCCESS') return 'SUCCESSFUL';
  return 'ACTIVATED';
}

function outcomeProgressPercentage(input: {
  outcomeCompletionCount: number;
  currentOutcomeProgressPercentage: number;
  level: OutcomeRetentionLevel;
}) {
  if (input.level === 'EXPANDING') return 100;
  if (input.level === 'RETAINED') return 100;
  const completedProgress = Math.min(input.outcomeCompletionCount, 2) * 35;
  return Math.max(0, Math.min(100, Math.round(completedProgress + input.currentOutcomeProgressPercentage * 0.3)));
}

function recoveryFor(input: {
  level: OutcomeRetentionLevel;
  risk: RetentionProjection['retentionRisk'];
  nextOutcome: OutcomeTemplateId;
  locale: ProductLocale;
}) {
  const atRisk = input.level === 'AT_RISK';
  const stalled = input.level === 'STALLED';
  const needed = atRisk || stalled || input.risk !== 'low';
  const action = stalled
    ? 'generate_recovery_mission' as const
    : atRisk
      ? 'send_progress_reminder' as const
      : 'recommend_next_outcome' as const;
  const titleKey = stalled
    ? 'retention.recovery.recoveryMission'
    : atRisk
      ? 'retention.recovery.progressReminder'
      : 'retention.recovery.nextOutcome';
  const reasonKey = stalled
    ? 'retention.recovery.reason.stalled'
    : atRisk
      ? 'retention.recovery.reason.atRisk'
      : 'retention.recovery.reason.next';
  const title = localize(titleKey, input.locale);
  const reason = localize(reasonKey, input.locale);

  return {
    recovery: {
      needed,
      action,
      title: title.value,
      reason: reason.value,
      route: stalled ? '/dashboard' : '/mission',
    },
    localizedValues: [title, reason],
  };
}

function localizedMomentum(score: number, recentWins: MomentumWin[], locale: ProductLocale) {
  const key = score >= 75
    ? 'retention.momentum.strong'
    : score >= 45
      ? 'retention.momentum.building'
      : recentWins.length > 0
        ? 'retention.momentum.reinforce'
        : 'retention.momentum.low';
  return localize(key, locale);
}

function reEngagementFor(input: {
  risk: RetentionProjection['retentionRisk'];
  state: RetentionProjection['retentionState'];
  daysInactive: number;
}): RetentionProjection['reEngagement'] {
  const needed = input.risk !== 'low' || input.state === 'at_risk' || input.state === 'inactive' || input.state === 'churn_risk';

  if (!needed) {
    return {
      needed: false,
      priority: 'low',
      title: 'Keep the current rhythm',
      reason: 'The user is returning and completing enough actions to maintain momentum.',
      route: '/dashboard',
    };
  }

  return {
    needed: true,
    priority: input.risk,
    title: input.daysInactive >= 7 ? 'Restart with one quick win' : 'Protect today’s momentum',
    reason: `${input.daysInactive} days inactive. Re-engage with one low-friction mission before suggesting growth work.`,
    route: '/dashboard',
  };
}

export function buildRetentionProjection(input: RetentionFacts & { recentWins: MomentumWin[] }): RetentionProjection {
  const retentionScore = calculateRetentionScore(input);
  const momentumScore = calculateMomentumScore(input);
  const inactiveDays = daysInactive(input);
  const localeResolution = localizationEngine.resolveLocale({ userPreference: input.locale });
  const locale = localeResolution.locale;
  const retentionState = retentionStateFor({ facts: input, retentionScore, momentumScore });
  const retentionRisk = outcomeRetentionRiskFor(input);
  const legacyRetentionRisk = retentionRiskFor(inactiveDays);
  const outcomeCompletionCount = input.outcomeCompletionCount ?? 0;
  const nextOutcome = nextOutcomeFor({
    currentOutcome: input.currentOutcome,
    outcomeCompletionCount,
  });
  const retentionLevel = retentionLevelFor({ facts: input, momentumScore, risk: retentionRisk });
  const progressPercentage = outcomeProgressPercentage({
    outcomeCompletionCount,
    currentOutcomeProgressPercentage: input.currentOutcomeProgressPercentage ?? 0,
    level: retentionLevel,
  });
  const nextOutcomeLabel = outcomeLabel(nextOutcome, locale);
  const levelLabel = localize(`retention.level.${retentionLevel}`, locale);
  const momentumCopy = localizedMomentum(momentumScore, input.recentWins, locale);
  const recovery = recoveryFor({ level: retentionLevel, risk: retentionRisk, nextOutcome, locale });
  const localization = combineLocalization([
    nextOutcomeLabel,
    levelLabel,
    momentumCopy,
    ...recovery.localizedValues,
  ]);
  const daysSinceLastOutcome = outcomeDaysInactive(input);

  return {
    source: 'RetentionEngine',
    scope: 'user',
    confidence: outcomeCompletionCount > 0 || input.activeDays30d > 0 || input.missionCompleted30d > 0 ? 'derived' : 'fallback',
    fallback: outcomeCompletionCount > 0 || input.activeDays30d > 0 || input.missionCompleted30d > 0 ? 'none' : 'insufficient_retention_history',
    generatedAt: input.generatedAt,
    retentionScore,
    retentionState,
    retentionRisk,
    momentumScore,
    currentMomentum: momentumCopy.value,
    outcomeRetention: {
      currentStage: stageFor(retentionLevel),
      retentionLevel,
      retentionLevelLabel: levelLabel.value,
      progressPercentage,
      nextOutcome,
      retained: retentionLevel === 'RETAINED' || retentionLevel === 'EXPANDING',
    },
    outcomeRecommendation: {
      outcome: nextOutcome,
      label: nextOutcomeLabel.value,
      reason: recovery.recovery.reason,
      route: '/mission',
    },
    retentionRecovery: recovery.recovery,
    localization: {
      locale,
      localeSource: localeResolution.source,
      ...localization,
      fallbackUsed: localeResolution.fallbackUsed || localization.fallbackUsed,
    },
    currentStreak: currentStreakFromActiveDays(input.activeDays30d),
    daysInactive: inactiveDays,
    inactivityFlag: inactivityFlagFor(inactiveDays),
    signals: {
      loginFrequency: signal('login_frequency', 'Login frequency', input.loginEvents30d, 8, 'count'),
      missionCompletionFrequency: signal('mission_completion_frequency', 'Mission completion frequency', input.missionCompleted30d, 4, 'count'),
      contentCreationFrequency: signal('content_creation_frequency', 'Content creation frequency', input.contentGenerated30d, 4, 'count'),
      executionConsistency: signal('execution_consistency', 'Execution consistency', executionConsistency(input), 80, 'percent'),
      aiCooInteractionFrequency: signal('ai_coo_interaction_frequency', 'AI COO interaction frequency', input.aiCooInteractions30d, 4, 'count'),
    },
    momentum: {
      missionsCompleted: input.missionCompleted30d,
      contentGenerated: input.contentGenerated30d,
      leadMagnetsCreated: input.leadMagnetsCreated30d,
      funnelsLaunched: input.funnelsLaunched30d,
      winsAchieved: input.winsAchieved30d,
      outcomesCompleted: outcomeCompletionCount,
      outcomeVelocity30d: input.outcomeCompletionCount30d ?? 0,
      daysSinceLastOutcome,
      assetUtilizationCount: input.assetUtilizationCount30d ?? input.contentGenerated30d + input.leadMagnetsCreated30d + input.funnelsLaunched30d,
      agentUsageCount: input.agentUsageCount30d ?? input.aiCooInteractions30d,
      recentWins: input.recentWins.slice(0, 5),
    },
    reEngagement: reEngagementFor({ risk: retentionRisk, state: retentionState, daysInactive: inactiveDays }),
    kpis: {
      sevenDayRetention: outcomeCompletionCount >= 1 || input.activeDays30d >= 2,
      fourteenDayRetention: outcomeCompletionCount >= 2 || input.activeDays30d >= 4,
      thirtyDayRetention: outcomeCompletionCount >= 2 || input.activeDays30d >= 8,
      missionCompletionRate: missionCompletionRate(input),
      retentionRate: retentionLevel === 'RETAINED' || retentionLevel === 'EXPANDING' ? 100 : 0,
      secondOutcomeAchievement: outcomeCompletionCount >= 2 ? 100 : 0,
      outcomeProgressionRate: progressPercentage,
      userExpansionRate: retentionLevel === 'EXPANDING' ? 100 : 0,
      subscriptionRetention: retentionRisk === 'critical' || retentionRisk === 'high' || legacyRetentionRisk === 'critical' ? 'at_risk' : 'healthy',
    },
  };
}
