import type { ReferralReadiness } from '../contracts/ReferralProjection';
import type { ReferralFacts } from './referral-facts';
import { customerSatisfactionSignals, missionConsistency, recentWinCount } from './referral-facts';

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateReferralScore(facts: ReferralFacts) {
  const valueScore = facts.valueProjection.valueRealizationScore * 0.25;
  const expansionScore = facts.expansionProjection.expansionScore * 0.2;
  const retentionScore = facts.retentionProjection.retentionScore * 0.2;
  const winScore = Math.min(recentWinCount(facts) * 4, 12);
  const consistencyScore = missionConsistency(facts) * 0.1;
  const satisfactionScore = Math.min(customerSatisfactionSignals(facts) * 6, 8);
  const existingReferralScore = Math.min((facts.referralInvitesUsed + facts.referralLeads + facts.referredMembers) * 5, 10);

  return clamp(valueScore + expansionScore + retentionScore + winScore + consistencyScore + satisfactionScore + existingReferralScore);
}

export function referralReadinessFor(score: number, facts: ReferralFacts): ReferralReadiness {
  const existingReferralResult = facts.referralInvitesUsed > 0 || facts.referralLeads > 0 || facts.referredMembers > 0;
  if (facts.valueProjection.valueRisk !== 'low' && !existingReferralResult) return 'not_ready';

  if (score >= 85 || facts.referralInvitesUsed >= 5 || facts.referredMembers >= 3) return 'champion';
  if (score >= 70 || facts.referralInvitesUsed >= 2 || facts.referralLeads >= 3) return 'advocate';
  if (score >= 55 && facts.valueProjection.valueRisk === 'low') return 'ready';
  if (score >= 35 || facts.valueProjection.valueRealizationScore >= 50) return 'potential';
  return 'not_ready';
}
