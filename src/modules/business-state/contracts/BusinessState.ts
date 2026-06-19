import type { BusinessBottleneck } from './BusinessBottleneck';
import type { BusinessOpportunity } from './BusinessOpportunity';
import type { BusinessStage } from './BusinessStage';
import type { ReadinessScore } from './ReadinessScore';

export interface BusinessState {
  stage: BusinessStage;
  readiness: ReadinessScore;
  bottlenecks: BusinessBottleneck[];
  opportunities: BusinessOpportunity[];
}
