import type { AutonomousExecutionAction } from '../contracts/AutonomousExecution';

export function shouldAutoExecute(action: AutonomousExecutionAction): boolean {
  return action.executionMode === 'autonomous' && !action.requiresApproval;
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
