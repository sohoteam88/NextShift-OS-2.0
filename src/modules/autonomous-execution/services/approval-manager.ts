import type { AICOODecision } from '@/modules/ai-coo/contracts/AICOODecision';
import type { AutonomousActionType, ExecutionMode } from '../contracts/AutonomousExecution';

const HIGH_RISK_TYPES: AutonomousActionType[] = [
  'FUNNEL_GENERATION',
  'CRM_UPDATE',
];

export function requiresApproval(input: {
  actionType: AutonomousActionType;
  decision: AICOODecision;
}): boolean {
  if (HIGH_RISK_TYPES.includes(input.actionType) && input.decision.priority === 'high') return true;
  if (input.decision.focusArea === 'launch_offer' && input.decision.priority !== 'low') return true;
  if (input.decision.focusArea === 'generate_leads' && input.decision.primaryRisk?.code === 'traffic_missing') return false;
  return input.decision.priority === 'critical';
}

export function executionModeFor(input: {
  actionType: AutonomousActionType;
  decision: AICOODecision;
}): ExecutionMode {
  if (input.actionType === 'TASK_CREATION' || input.actionType === 'REPORT_GENERATION') return 'autonomous';
  if (input.actionType === 'CRM_UPDATE') return input.decision.priority === 'low' ? 'autonomous' : 'assisted';
  if (input.actionType === 'CONTENT_GENERATION' || input.actionType === 'LEAD_MAGNET_GENERATION') return 'assisted';
  if (input.actionType === 'LANDING_PAGE_GENERATION' || input.actionType === 'FUNNEL_GENERATION') return 'assisted';
  return 'manual';
}
