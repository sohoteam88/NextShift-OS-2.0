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
  | 'lead_magnet_dropoff'
  | 'landing_page_dropoff';

export type ActivationRisk = 'low' | 'medium' | 'high' | 'critical';

export type ActivationStep = {
  id: ActivationStepId;
  label: string;
  route: string;
  status: 'completed' | 'current' | 'locked';
  completedAt: string | null;
  estimatedMinutes: number;
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
  currentStep: ActivationStep;
  steps: ActivationStep[];
  firstWin: {
    achieved: boolean;
    targetMinutes: number;
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
    timeToFirstWinMinutes: number | null;
    sevenDayRetentionSignal: boolean;
    thirtyDayRetentionSignal: boolean;
  };
};
