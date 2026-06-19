import type { InterviewAuthorityBusinessMode } from '@/modules/interview-authority/contracts/InterviewAuthorityProjection';

export type ExpansionStage = 'first_win' | 'repeatable' | 'growing' | 'scaling' | 'optimizing';
export type ExpansionRiskLevel = 'low' | 'medium' | 'high' | 'critical';
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
  title: string;
  reason: string;
  route: string;
  priority: 'low' | 'medium' | 'high';
  expectedMetricLift: string;
};

export type ExpansionRisk = {
  code: string;
  lever: GrowthLever;
  title: string;
  reason: string;
  route: string;
  priority: ExpansionRiskLevel;
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
  expansionOpportunities: ExpansionOpportunity[];
  expansionRisks: ExpansionRisk[];
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
  };
};
