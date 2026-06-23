import type { InterviewAuthorityBusinessMode } from '@/modules/interview-authority/contracts/InterviewAuthorityProjection';
import type { LocaleResolution, ProductLocale } from '@/modules/localization/services/LocalizationEngine';
import type { OutcomeTemplateId } from '@/modules/mission-engine/services/OutcomeOrchestrator';

export type ExpansionStage = 'first_win' | 'repeatable' | 'growing' | 'scaling' | 'optimizing';
export type ExpansionLevel = 'EMERGING' | 'GROWING' | 'SCALING' | 'OPTIMIZING' | 'LEADING' | 'AUTHORITY';
export type ExpansionRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ExpansionRiskCode =
  | 'PLATEAU'
  | 'STALLED_GROWTH'
  | 'SCALING_BLOCKED'
  | 'VALUE_NOT_PROVEN'
  | 'LEVER_MISSING'
  | 'LEVER_DECLINING';
export type ExpansionRecoveryAction =
  | 'growth_mission'
  | 'optimization_mission'
  | 'expansion_outcome'
  | 'workforce_assistance';
export type ExpansionOpportunityId =
  | Extract<OutcomeTemplateId, 'FIRST_CUSTOMER' | 'FIRST_REVENUE' | 'RETENTION_SYSTEM' | 'TEAM_SCALING' | 'AUTHORITY_BUILDING'>
  | 'MARKET_LEADERSHIP';
export type GrowthLever =
  | 'lead_growth'
  | 'customer_growth'
  | 'revenue_growth'
  | 'audience_growth'
  | 'content_growth'
  | 'team_growth';

export type ExpansionMetric = {
  current: number;
  previous: number;
  growthRate: number;
};

export type ExpansionMetrics = {
  leads: ExpansionMetric;
  customers: ExpansionMetric;
  revenue: ExpansionMetric;
  audience: ExpansionMetric;
  content: ExpansionMetric;
  team: ExpansionMetric;
};

export type ExpansionOpportunity = {
  id: string;
  lever: GrowthLever;
  opportunity: ExpansionOpportunityId;
  title: string;
  reason: string;
  route: string;
  priority: 'low' | 'medium' | 'high';
  expectedMetricLift: string;
  personalizedBy: Array<'businessMode' | 'audience' | 'offer' | 'stage' | 'region'>;
};

export type ExpansionRisk = {
  code: string;
  riskCode: ExpansionRiskCode;
  lever: GrowthLever;
  title: string;
  reason: string;
  route: string;
  priority: ExpansionRiskLevel;
};

export type ExpansionState = {
  currentExpansionStage: string;
  expansionLevel: ExpansionLevel;
  expansionLevelLabel: string;
  expansionProgress: number;
  nextExpansionOpportunity: ExpansionOpportunityId;
  nextExpansionOpportunityLabel: string;
  expanding: boolean;
};

export type ExpansionRecovery = {
  needed: boolean;
  riskCode: ExpansionRiskCode | 'none';
  action: ExpansionRecoveryAction;
  title: string;
  reason: string;
  route: string;
};

export type ExpansionCelebration = {
  id: string;
  title: string;
  occurredAt: string;
};

export type ExpansionProjection = {
  source: 'ExpansionEngine';
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';
  generatedAt: string;
  businessMode: InterviewAuthorityBusinessMode;
  expansionScore: number;
  expansionStage: ExpansionStage;
  expansionState: ExpansionState;
  currentGrowthLever: {
    lever: GrowthLever;
    title: string;
    reason: string;
    route: string;
  };
  scaleReadiness: {
    score: number;
    status: 'not_ready' | 'ready' | 'strong' | 'scale_ready';
    reason: string;
  };
  expansionOpportunity: ExpansionOpportunity;
  expansionOpportunities: ExpansionOpportunity[];
  expansionRisks: ExpansionRisk[];
  expansionRecovery: ExpansionRecovery;
  expansionCelebrations: ExpansionCelebration[];
  nextGrowthMilestone: {
    title: string;
    metric: GrowthLever;
    target: string;
    route: string;
  };
  metrics: ExpansionMetrics;
  kpis: {
    leadGrowthRate: number;
    revenueGrowthRate: number;
    customerGrowthRate: number;
    teamGrowthRate: number;
    expansionSuccessRate: number;
    expansionRate: number;
    outcomeProgressionRate: number;
    expansionOpportunityAdoption: number;
  };
  localization: LocaleResolution & {
    translationSource: 'registry' | 'fallback' | 'missing';
    messageKeys: string[];
  };
  personalization: {
    businessModel: InterviewAuthorityBusinessMode;
    audience?: string | null;
    offer?: string | null;
    stage?: string | null;
    region?: string | null;
    locale: ProductLocale;
  };
};
