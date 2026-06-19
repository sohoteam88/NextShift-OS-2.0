import type { AgentExecutionReport, MultiAgentReport } from '@/modules/ai/types/agents';
import type { RuntimeAgentResult, RuntimeResult } from '../contracts/RuntimeResult';

function executionIdFromReport(report: AgentExecutionReport, index = 0): string {
  return `runtime-result-${report.agent}-${report.executedAt}-${index}`;
}

function toRuntimeAgentResult(report: AgentExecutionReport): RuntimeAgentResult {
  return {
    agentId: report.agent,
    objective: report.objective,
    findings: report.findings,
    recommendations: report.recommendations,
    actions: report.actions.map((action) => ({
      description: action.description,
      module: action.module,
      route: action.route,
    })),
    confidenceScore: report.confidenceScore,
    completedAt: report.executedAt,
  };
}

export function adaptAgentExecutionReport(
  report: AgentExecutionReport,
  executionId = executionIdFromReport(report),
): RuntimeResult {
  return {
    source: 'AgentExecutionReport',
    scope: 'user',
    confidence: 'derived',
    fallback: 'none',

    executionId,
    status: 'completed',
    summary: `${report.agent} completed ${report.objective}`,
    agentResults: [toRuntimeAgentResult(report)],
    recommendedActions: report.actions.map((action, index) => ({
      priority: index + 1,
      action: action.description,
      agentId: report.agent,
      route: action.route,
    })),
    overallConfidence: report.confidenceScore,
    errors: [],
    completedAt: report.executedAt,
  };
}

export function adaptMultiAgentReport(
  report: MultiAgentReport,
  executionId: string,
  completedAt = new Date().toISOString(),
): RuntimeResult {
  return {
    source: 'MultiAgentReport',
    scope: 'user',
    confidence: 'derived',
    fallback: 'none',

    executionId,
    status: 'completed',
    summary: report.summary,
    agentResults: report.agents.map(toRuntimeAgentResult),
    recommendedActions: report.recommendedActions.map((action) => ({
      priority: action.priority,
      action: action.action,
      agentId: action.agent,
    })),
    overallConfidence: report.overallConfidence,
    errors: [],
    completedAt,
  };
}
