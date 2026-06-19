import type { AICOODecision } from '@/modules/ai-coo/contracts/AICOODecision';
import type { AutonomousActionType, AutonomousExecutionAction } from '../contracts/AutonomousExecution';
import { executionModeFor, requiresApproval } from './approval-manager';

function actionTypeFor(decision: AICOODecision): AutonomousActionType {
  const route = decision.nextBestAction.route ?? '';
  const title = decision.nextBestAction.title.toLowerCase();

  if (route.includes('lead-magnet') || title.includes('引流') || title.includes('lead magnet')) return 'LEAD_MAGNET_GENERATION';
  if (route.includes('funnel')) return 'FUNNEL_GENERATION';
  if (route.includes('content') || title.includes('内容') || title.includes('content')) return 'CONTENT_GENERATION';
  if (route.includes('crm') || route.includes('customers') || route.includes('leads')) return 'CRM_UPDATE';
  if (decision.focusArea === 'improve_conversion') return 'LANDING_PAGE_GENERATION';
  if (decision.focusArea === 're_engage_user') return 'TASK_CREATION';
  if (decision.focusArea === 'realize_value') return 'TASK_CREATION';
  if (decision.focusArea === 'scale_results') return 'TASK_CREATION';
  if (decision.focusArea === 'activate_advocacy') return 'TASK_CREATION';
  if (decision.focusArea === 'increase_consistency') return 'TASK_CREATION';
  if (decision.focusArea === 'build_authority') return 'CONTENT_GENERATION';
  if (decision.focusArea === 'launch_offer') return 'FUNNEL_GENERATION';
  return 'REPORT_GENERATION';
}

export function planExecutionAction(decision: AICOODecision, now: Date = new Date()): AutonomousExecutionAction {
  const actionType = actionTypeFor(decision);
  const createdAt = now.toISOString();
  const executionMode = executionModeFor({ actionType, decision });

  return {
    actionId: `exec-${decision.decisionId}-${actionType}`,
    decisionId: decision.decisionId,
    actionType,
    title: decision.nextBestAction.title,
    reason: decision.nextBestAction.reason,
    route: decision.nextBestAction.route,
    priority: decision.priority,
    executionMode,
    requiresApproval: requiresApproval({ actionType, decision }),
    estimatedImpact: decision.estimatedImpact,
    estimatedEffort: decision.estimatedEffort,
    successMetric: decision.successMetric,
    state: 'queued',
    createdAt,
    updatedAt: createdAt,
  };
}
