import type { LocaleResolution, LocalizedValue, ProductLocale } from '@/modules/localization/services/LocalizationEngine';
import type { OutcomeTemplateId } from '@/modules/mission-engine/services/OutcomeOrchestrator';

export type RetentionState =
  | 'new_user'
  | 'active_user'
  | 'engaged_user'
  | 'at_risk'
  | 'inactive'
  | 'churn_risk';

export type RetentionRisk = 'low' | 'medium' | 'high' | 'critical';

export type OutcomeRetentionLevel =
  | 'NEW_SUCCESS'
  | 'ACTIVE_PROGRESS'
  | 'MOMENTUM'
  | 'AT_RISK'
  | 'STALLED'
  | 'RETAINED'
  | 'EXPANDING';

export type RetentionSignal = {
  key: string;
  label: string;
  value: number;
  target: number;
  unit: 'count' | 'days' | 'percent';
};

export type MomentumWin = {
  type: 'mission' | 'content' | 'lead_magnet' | 'funnel' | 'execution' | 'achievement' | 'outcome';
  title: string;
  occurredAt: string;
};

export type OutcomeRetentionState = {
  currentStage: 'ACTIVATED' | 'SUCCESSFUL' | 'RETAINED' | 'EXPANDING';
  retentionLevel: OutcomeRetentionLevel;
  retentionLevelLabel: string;
  progressPercentage: number;
  nextOutcome: OutcomeTemplateId;
  retained: boolean;
};

export type RetentionProjection = {
  source: 'RetentionEngine';
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';
  generatedAt: string;
  retentionScore: number;
  retentionState: RetentionState;
  retentionRisk: RetentionRisk;
  momentumScore: number;
  currentMomentum: string;
  outcomeRetention: OutcomeRetentionState;
  outcomeRecommendation: {
    outcome: OutcomeTemplateId;
    label: string;
    reason: string;
    route: string;
  };
  retentionRecovery: {
    needed: boolean;
    action: 'recommend_next_outcome' | 'generate_recovery_mission' | 'activate_agent_assistance' | 'send_progress_reminder';
    title: string;
    reason: string;
    route: string;
  };
  localization: {
    locale: ProductLocale;
    localeSource: LocaleResolution['source'];
    translationSource: LocalizedValue['translationSource'];
    fallbackUsed: boolean;
    messageKeys: string[];
  };
  currentStreak: number;
  daysInactive: number;
  inactivityFlag: 'none' | '3_days_inactive' | '7_days_inactive' | '14_days_inactive' | '30_days_inactive';
  signals: {
    loginFrequency: RetentionSignal;
    missionCompletionFrequency: RetentionSignal;
    contentCreationFrequency: RetentionSignal;
    executionConsistency: RetentionSignal;
    aiCooInteractionFrequency: RetentionSignal;
  };
  momentum: {
    missionsCompleted: number;
    contentGenerated: number;
    leadMagnetsCreated: number;
    funnelsLaunched: number;
    winsAchieved: number;
    outcomesCompleted?: number;
    outcomeVelocity30d?: number;
    daysSinceLastOutcome?: number | null;
    assetUtilizationCount?: number;
    agentUsageCount?: number;
    recentWins: MomentumWin[];
  };
  reEngagement: {
    needed: boolean;
    priority: RetentionRisk;
    title: string;
    reason: string;
    route: string;
  };
  kpis: {
    sevenDayRetention: boolean;
    fourteenDayRetention: boolean;
    thirtyDayRetention: boolean;
    missionCompletionRate: number;
    retentionRate?: number;
    secondOutcomeAchievement?: number;
    outcomeProgressionRate?: number;
    userExpansionRate?: number;
    subscriptionRetention: 'unknown' | 'healthy' | 'at_risk';
  };
};
