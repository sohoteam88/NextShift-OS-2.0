import type { BusinessOutcome, OutcomeTemplateId } from '@/modules/mission-engine/services/OutcomeOrchestrator';
import type { ValueProjection } from '@/modules/value/contracts/ValueProjection';
import type { RetentionProjection } from '@/modules/retention/contracts/RetentionProjection';
import {
  localizationEngine,
  type LocaleResolutionInput,
  type LocalizedValue,
  type ProductLocale,
} from '@/modules/localization/services/LocalizationEngine';
import type {
  SuccessBlocker,
  SuccessBlockerType,
  SuccessCelebration,
  SuccessLevel,
  SuccessRecoveryAction,
  UserSuccessProjection,
} from '../contracts/UserSuccessProjection';

const TARGET_DAYS: Record<OutcomeTemplateId, number> = {
  FIRST_LEAD: 7,
  FIRST_CUSTOMER: 30,
  FIRST_REVENUE: 45,
  RETENTION_SYSTEM: 60,
  TEAM_SCALING: 60,
  AUTHORITY_BUILDING: 30,
};

const NEXT_OUTCOME: Record<OutcomeTemplateId, OutcomeTemplateId> = {
  FIRST_LEAD: 'FIRST_CUSTOMER',
  FIRST_CUSTOMER: 'FIRST_REVENUE',
  FIRST_REVENUE: 'RETENTION_SYSTEM',
  RETENTION_SYSTEM: 'TEAM_SCALING',
  TEAM_SCALING: 'AUTHORITY_BUILDING',
  AUTHORITY_BUILDING: 'FIRST_LEAD',
};

