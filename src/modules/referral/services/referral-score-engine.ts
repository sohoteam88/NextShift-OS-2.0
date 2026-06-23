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
  const existingReferralScore = Math.min((facts.activatedReferrals * 6) + (facts.successfulReferrals * 8), 15);

  return clamp(valueScore + expansionScore + retentionScore + winScore + consistencyScore + satisfactionScore + existingReferralScore);
}

export function referralReadinessFor(score: number, facts: ReferralFacts): ReferralReadiness {
  const existingReferralResult = facts.activatedReferrals > 0 || facts.successfulReferrals > 0;
  if (facts.valueProjection.valueRisk !== 'low' && !existingReferralResult) return 'not_ready';
  if (!facts.retentionProjection.outcomeRetention.retained && !existingReferralResult) return 'not_ready';

  if (facts.successfulReferrals >= 5 || facts.activatedReferrals >= 8) return 'champion';
  if (facts.successfulReferrals >= 3 || facts.activatedReferrals >= 5) return 'ambassador';
  if (facts.activatedReferrals >= 1 || facts.successfulReferrals >= 1) return 'advocate';
  if (score >= 55 && facts.valueProjection.valueRisk === 'low' && facts.retentionProjection.outcomeRetention.retained) return 'ready';
  if (score >= 35 || facts.valueProjection.valueRealizationScore >= 50) return 'potential';
  return 'not_ready';
}
