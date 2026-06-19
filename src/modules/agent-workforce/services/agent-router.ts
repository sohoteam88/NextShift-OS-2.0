import type { AutonomousExecutionAction } from '@/modules/autonomous-execution/contracts/AutonomousExecution';
import type { WorkforceAssignment } from '../contracts/AgentWorkforce';
import { WORKFORCE_AGENT_REGISTRY, getAgentsForAction } from './agent-registry';

function fallbackAgentFor(action: AutonomousExecutionAction) {
  if (action.actionType === 'CRM_UPDATE') return WORKFORCE_AGENT_REGISTRY.crm_agent;
  if (action.actionType === 'REPORT_GENERATION') return WORKFORCE_AGENT_REGISTRY.analytics_agent;
  if (action.actionType === 'TASK_CREATION') return WORKFORCE_AGENT_REGISTRY.coo_agent;
  return WORKFORCE_AGENT_REGISTRY.coo_agent;
}

export function routeActionToAgent(action: AutonomousExecutionAction): WorkforceAssignment {
  const candidates = getAgentsForAction(action.actionType);
  const selected = candidates[0] ?? fallbackAgentFor(action);

  return {
    assignmentId: `workforce-${action.actionId}-${selected.agentType}`,
    actionId: action.actionId,
    agentType: selected.agentType,
    runtimeAgentId: selected.runtimeAgentId,
    action,
    status: action.requiresApproval && action.state === 'queued' ? 'approval_required' : 'assigned',
    priority: action.priority,
    reason: `Assigned ${action.actionType} to ${selected.name}.`,
  };
}

export function routeActionsToAgents(actions: AutonomousExecutionAction[]): WorkforceAssignment[] {
  return actions
    .filter((action) => action.state === 'queued' || action.state === 'approved' || action.state === 'executing')
    .map(routeActionToAgent);
}
