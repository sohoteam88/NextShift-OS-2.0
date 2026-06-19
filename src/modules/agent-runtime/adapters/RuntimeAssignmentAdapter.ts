import type { AgentId } from '@/modules/ai/types/agents';
import { agentManager } from '@/modules/ai/services/agent-manager';
import { getAgentsForMissionStage, getAgentsForPlan } from '@/modules/ai/services/agent-registry';
import type { COOAssignment } from '@/modules/ai-coo/contracts/COOAssignment';
import type { RuntimeAssignment } from '../contracts/RuntimeAssignment';

export type RuntimeAssignmentInput = {
  currentStage: string;
  plan: string;
  objective?: string;
};

function executionModeForAgents(agents: AgentId[]): RuntimeAssignment['executionMode'] {
  if (agents.length === 0) return 'advisory_only';
  return agents.length > 1 ? 'multi_agent' : 'single_agent';
}

function selectGoalAgentsWithoutDispatch(goal: string, plan: string): AgentId[] {
  const lower = goal.toLowerCase();

  if (lower.includes('lead') || lower.includes('客户') || lower.includes('销售') || lower.includes('成交')) {
    return ['brand_strategist', 'funnel_architect', 'traffic_strategist', 'sales_coach', 'crm_manager'];
  }

  if (lower.includes('内容') || lower.includes('content') || lower.includes('post')) {
    return ['brand_strategist', 'content_director', 'video_producer'];
  }

  if (lower.includes('品牌') || lower.includes('brand') || lower.includes('定位')) {
    return ['brand_strategist'];
  }

  if (lower.includes('视频') || lower.includes('video')) {
    return ['content_director', 'video_producer'];
  }

  if (lower.includes('流量') || lower.includes('traffic') || lower.includes('广告')) {
    return ['funnel_architect', 'traffic_strategist'];
  }

  if (lower.includes('收入') || lower.includes('revenue') || lower.includes('kpi') || lower.includes('分析')) {
    return ['crm_manager', 'ceo_advisor'];
  }

  return getAgentsForPlan(plan).map((agent) => agent.id).slice(0, 4);
}

export async function adaptDefaultStageRuntimeAssignment(
  input: RuntimeAssignmentInput,
): Promise<RuntimeAssignment> {
  const stageAgents = getAgentsForMissionStage(input.currentStage);
  const selectedAgents = await agentManager.getRecommendedAgents(input.currentStage, input.plan);

  return {
    source: 'agentManager.getRecommendedAgents',
    scope: 'user',
    confidence: selectedAgents.length > 0 ? 'derived' : 'fallback',
    fallback: selectedAgents.length > 0 ? 'none' : 'no-plan-safe-stage-agent',

    assignmentId: `runtime-assignment-stage-${input.currentStage}`,
    basis: 'default_stage_fallback',
    objective: input.objective ?? `Support current runtime stage: ${input.currentStage}`,
    selectedAgents,
    executionMode: executionModeForAgents(selectedAgents),
    branchPreserved: true,
    reasoning: [
      `Stage agents from getAgentsForMissionStage: ${stageAgents.join(', ') || 'none'}.`,
      `Plan-safe runtime agents for ${input.plan}: ${selectedAgents.join(', ') || 'none'}.`,
    ],
  };
}

export function adaptCOOAssignmentRuntimeAssignment(assignment: COOAssignment): RuntimeAssignment {
  return {
    source: 'COOPlan.assignments',
    scope: assignment.scope,
    confidence: assignment.confidence,
    fallback: assignment.fallback,

    assignmentId: `runtime-${assignment.id}`,
    sourceAssignmentId: assignment.id,
    basis: 'coo_assignment',
    objective: assignment.objective,
    selectedAgents: assignment.recommendedAgents,
    executionMode: assignment.executionMode,
    branchPreserved: true,
    reasoning: [
      ...assignment.reasoning,
      `Consumed COO assignment from ${assignment.contextSource}.`,
    ],
  };
}

export function adaptDirectAgentRuntimeAssignment(agentId: AgentId, objective: string): RuntimeAssignment {
  return {
    source: 'direct-agent-request',
    scope: 'user',
    confidence: 'confirmed',
    fallback: 'none',

    assignmentId: `runtime-assignment-direct-${agentId}`,
    basis: 'direct_agent_request',
    objective,
    selectedAgents: [agentId],
    executionMode: 'single_agent',
    branchPreserved: true,
    reasoning: ['Preserves the current direct agent request branch.'],
  };
}

export function adaptExplicitGoalRuntimeAssignment(goal: string, plan: string): RuntimeAssignment {
  const selectedAgents = selectGoalAgentsWithoutDispatch(goal, plan);

  return {
    source: 'workforce-orchestrator.goal-selection:planning-only',
    scope: 'user',
    confidence: selectedAgents.length > 0 ? 'derived' : 'fallback',
    fallback: selectedAgents.length > 0 ? 'none' : 'no-goal-agent-match',

    assignmentId: `runtime-assignment-goal-${goal.slice(0, 48)}`,
    basis: 'explicit_goal_request',
    objective: goal,
    selectedAgents,
    executionMode: executionModeForAgents(selectedAgents),
    branchPreserved: true,
    reasoning: ['Mirrors current goal keyword selection without dispatching agents.'],
  };
}
