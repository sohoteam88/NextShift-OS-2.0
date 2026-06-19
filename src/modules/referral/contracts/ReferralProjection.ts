import type { InterviewAuthorityBusinessMode } from '@/modules/interview-authority/contracts/InterviewAuthorityProjection';

export type ReferralReadiness = 'not_ready' | 'potential' | 'ready' | 'advocate' | 'champion';
export type ReferralRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ReferralOpportunityType =
  | 'share_success_story'
  | 'case_study'
  | 'content_collaboration'
  | 'client_referral'
  | 'testimonial'
  | 'review_request'
  | 'customer_referral'
  | 'transformation_story'
  | 'repeat_buyer_referral'
  | 'recruit_referral'
  | 'team_success_story'
  | 'leadership_referral';

export type ReferralOpportunity = {
  id: string;
  type: ReferralOpportunityType;
  title: string;
  reason: string;
  route: string;
  priority: 'low' | 'medium' | 'high';
  expectedOutcome: string;
};

export type ReferralRisk = {
  code: string;
  title: string;
  reason: string;
  route: string;
  priority: ReferralRiskLevel;
};

export type ReferralSignals = {
  valueRealizationScore: number;
  expansionScore: number;
  retentionScore: number;
  recentWins: number;
  missionCompletionConsistency: number;
  customerSatisfactionSignals: number;
  referralInvitesCreated: number;
  referralInvitesUsed: number;
  referralLeads: number;
  referredMembers: number;
};

export type ReferralProjection = {
  source: 'ReferralEngine';
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';
  generatedAt: string;
  businessMode: InterviewAuthorityBusinessMode;
  referralReadiness: ReferralReadiness;
  referralScore: number;
  referralOpportunities: ReferralOpportunity[];
  referralRisks: ReferralRisk[];
  nextReferralMilestone: {
    title: string;
    target: string;
    route: string;
  };
  signals: ReferralSignals;
  kpis: {
    referralRate: number;
    referralConversionRate: number;
    advocateRate: number;
  };
};
