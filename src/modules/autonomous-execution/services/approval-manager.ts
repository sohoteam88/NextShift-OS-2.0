import type { AICOODecision } from '@/modules/ai-coo/contracts/AICOODecision';
import type { AutonomousActionType, ExecutionMode } from '../contracts/AutonomousExecution';
import { evaluateGuardrail } from './guardrail-engine';

export function requiresApproval(input: {
  actionType: AutonomousActionType;
  decision: AICOODecision;
}): boolean {
  return evaluateGuardrail({
    action: input.actionType,
    decision: input.decision,
  }).approvalRequired;
}

export function executionModeFor(input: {
  actionType: AutonomousActionType;
  decision: AICOODecision;
}): ExecutionMode {
  const guardrail = evaluateGuardrail({
    action: input.actionType,
    decision: input.decision,
  });

  if (!guardrail.allowed || guardrail.executionLevel === 'FORBIDDEN') return 'manual';
  if (guardrail.executionLevel === 'AUTONOMOUS') return 'autonomous';
  if (guardrail.executionLevel === 'APPROVAL_REQUIRED') return 'assisted';
  if (guardrail.executionLevel === 'GENERATE' || guardrail.executionLevel === 'PREPARE') return 'assisted';
  return 'manual';
}
