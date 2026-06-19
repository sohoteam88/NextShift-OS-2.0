import type { GrowthLoopState } from '../contracts/GrowthLoopState';

export function calculateGrowthScore(state: GrowthLoopState): number {
  const acquisitionWeight = 0.3;
  const activationWeight = 0.2;
  const retentionWeight = 0.2;
  const referralWeight = 0.15;
  const expansionWeight = 0.15;

  return Math.round(
    (state.acquisition.score * acquisitionWeight)
    + (state.activation.score * activationWeight)
    + (state.retention.score * retentionWeight)
    + (state.referral.score * referralWeight)
    + (state.expansion.score * expansionWeight),
  );
}
