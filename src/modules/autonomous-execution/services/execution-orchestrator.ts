import type { AutonomousExecutionAction } from '../contracts/AutonomousExecution';
import { isAutonomyEnabled } from './guardrail-engine';

export function shouldAutoExecute(action: AutonomousExecutionAction): boolean {
  if (!isAutonomyEnabled()) return false;
  if (action.guardrail && !action.guardrail.autonomousAllowed) return false;
  if (action.executionLevel === 'FORBIDDEN') return false;
  if (action.requiresApproval || action.approvalStatus === 'pending') return false;
  return action.executionMode === 'autonomous';
}

export function completedOutcomeFor(action: AutonomousExecutionAction): string {
  switch (action.actionType) {
    case 'TASK_CREATION':
      return 'Created execution task from AI COO decision.';
    case 'REPORT_GENERATION':
      return 'Generated execution readiness report.';
    case 'CRM_UPDATE':
      return 'Prepared CRM update from execution context.';
    default:
      return 'Execution completed.';
  }
}
