import type { AgentExecutionReport, WorkforceState } from '@/modules/ai/types/agents';
import type { RuntimeExecution } from '../contracts/RuntimeExecution';
import type { RuntimeResult } from '../contracts/RuntimeResult';
import type { RuntimeState } from '../contracts/RuntimeState';

export interface WorkforceViewModel extends WorkforceState {
  reports: AgentExecutionReport[];
  pendingAssignments: RuntimeState['pendingAssignments'];
}

function toWorkforceHealth(health: RuntimeState['health']): WorkforceState['health'] {
  if (health === 'blocked') return 'attention';
  return health;
}

function toActiveExecution(execution: RuntimeExecution): WorkforceState['active'][number] | null {
  const [agent] = execution.assignment.selectedAgents;
  if (!agent) return null;

  return {
    agent,
    objective: execution.objective,
    startedAt: execution.lifecycle.startedAt ?? execution.lifecycle.queuedAt,
  };
}

function toAgentExecutionReports(result: RuntimeResult): AgentExecutionReport[] {
  return result.agentResults.map((agentResult) => ({
    agent: agentResult.agentId,
    objective: agentResult.objective,
    findings: agentResult.findings,
    recommendations: agentResult.recommendations,
    actions: agentResult.actions.map((action) => ({
      description: action.description,
      module: action.module,
      route: action.route,
    })),
    confidenceScore: agentResult.confidenceScore,
    executedAt: agentResult.completedAt || result.completedAt,
  }));
}

export function toWorkforceViewModel(runtimeState: RuntimeState): WorkforceViewModel {
  const reports = runtimeState.recentResults.flatMap(toAgentExecutionReports);

  return {
    available: runtimeState.availableAgents,
    recommended: runtimeState.recommendedAgents,
    active: runtimeState.activeExecutions
      .map(toActiveExecution)
      .filter((execution): execution is WorkforceState['active'][number] => execution !== null),
    recentReports: [],
    health: toWorkforceHealth(runtimeState.health),
    reports,
    pendingAssignments: runtimeState.pendingAssignments,
  };
}
