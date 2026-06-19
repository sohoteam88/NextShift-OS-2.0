import type { ReferralProjection } from '../contracts/ReferralProjection';
import type { ReferralFacts } from './referral-facts';
import { customerSatisfactionSignals, missionConsistency, recentWinCount, referralConversionRate } from './referral-facts';
import { calculateReferralScore, referralReadinessFor } from './referral-score-engine';
import { detectReferralRisks, isAdvocacyReady } from './advocacy-detector';
import { detectReferralOpportunities, nextReferralMilestoneFor } from './referral-opportunity-engine';

export function buildReferralProjection(facts: ReferralFacts): ReferralProjection {
  const referralScore = calculateReferralScore(facts);
  const referralReadiness = referralReadinessFor(referralScore, facts);
  const referralOpportunities = detectReferralOpportunities(facts, referralReadiness);
  const referralRisks = detectReferralRisks(facts, referralReadiness);

  return {
    source: 'ReferralEngine',
    scope: 'user',
    confidence: referralScore > 0 ? 'derived' : 'fallback',
    fallback: referralScore > 0 ? 'none' : 'no_referral_readiness_signals',
    generatedAt: facts.generatedAt,
    businessMode: facts.businessMode,
    referralReadiness,
    referralScore,
    referralOpportunities,
    referralRisks,
    nextReferralMilestone: nextReferralMilestoneFor(facts, referralReadiness, referralOpportunities[0] ?? null),
    signals: {
      valueRealizationScore: facts.valueProjection.valueRealizationScore,
      expansionScore: facts.expansionProjection.expansionScore,
      retentionScore: facts.retentionProjection.retentionScore,
      recentWins: recentWinCount(facts),
      missionCompletionConsistency: missionConsistency(facts),
      customerSatisfactionSignals: customerSatisfactionSignals(facts),
      referralInvitesCreated: facts.referralInvitesCreated,
      referralInvitesUsed: facts.referralInvitesUsed,
      referralLeads: facts.referralLeads,
      referredMembers: facts.referredMembers,
    },
    kpis: {
      referralRate: facts.referralInvitesCreated > 0 || facts.referralLeads > 0 || facts.referredMembers > 0 ? 100 : 0,
      referralConversionRate: referralConversionRate(facts),
      advocateRate: isAdvocacyReady(referralReadiness) ? 100 : 0,
    },
  };
}
