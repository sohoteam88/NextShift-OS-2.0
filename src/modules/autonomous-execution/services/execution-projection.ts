import type { AutonomousExecutionAction, ExecutionProjection } from '../contracts/AutonomousExecution';

function automationLevelFor(actions: AutonomousExecutionAction[]): ExecutionProjection['automationLevel'] {
  if (actions.some((action) => action.executionMode === 'autonomous')) return 'autonomous';
  if (actions.some((action) => action.executionMode === 'assisted')) return 'assisted';
  return 'manual';
}

export function buildExecutionProjection(actions: AutonomousExecutionAction[]): ExecutionProjection {
  const sorted = [...actions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const pendingApprovals = sorted.filter((action) => action.requiresApproval && action.state === 'queued');
  const completedExecutions = sorted.filter((action) => action.state === 'completed');
  const queuedExecutions = sorted.filter((action) => action.state === 'queued' && !action.requiresApproval);
  const currentExecution =
    sorted.find((action) => action.state === 'executing')
    ?? sorted.find((action) => action.state === 'approved')
    ?? pendingApprovals[0]
    ?? queuedExecutions[0]
    ?? completedExecutions[0]
    ?? null;

  return {
    currentExecution,
    pendingApprovals,
    completedExecutions: completedExecutions.slice(0, 5),
    queuedExecutions,
    automationLevel: automationLevelFor(sorted),
  };
}
