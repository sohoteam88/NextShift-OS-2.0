import type { COOAssignment } from './COOAssignment';
import type { AICOODecision } from './AICOODecision';
import type { COODelegation } from './COODelegation';
import type {
  COOAuthorityScope,
  COOConfidence,
  COOPlanningHorizon,
  COORecommendation,
} from './COORecommendation';

export interface COOPlan {
  source: string;
  scope: COOAuthorityScope;
  confidence: COOConfidence;
  fallback: string | 'none';

  id: string;
  subjectId: string;
  generatedAt: string;
  horizon: COOPlanningHorizon;
  strategicFocus: string;
  decision: AICOODecision;
  recommendations: COORecommendation[];
  assignments: COOAssignment[];
  delegations: COODelegation[];
}