function localize(key: string, locale: ProductLocale): LocalizedValue {
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

function signalRatio(outcome: BusinessOutcome) {
  const signal = outcome.requiredSignal;
  if (signal.verified) return 100;
  if (typeof signal.currentValue !== 'number' || typeof signal.targetValue !== 'number') return 0;
  if (signal.targetValue <= 0) return signal.currentValue > 0 ? 100 : 0;
  return Math.max(0, Math.min(100, Math.floor((signal.currentValue / signal.targetValue) * 100)));
}

function successLevelFor(input: {
  outcome: BusinessOutcome;
  successProgress: number;
  daysSinceActivation: number;
}) {
  if (input.outcome.requiredSignal.verified) return 'SUCCESSFUL';
  const allMissionsComplete = input.outcome.missions.every((mission) => mission.status === 'COMPLETED');
  if (input.outcome.status === 'BLOCKED' || allMissionsComplete) return 'BLOCKED';
  if (input.daysSinceActivation > TARGET_DAYS[input.outcome.templateId]) return 'AT_RISK';
  if (input.successProgress === 0) return 'NOT_STARTED';
  if (input.successProgress >= 50) return 'PROGRESSING';
  return 'WORKING';
}

function blockerCodeFor(input: {
  outcome: BusinessOutcome;
  value: ValueProjection;
  retention: RetentionProjection;
}): SuccessBlockerType {
  switch (input.outcome.templateId) {
    case 'FIRST_LEAD':
      return input.value.outcomeMetrics.leadsGenerated === 0 ? 'traffic_blocker' : 'outcome_signal_missing';
    case 'FIRST_CUSTOMER':
      return input.value.outcomeMetrics.customersAcquired === 0 ? 'conversion_blocker' : 'outcome_signal_missing';
    case 'FIRST_REVENUE':
      return input.value.outcomeMetrics.revenueGenerated <= 0 ? 'revenue_blocker' : 'outcome_signal_missing';
    case 'RETENTION_SYSTEM':
      return input.retention.retentionRisk === 'low' ? 'outcome_signal_missing' : 'retention_blocker';
    case 'TEAM_SCALING':
      return 'team_system_blocker';
    case 'AUTHORITY_BUILDING':
      return input.value.outcomeMetrics.contentPublished < 3 ? 'authority_blocker' : 'outcome_signal_missing';
  }
}

function blockerCopy(code: SuccessBlockerType) {
  switch (code) {
    case 'traffic_blocker':
      return { title: 'success.blocker.traffic.title', reason: 'success.blocker.traffic.reason', route: '/traffic-engine' };
    case 'conversion_blocker':
      return { title: 'success.blocker.conversion.title', reason: 'success.blocker.conversion.reason', route: '/crm' };
    case 'revenue_blocker':
      return { title: 'success.blocker.revenue.title', reason: 'success.blocker.revenue.reason', route: '/sales' };
    case 'retention_blocker':
      return { title: 'success.blocker.retention.title', reason: 'success.blocker.retention.reason', route: '/customers' };
    case 'team_system_blocker':
      return { title: 'success.blocker.team.title', reason: 'success.blocker.team.reason', route: '/ai-workforce' };
    case 'authority_blocker':
      return { title: 'success.blocker.authority.title', reason: 'success.blocker.authority.reason', route: '/content-engine' };
    case 'outcome_signal_missing':
      return { title: 'success.blocker.traffic.title', reason: 'success.blocker.traffic.reason', route: '/dashboard' };
  }
}

function buildBlockers(input: {
  level: SuccessLevel;
  outcome: BusinessOutcome;
  value: ValueProjection;
  retention: RetentionProjection;
  locale: ProductLocale;
}) {
  if (input.level === 'SUCCESSFUL' || input.level === 'NOT_STARTED') return { blockers: [], localizedValues: [] };
  if (input.level !== 'BLOCKED' && input.level !== 'AT_RISK') return { blockers: [], localizedValues: [] };

  const code = blockerCodeFor(input);
  const copy = blockerCopy(code);
  const title = localize(copy.title, input.locale);
  const reason = localize(copy.reason, input.locale);
  const blocker: SuccessBlocker = {
    code,
    title: title.value,
    reason: reason.value,
    route: copy.route,
  };

  return { blockers: [blocker], localizedValues: [title, reason] };
}

function recoveryFor(input: {
  blocker: SuccessBlocker | null;
  outcome: BusinessOutcome;
  locale: ProductLocale;
}): { actions: SuccessRecoveryAction[]; localizedValues: LocalizedValue[] } {
  if (!input.blocker) return { actions: [], localizedValues: [] };

  const keyByBlocker: Record<SuccessBlockerType, string> = {
    traffic_blocker: 'success.recovery.activateTraffic',
    conversion_blocker: 'success.recovery.improveOffer',
    revenue_blocker: 'success.recovery.closeFirstSale',
    retention_blocker: 'success.recovery.buildRetention',
    team_system_blocker: 'success.recovery.createSop',
    authority_blocker: 'success.recovery.publishAuthority',
    outcome_signal_missing: 'success.recovery.activateTraffic',
  };
  const title = localize(keyByBlocker[input.blocker.code], input.locale);

  return {
    actions: [{
      action: 'recovery_mission',
      title: title.value,
      reason: input.blocker.reason,
      route: input.blocker.route,
      expectedOutcome: input.outcome.name,
    }],
    localizedValues: [title],
  };
}

function currentResultFor(outcome: BusinessOutcome, value: ValueProjection, retention: RetentionProjection) {
  switch (outcome.templateId) {
    case 'FIRST_LEAD':
      return `${value.outcomeMetrics.leadsGenerated} Leads`;
    case 'FIRST_CUSTOMER':
      return `${value.outcomeMetrics.customersAcquired} Customers`;
    case 'FIRST_REVENUE':
      return `RM ${value.outcomeMetrics.revenueGenerated}`;
    case 'RETENTION_SYSTEM':
      return `${retention.signals.executionConsistency.value}% Retention`;
    case 'TEAM_SCALING':
      return `${value.outcomeMetrics.teamMembersRecruited} Team Members`;
    case 'AUTHORITY_BUILDING':
      return `${value.outcomeMetrics.contentPublished} Published Content`;
  }
}

function nextMilestoneKey(outcome: OutcomeTemplateId) {
  switch (outcome) {
    case 'FIRST_LEAD':
      return 'success.milestone.firstLead';
    case 'FIRST_CUSTOMER':
      return 'success.milestone.firstCustomer';
    case 'FIRST_REVENUE':
      return 'success.milestone.firstSale';
    case 'RETENTION_SYSTEM':
      return 'success.milestone.retentionSystem';
    case 'TEAM_SCALING':
      return 'success.milestone.teamSystem';
    case 'AUTHORITY_BUILDING':
      return 'success.milestone.authorityContent';
  }
}

function celebrationsFor(input: {
  value: ValueProjection;
  retention: RetentionProjection;
  outcome: BusinessOutcome;
  locale: ProductLocale;
}): { celebrations: SuccessCelebration[]; localizedValues: LocalizedValue[] } {
  const events: Array<{
    when: boolean;
    event: SuccessCelebration['event'];
    key: string;
    progressGained: number;
  }> = [
    { when: input.value.outcomeMetrics.leadsGenerated > 0, event: 'first_lead', key: 'success.celebration.firstLead', progressGained: 25 },
    { when: input.value.outcomeMetrics.customersAcquired > 0, event: 'first_customer', key: 'success.celebration.firstCustomer', progressGained: 30 },
    { when: input.value.outcomeMetrics.revenueGenerated > 0, event: 'first_revenue', key: 'success.celebration.firstRevenue', progressGained: 35 },
    { when: input.retention.retentionRisk === 'low' && input.value.outcomeMetrics.customersAcquired > 0, event: 'first_retained_customer', key: 'success.celebration.firstRetainedCustomer', progressGained: 20 },
  ];

  const localizedValues: LocalizedValue[] = [];
  const celebrations = events
    .filter((event) => event.when)
    .map((event): SuccessCelebration => {
      const title = localize(event.key, input.locale);
      localizedValues.push(title);
      return {
        event: event.event,
        title: title.value,
        progressGained: event.progressGained,
        nextOutcome: NEXT_OUTCOME[input.outcome.templateId],
      };
    });

  return { celebrations, localizedValues };
}

export function buildUserSuccessProjection(input: {
  outcome: BusinessOutcome;
  valueProjection: ValueProjection;
  retentionProjection: RetentionProjection;
  daysSinceActivation?: number;
  generatedAt: string;
  locale?: LocaleResolutionInput;
}): UserSuccessProjection {
  const localeResolution = localizationEngine.resolveLocale(input.locale);
  const locale = localeResolution.locale;
  const missionCompletionPercentage = input.outcome.missions.length > 0
    ? Math.floor(input.outcome.missions.filter((mission) => mission.status === 'COMPLETED').length / input.outcome.missions.length * 100)
    : 0;
  const signalProgressPercentage = signalRatio(input.outcome);
  const successProgressPercentage = input.outcome.requiredSignal.verified
    ? 100
    : Math.floor((missionCompletionPercentage * 0.4) + (signalProgressPercentage * 0.6));
  const level = successLevelFor({
    outcome: input.outcome,
    successProgress: successProgressPercentage,
    daysSinceActivation: input.daysSinceActivation ?? 0,
  });
  const blocked = buildBlockers({
    level,
    outcome: input.outcome,
    value: input.valueProjection,
    retention: input.retentionProjection,
    locale,
  });
  const recovery = recoveryFor({
    blocker: blocked.blockers[0] ?? null,
    outcome: input.outcome,
    locale,
  });
  const celebrations = celebrationsFor({
    value: input.valueProjection,
    retention: input.retentionProjection,
    outcome: input.outcome,
    locale,
  });
  const outcomeLabel = localize(`success.outcome.${input.outcome.templateId}`, locale);
  const nextMilestone = localize(nextMilestoneKey(input.outcome.templateId), locale);
  const localizedValues = [
    outcomeLabel,
    nextMilestone,
    ...blocked.localizedValues,
    ...recovery.localizedValues,
    ...celebrations.localizedValues,
  ];
  const localization = combineLocalization(localizedValues);

  return {
    source: 'UserSuccessEngine',
    scope: 'user',
    confidence: input.outcome.requiredSignal.verified || input.valueProjection.confidence !== 'fallback' ? 'derived' : 'fallback',
    fallback: input.outcome.requiredSignal.verified || input.valueProjection.confidence !== 'fallback' ? 'none' : 'no_success_outcome_signal',
    generatedAt: input.generatedAt,
    successScore: successProgressPercentage,
    successState: {
      currentOutcome: input.outcome.templateId,
      successLevel: level,
      progressPercentage: successProgressPercentage,
      blockedReason: blocked.blockers[0]?.code,
      successful: level === 'SUCCESSFUL',
    },
    currentOutcome: {
      id: input.outcome.templateId,
      label: outcomeLabel.value,
      targetDays: TARGET_DAYS[input.outcome.templateId],
      currentResult: currentResultFor(input.outcome, input.valueProjection, input.retentionProjection),
      nextMilestone: nextMilestone.value,
    },
    outcomeProgress: {
      missionCompletionPercentage,
      signalProgressPercentage,
      successProgressPercentage,
      missionCompletionContributesOnly: true,
    },
    blockers: blocked.blockers,
    recoveryActions: recovery.actions,
    celebrations: celebrations.celebrations,
    localization: {
      locale,
      localeSource: localeResolution.source,
      ...localization,
      fallbackUsed: localeResolution.fallbackUsed || localization.fallbackUsed,
    },
    kpis: {
      activationToSuccessRate: level === 'SUCCESSFUL' ? 100 : 0,
      outcomeAchievementRate: input.outcome.requiredSignal.verified ? 100 : 0,
      firstLeadAchievement: input.valueProjection.outcomeMetrics.leadsGenerated > 0 ? 100 : 0,
      firstCustomerAchievement: input.valueProjection.outcomeMetrics.customersAcquired > 0 ? 100 : 0,
      firstRevenueAchievement: input.valueProjection.outcomeMetrics.revenueGenerated > 0 ? 100 : 0,
    },
  };
}
