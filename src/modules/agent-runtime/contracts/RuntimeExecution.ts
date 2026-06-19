import type { RuntimeAssignment } from './RuntimeAssignment';
import type { RuntimeLifecycle } from './RuntimeLifecycle';
import type { RuntimeResult } from './RuntimeResult';

export type RuntimeExecutionTrigger =
  | 'user_request'
  | 'coo_plan'
  | 'journey_stage'
  | 'system_fallback';

export type RuntimeExecutionBranch =
  | 'goal_multi'
  | 'direct_agent'
  | 'default_recommended_agents'
  | 'coo_assignment_plan';

export interface RuntimeExecution {
  source: string;
  scope: RuntimeLifecycle['scope'];
  confidence: RuntimeLifecycle['confidence'];
  fallback: string | 'none';

  executionId: string;
  userId: string;
  tenantId: string;
  trigger: RuntimeExecutionTrigger;
  branch: RuntimeExecutionBranch;
  objective: string;
  assignment: RuntimeAssignment;
  lifecycle: RuntimeLifecycle;
  result?: RuntimeResult;
}
