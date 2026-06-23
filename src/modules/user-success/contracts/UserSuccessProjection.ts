import type { LocaleResolution, LocalizedValue, ProductLocale } from '@/modules/localization/services/LocalizationEngine';
import type { OutcomeTemplateId } from '@/modules/mission-engine/services/OutcomeOrchestrator';

export type SuccessLevel =
  | 'NOT_STARTED'
  | 'WORKING'
  | 'PROGRESSING'
  | 'AT_RISK'
  | 'BLOCKED'
  | 'SUCCESSFUL';

export type SuccessBlockerType =
  | 'traffic_blocker'
  | 'conversion_blocker'
  | 'revenue_blocker'
  | 'retention_blocker'
  | 'team_system_blocker'
  | 'authority_blocker'
  | 'outcome_signal_missing';

export type SuccessInterventionAction =
  | 'ai_coo_recommendation'
  | 'recovery_mission'
  | 'agent_assistance'
  | 'outcome_coaching';

export type SuccessState = {
  currentOutcome: OutcomeTemplateId;
  successLevel: SuccessLevel;
  progressPercentage: number;
  blockedReason?: SuccessBlockerType;
  successful: boolean;
};

export type SuccessBlocker = {
  code: SuccessBlockerType;
  title: string;
  reason: string;
  route: string;
};

export type SuccessRecoveryAction = {
  action: SuccessInterventionAction;
  title: string;
  reason: string;
  route: string;
  expectedOutcome: string;
};

export type SuccessCelebration = {
  event: 'first_lead' | 'first_customer' | 'first_revenue' | 'first_retained_customer';
  title: string;
  progressGained: number;
  nextOutcome: OutcomeTemplateId;
};

export type UserSuccessProjection = {
  source: 'UserSuccessEngine';
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';
  generatedAt: string;
  successScore: number;
  successState: SuccessState;
  currentOutcome: {
    id: OutcomeTemplateId;
    label: string;
    targetDays: number;
    currentResult: string;
    nextMilestone: string;
  };
  outcomeProgress: {
    missionCompletionPercentage: number;
    signalProgressPercentage: number;
    successProgressPercentage: number;
    missionCompletionContributesOnly: true;
  };
  blockers: SuccessBlocker[];
  recoveryActions: SuccessRecoveryAction[];
  celebrations: SuccessCelebration[];
  localization: {
    locale: ProductLocale;
    localeSource: LocaleResolution['source'];
    translationSource: LocalizedValue['translationSource'];
    fallbackUsed: boolean;
    messageKeys: string[];
  };
  kpis: {
    activationToSuccessRate: number;
    outcomeAchievementRate: number;
    firstLeadAchievement: number;
    firstCustomerAchievement: number;
    firstRevenueAchievement: number;
  };
};
