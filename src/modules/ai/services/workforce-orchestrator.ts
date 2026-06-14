// Workforce Orchestrator — multi-agent workflows
import { agentManager } from './agent-manager';
import type { AgentId, AgentExecutionReport, MultiAgentReport } from '../types/agents';

export interface WorkflowGoal {
  objective: string;
  userId: string;
  tenantId: string;
}

/**
 * Predefined workflows for common business goals.
 * Each workflow chains agents in dependency order.
 */
export async function orchestrateForGoal(goal: WorkflowGoal, plan: string): Promise<MultiAgentReport> {
  const lower = goal.objective.toLowerCase();

  // Determine which agents to run based on goal keywords
  let agentIds: AgentId[] = [];

  if (lower.includes('lead') || lower.includes('客户') || lower.includes('销售') || lower.includes('成交')) {
    agentIds = ['brand_strategist', 'funnel_architect', 'traffic_strategist', 'sales_coach', 'crm_manager'] as AgentId[];
  } else if (lower.includes('内容') || lower.includes('content') || lower.includes('post')) {
    agentIds = ['brand_strategist', 'content_director', 'video_producer'] as AgentId[];
  } else if (lower.includes('品牌') || lower.includes('brand') || lower.includes('定位')) {
    agentIds = ['brand_strategist'] as AgentId[];
  } else if (lower.includes('视频') || lower.includes('video')) {
    agentIds = ['content_director', 'video_producer'] as AgentId[];
  } else if (lower.includes('流量') || lower.includes('traffic') || lower.includes('广告')) {
    agentIds = ['funnel_architect', 'traffic_strategist'] as AgentId[];
  } else if (lower.includes('收入') || lower.includes('revenue') || lower.includes('kpi') || lower.includes('分析')) {
    agentIds = ['crm_manager', 'ceo_advisor'] as AgentId[];
  } else {
    // Default: run all agents the user has access to
    const available = agentManager.getAvailableAgents(plan);
    agentIds = available.map(a => a.id).slice(0, 4) as AgentId[];
  }

  const input = { userId: goal.userId, tenantId: goal.tenantId, objective: goal.objective };
  const result = await agentManager.executeMultiAgent(agentIds, input);

  return {
    summary: result.summary,
    agents: result.agents,
    recommendedActions: result.recommendedActions.map(a => ({ priority: a.priority, action: a.action, agent: a.agent })),
    overallConfidence: result.overallConfidence,
  };
}
