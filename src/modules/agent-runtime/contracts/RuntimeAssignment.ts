import type { AgentId } from '@/modules/ai/types/agents';
import type { RuntimeAuthorityScope, RuntimeConfidence } from './RuntimeLifecycle';

export type RuntimeAssignmentBasis =
  | 'coo_assignment'
  | 'direct_agent_request'
  | 'explicit_goal_request'
  | 'default_stage_fallback';

export type RuntimeExecutionMode =
  | 'single_agent'
  | 'multi_agent'
  | 'advisory_only';

export interface RuntimeAssignment {
  source: string;
  scope: RuntimeAuthorityScope;
  confidence: RuntimeConfidence;
  fallback: string | 'none';

  assignmentId: string;
  sourceAssignmentId?: string;
  basis: RuntimeAssignmentBasis;
  objective: string;
  selectedAgents: AgentId[];
  executionMode: RuntimeExecutionMode;
  branchPreserved: boolean;
  reasoning: string[];
}
