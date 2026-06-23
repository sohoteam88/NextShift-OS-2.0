import { AppError } from '@/lib/errors';
import type { ExecutionState } from '../contracts/AutonomousExecution';

export type ExecutionTransition = {
  from: ExecutionState;
  to: ExecutionState;
};

export type ExecutionTransitionResult = ExecutionTransition & {
  allowed: boolean;
  result: 'allowed' | 'rejected';
};

const ALLOWED_TRANSITIONS: Record<ExecutionState, ExecutionState[]> = {
  queued: ['approved', 'executing', 'blocked', 'cancelled'],
  approved: ['executing', 'blocked', 'cancelled'],
  executing: ['completed', 'failed', 'blocked', 'cancelled'],
  blocked: ['queued', 'cancelled'],
  failed: ['queued', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function canTransition(input: ExecutionTransition): boolean {
  if (input.from === input.to) return false;
  return ALLOWED_TRANSITIONS[input.from]?.includes(input.to) ?? false;
}

export function validateExecutionTransition(input: ExecutionTransition): ExecutionTransitionResult {
  const allowed = canTransition(input);
  return {
    ...input,
    allowed,
    result: allowed ? 'allowed' : 'rejected',
  };
}

export function assertExecutionTransition(input: ExecutionTransition): ExecutionTransitionResult {
  const result = validateExecutionTransition(input);
  if (!result.allowed) {
    throw new AppError('INVALID_EXECUTION_TRANSITION', 409, 'Invalid execution state transition.', {
      from: input.from,
      to: input.to,
    });
  }

  return result;
}

export function isTerminalExecutionState(state: ExecutionState) {
  return state === 'completed' || state === 'cancelled';
}

export const executionStateMachine = {
  canTransition,
  validate: validateExecutionTransition,
  assert: assertExecutionTransition,
  isTerminal: isTerminalExecutionState,
};
