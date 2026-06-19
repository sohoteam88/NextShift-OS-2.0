import type { InterviewAuthorityBusinessMode } from '@/modules/interview-authority/contracts/InterviewAuthorityProjection';

export type ValueStage = 'not_started' | 'progressing' | 'first_win' | 'growing' | 'scaling';
export type ValueRisk = 'low' | 'medium' | 'high' | 'critical';

export type ValueMilestoneId =
  | 'first_content_published'
  | 'first_100_views'
  | 'first_1000_views'
  | 'first_lead'
  | 'first_appointment'
  | 'first_client'
  | 'first_customer'
  | 'first_sale'
  | 'first_prospect'
  | 'first_recruit'
  | 'first_team_member';

export type OutcomeMetrics = {
  leadsGenerated: number;
  appointmentsBooked: number;
  customersAcquired: number;
  revenueGenerated: number;
  teamMembersRecruited: number;
  contentPublished: number;
  viewsGenerated: number;
};

export type ValueMilestone = {
  id: ValueMilestoneId;
  label: string;
  achieved: boolean;
  achievedAt: string | null;
  route: string;
};

export type ValueProjection = {
  source: 'ValueRealizationEngine';
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';
  generatedAt: string;
  businessMode: InterviewAuthorityBusinessMode;
  valueRealizationScore: number;
  currentValueStage: ValueStage;
  valueRisk: ValueRisk;
  outcomeMetrics: OutcomeMetrics;
  milestones: ValueMilestone[];
  latestWin: ValueMilestone | null;
  nextMilestone: ValueMilestone | null;
  blockers: Array<{
    code: string;
    title: string;
    reason: string;
    route: string;
  }>;
  recommendedValueAction: {
    title: string;
    reason: string;
    route: string;
    expectedOutcome: string;
  };
  kpis: {
    firstLeadRate: number;
    firstCustomerRate: number;
    firstSaleRate: number;
    revenueGenerated: number;
    customerSuccessRate: number;
  };
};
