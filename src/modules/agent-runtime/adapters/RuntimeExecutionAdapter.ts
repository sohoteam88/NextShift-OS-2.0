import type { RuntimeAssignment } from '../contracts/RuntimeAssignment';
import type { RuntimeExecution, RuntimeExecutionBranch, RuntimeExecutionTrigger } from '../contracts/RuntimeExecution';
import type { RuntimeLifecycle } from '../contracts/RuntimeLifecycle';
import type { RuntimeResult } from '../contracts/RuntimeResult';

export type RuntimeExecutionAdapterInput = {
  userId: string;
  tenantId: string;
  objective: string;
  assignment: RuntimeAssignment;
  lifecycle: RuntimeLifecycle;
  result?: RuntimeResult;
  branch?: RuntimeExecutionBranch;
  trigger?: RuntimeExecutionTrigger;
};

export function adaptRuntimeExecution(input: RuntimeExecutionAdapterInput): RuntimeExecution {
  return {
    source: 'RuntimeExecutionAdapter',
    scope: 'user',
    confidence: 'derived',
    fallback: 'none',

    executionId: input.lifecycle.executionId,
    userId: input.userId,
    tenantId: input.tenantId,
    trigger: input.trigger ?? 'system_fallback',
    branch: input.branch ?? 'default_recommended_agents',
    objective: input.objective,
    assignment: input.assignment,
    lifecycle: input.lifecycle,
    result: input.result,
  };
}
