import type { InterviewAuthorityBusinessMode } from '@/modules/interview-authority/contracts/InterviewAuthorityProjection';
import type { RetentionProjection } from '@/modules/retention/contracts/RetentionProjection';
import type { ValueProjection } from '@/modules/value/contracts/ValueProjection';
import type { ExpansionProjection } from '@/modules/expansion/contracts/ExpansionProjection';
import type { ReferralAttribution } from '../contracts/ReferralProjection';

export type ReferralFacts = {
  businessMode: InterviewAuthorityBusinessMode;
  generatedAt: string;
  valueProjection: ValueProjection;
  expansionProjection: ExpansionProjection;
  retentionProjection: RetentionProjection;
  referralInvitesCreated: number;
  referralInvitesUsed: number;
  referralLeads: number;
  referredMembers: number;
  activatedReferrals: number;
  successfulReferrals: number;
  pendingReferrals?: number;
  ignoredReferralRequests?: number;
  referralAttribution?: ReferralAttribution[];
  positiveSatisfactionSignals: number;
  negativeSatisfactionSignals: number;
  locale?: string | null;
  personalization?: {
    audience?: string | null;
    offer?: string | null;
    stage?: string | null;
    region?: string | null;
  };
};

export function referralConversionRate(facts: ReferralFacts) {
  if (facts.referralInvitesCreated <= 0) return 0;
  return Math.round((facts.activatedReferrals / facts.referralInvitesCreated) * 100);
}

export function recentWinCount(facts: ReferralFacts) {
  return facts.retentionProjection.momentum.recentWins.length;
}

export function missionConsistency(facts: ReferralFacts) {
  return facts.retentionProjection.signals.missionCompletionFrequency.target > 0
    ? Math.min(100, Math.round((facts.retentionProjection.signals.missionCompletionFrequency.value / facts.retentionProjection.signals.missionCompletionFrequency.target) * 100))
    : 0;
}

export function customerSatisfactionSignals(facts: ReferralFacts) {
  return Math.max(0, facts.positiveSatisfactionSignals - facts.negativeSatisfactionSignals);
}
