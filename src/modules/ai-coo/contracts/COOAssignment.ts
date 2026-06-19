import type { AgentId } from '@/modules/ai/types/agents';
import type { COOAuthorityScope, COOConfidence } from './COORecommendation';

export type COOAssignmentBasis =
  | 'journey_stage'
  | 'explicit_goal'
  | 'business_opportunity';

export type COOAssignmentExecutionMode =
  | 'single_agent'
  | 'multi_agent'
  | 'advisory_only';

export interface COOAssignment {
  source: string;
  scope: COOAuthorityScope;
  confidence: COOConfidence;
  fallback: string | 'none';

  id: string;
  basis: COOAssignmentBasis;
  objective: string;
  recommendedAgents: AgentId[];
  reasoning: string[];
  executionMode: COOAssignmentExecutionMode;
  contextSource: string;
}
