import type { LocaleResolution, ProductLocale } from '@/modules/localization/services/LocalizationEngine';

export type HealthLevel = 'CRITICAL' | 'AT_RISK' | 'STABLE' | 'HEALTHY' | 'THRIVING';
export type HealthTrendDirection = 'UP' | 'DOWN' | 'STABLE';
export type HealthDriverType =
  | 'outcome_velocity'
  | 'mission_completion_consistency'
  | 'retention_progress'
  | 'expansion_progress'
  | 'referral_success';
export type HealthRiskType =
  | 'no_outcome_progress'
  | 'success_dropping'
  | 'retention_declining'
  | 'expansion_plateau'
  | 'no_mission_activity'
  | 'low_asset_utilization'
  | 'referral_blocked';
export type HealthInterventionAction =
  | 'none'
  | 'recovery_recommendation'
  | 'outcome_recovery_mission'
  | 'expansion_recovery_mission'
  | 'retention_recovery_mission'
  | 'referral_recovery_mission'
  | 'priority_escalation'
  | 'ai_coo_attention';

export type HealthDriver = {
  type: HealthDriverType;
  title: string;
  reason: string;
  impact: 'low' | 'medium' | 'high';
};

export type RiskFactor = {
  type: HealthRiskType;
  title: string;
  reason: string;
  severity: 'medium' | 'high' | 'critical';
  route: string;
};

export type CustomerHealth = {
  healthLevel: HealthLevel;
  healthLevelLabel: string;
  healthScore: number;
  healthDrivers: HealthDriver[];
  riskFactors: RiskFactor[];
  interventionRequired: boolean;
};

export type CustomerHealthProjection = {
  source: 'CustomerHealthEngine';
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';
  generatedAt: string;
  customerHealth: CustomerHealth;
  healthTrend: {
    direction: HealthTrendDirection;
    windowDays: 30;
    reason: string;
  };
  recommendedAction: {
    action: HealthInterventionAction;
    title: string;
    reason: string;
    route: string;
  };
  componentScores: {
    activation: number;
    success: number;
    retention: number;
    expansion: number;
    referral: number;
  };
  kpis: {
    healthyUserRate: number;
    thrivingUserRate: number;
    atRiskRecoveryRate: number;
    churnPreventionRate: number;
  };
  localization: LocaleResolution & {
    translationSource: 'registry' | 'fallback' | 'missing';
    messageKeys: string[];
  };
  personalization: {
    audience?: string | null;
    offer?: string | null;
    businessModel?: string | null;
    stage?: string | null;
    locale: ProductLocale;
  };
};
