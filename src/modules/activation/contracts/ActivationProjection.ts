import type {
  LocaleResolution,
  LocalizedValue,
  ProductLocale,
} from '@/modules/localization/services/LocalizationEngine';

export type ActivationStepId =
  | 'account_created'
  | 'interview_started'
  | 'interview_completed'
  | 'brand_dna_generated'
  | 'first_content_generated'
  | 'first_lead_captured';

export type DropOffStage =
  | 'none'
  | 'signup_dropoff'
  | 'interview_dropoff'
  | 'brand_dna_dropoff'
  | 'content_dropoff'
  | 'first_mission_dropoff'
  | 'first_asset_review_dropoff'
  | 'first_outcome_dropoff'
  | 'lead_magnet_dropoff'
  | 'landing_page_dropoff';

export type ActivationRisk = 'low' | 'medium' | 'high' | 'critical';
export type ActivationProgressState = 'ACTIVE' | 'ON_TRACK' | 'AT_RISK' | 'DROPPED_OFF' | 'ACTIVATED';
export type ActivationFunnelStepId =
  | 'SIGNUP'
  | 'AI_INTERVIEW'
  | 'BUSINESS_ANALYSIS'
  | 'FIRST_MISSION'
  | 'FIRST_ASSET'
  | 'FIRST_OUTCOME'
  | 'ACTIVATED';

export type ActivationStep = {
  id: ActivationStepId;
  label: string;
  route: string;
  status: 'completed' | 'current' | 'locked';
  completedAt: string | null;
  estimatedMinutes: number;
};

export type ActivationFunnelStep = {
  id: ActivationFunnelStepId;
  label: string;
  status: 'completed' | 'current' | 'locked';
  completedAt: string | null;
  successSignal: string;
};

export type ActivationState = {
  currentStep: ActivationFunnelStepId;
  state: ActivationProgressState;
  completionPercentage: number;
  blockedReason?: string;
  activated: boolean;
  hoursRemaining: number | null;
  hoursSinceActivity: number;
};

export type ActivationDropOffRisk = {
  state: Exclude<ActivationProgressState, 'ACTIVE'>;
  riskLevel: ActivationRisk;
  currentStep: ActivationFunnelStepId;
  gracePeriodHours: number | null;
  hoursSinceActivity: number;
  hoursRemaining: number | null;
  activityAnchor: string;
  thresholdPercentUsed: number;
  interventionAllowed: boolean;
};

export type ActivationIntervention = {
  trigger:
    | 'activation_stalled'
    | 'mission_ignored'
    | 'asset_not_reviewed'
    | 'outcome_not_reached';
  action: 'email' | 'in_app_prompt' | 'mission_reminder' | 'ai_coo_recommendation';
  message: string;
  messageKey: string;
  locale: ProductLocale;
  translationSource: LocalizedValue['translationSource'];
  fallbackUsed: boolean;
  route: string;
};

export type ActivationLocalization = {
  locale: ProductLocale;
  localeSource: LocaleResolution['source'];
  translationSource: LocalizedValue['translationSource'];
  fallbackUsed: boolean;
  messageKeys: string[];
  stateLabel: string;
  currentStepLabel: string;
  nextActionLabel: string;
  firstValueLabel: string;
  recoveryMessage: string;
  aiCooRiskTitle: string;
  aiCooRiskReason: string;
};

export type ActivationProjection = {
  source: 'ActivationEngine';
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';
  generatedAt: string;
  activationScore: number;
  activationThreshold: number;
  activationRisk: ActivationRisk;
  dropOffStage: DropOffStage;
  activationState: ActivationState;
  dropOffRisk: ActivationDropOffRisk;
  localization: ActivationLocalization;
  activationFunnel: ActivationFunnelStep[];
  firstValue: {
    visible: boolean;
    type: 'none' | 'first_asset' | 'first_content' | 'first_funnel' | 'first_lead' | 'first_outcome';
    label: string;
    achievedAt: string | null;
  };
  interventions: ActivationIntervention[];
  currentStep: ActivationStep;
  steps: ActivationStep[];
  firstWin: {
    achieved: boolean;
    targetMinutes: number;
    targetAssetSeconds: number;
    timeToFirstWinMinutes: number | null;
    progressPercent: number;
    status: 'on_track' | 'at_risk' | 'missed' | 'achieved';
  };
  currentMission: {
    title: string;
    description: string;
    route: string;
    ctaLabel: string;
    estimatedMinutes: number;
  };
  shouldHideAdvancedModules: boolean;
  kpis: {
    activationRate: number;
    interviewCompletionRate: number;
    missionStartRate: number;
    assetGenerationRate: number;
    outcomeAchievementRate: number;
    timeToFirstWinMinutes: number | null;
    sevenDayRetentionSignal: boolean;
    thirtyDayRetentionSignal: boolean;
  };
};
