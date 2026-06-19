import type { BusinessBottleneck } from '../contracts/BusinessBottleneck';
import type { BusinessOpportunity } from '../contracts/BusinessOpportunity';
import type { BusinessStage } from '../contracts/BusinessStage';
import type { ReadinessScore } from '../contracts/ReadinessScore';

export type BusinessStateSourceMetadata = {
  source: string;
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';
};

export type BusinessStateAdapterResult = BusinessStateSourceMetadata & {
  stage?: BusinessStage;
  readiness?: ReadinessScore;
  bottlenecks: BusinessBottleneck[];
  opportunities: BusinessOpportunity[];
};

export function createReadinessScore(
  metadata: BusinessStateSourceMetadata,
  score: number,
  maxScore = 100,
): ReadinessScore {
  const boundedScore = Math.max(0, Math.min(score, maxScore));
  return {
    ...metadata,
    score: boundedScore,
    maxScore,
    percentage: maxScore === 0 ? 0 : Math.round((boundedScore / maxScore) * 100),
  };
}
