import type { InterviewAuthorityBusinessMode } from '@/modules/interview-authority/contracts/InterviewAuthorityProjection';
import type { LocaleResolution, ProductLocale } from '@/modules/localization/services/LocalizationEngine';

export type ReferralReadiness = 'not_ready' | 'potential' | 'ready' | 'advocate' | 'ambassador' | 'champion';
export type ReferralLevel = 'NOT_READY' | 'READY' | 'ADVOCATE' | 'AMBASSADOR' | 'CHAMPION';
export type ReferralRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ReferralRiskCode = 'NO_SUCCESS_YET' | 'RETENTION_NOT_ACHIEVED' | 'REFERRAL_REQUESTS_IGNORED' | 'SATISFACTION_RISK' | 'REFERRAL_PATH_MISSING';
export type ReferralOpportunityType =
  | 'invite_friend'
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
  personalizedBy: Array<'businessMode' | 'successState' | 'retentionState' | 'expansionState' | 'audience' | 'offer' | 'region'>;
};

export type ReferralRisk = {
  code: string;
  riskCode: ReferralRiskCode;
  title: string;
  reason: string;
  route: string;
  priority: ReferralRiskLevel;
};

export type ReferralState = {
  referralReady: boolean;
  referralLevel: ReferralLevel;
  referralLevelLabel: string;
  referralCount: number;
  successfulReferrals: number;
  pendingReferrals: number;
  nextReferralOpportunity: ReferralOpportunityType;
  nextReferralOpportunityLabel: string;
};

export type ReferralAttribution = {
  referralUserId: string;
  source: 'invite_code' | 'referral_link' | 'manual_referral';
  activated: boolean;
  successful: boolean;
  activatedAt?: string | null;
};

export type ReferralReward = {
  id: string;
  type: 'recognition';
  label: string;
  earned: boolean;
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
  activatedReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
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
  referralState: ReferralState;
  referralRecommendation: ReferralOpportunity;
  referralOpportunities: ReferralOpportunity[];
  referralRisks: ReferralRisk[];
  referralAttribution: ReferralAttribution[];
  referralRewards: ReferralReward[];
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
    referralReadyRate: number;
    referralParticipationRate: number;
    successfulReferralRate: number;
    activatedReferralRate: number;
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
