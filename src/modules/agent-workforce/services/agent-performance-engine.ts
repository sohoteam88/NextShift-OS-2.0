import type { AgentPerformanceSummary, WorkforceAgentType, WorkforceExecutionResult } from '../contracts/AgentWorkforce';

export function buildAgentPerformance(results: WorkforceExecutionResult[]): AgentPerformanceSummary[] {
  const grouped = new Map<WorkforceAgentType, { completed: number; failed: number }>();

  for (const result of results) {
    const current = grouped.get(result.agentType) ?? { completed: 0, failed: 0 };
    if (result.status === 'completed') current.completed += 1;
    if (result.status === 'failed') current.failed += 1;
    grouped.set(result.agentType, current);
  }

  return Array.from(grouped.entries()).map(([agentType, stats]) => {
    const total = stats.completed + stats.failed;
    return {
      agentType,
      completedTasks: stats.completed,
      failedTasks: stats.failed,
      successRate: total === 0 ? 0 : Math.round((stats.completed / total) * 100),
    };
  });
}
