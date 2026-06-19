import type { AgentExecutionReport } from '@/modules/ai/types/agents';
import type { RuntimeLifecycle, RuntimeLifecycleStatus } from '../contracts/RuntimeLifecycle';

export type RuntimeLifecycleInput = {
  executionId: string;
  source?: string;
  status?: RuntimeLifecycleStatus;
  timestamp?: string;
  fallback?: string | 'none';
};

export function adaptRuntimeLifecycle(input: RuntimeLifecycleInput): RuntimeLifecycle {
  const timestamp = input.timestamp ?? new Date().toISOString();
  const status = input.status ?? 'completed';

  return {
    source: input.source ?? 'RuntimeLifecycleAdapter',
    scope: 'user',
    confidence: input.status ? 'derived' : 'fallback',
    fallback: input.fallback ?? (input.status ? 'none' : 'missing-durable-lifecycle-state'),

    executionId: input.executionId,
    status,
    reviewStatus: 'not_required',
    queuedAt: timestamp,
    startedAt: status === 'running' ? timestamp : undefined,
    completedAt: status === 'completed' ? timestamp : undefined,
    failedAt: status === 'failed' ? timestamp : undefined,
    cancelledAt: status === 'cancelled' ? timestamp : undefined,
    retryCount: 0,
    lastTransitionAt: timestamp,
  };
}

export function adaptLifecycleFromAgentReport(
  report: AgentExecutionReport,
  executionId: string,
): RuntimeLifecycle {
  return adaptRuntimeLifecycle({
    executionId,
    source: 'agentMemoryService.recall',
    status: 'completed',
    timestamp: report.executedAt,
    fallback: 'none',
  });
}
