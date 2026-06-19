import type { CEOReport } from '@/modules/business-intelligence/types';
import type { AgentId } from '@/modules/ai/types/agents';
import { agentManager } from '@/modules/ai/services/agent-manager';
import { AGENT_REGISTRY, getAgentsForMissionStage, getAgentsForPlan } from '@/modules/ai/services/agent-registry';
import type { COOAssignment } from '../contracts/COOAssignment';
import type { COORecommendation } from '../contracts/COORecommendation';

export type AssignmentAdapterInput = {
  userId: string;
  tenantId: string;
  plan: string;
  currentStage: string;
  explicitGoal?: string;
  ceoReport?: CEOReport;
  businessRecommendations?: COORecommendation[];
};

function isAgentId(value: string): value is AgentId {
  return value in AGENT_REGISTRY;
}

function uniqueAgents(values: string[]): AgentId[] {
  return Array.from(new Set(values.filter(isAgentId)));
}

function selectGoalAgentsWithoutExecution(goal: string, plan: string): AgentId[] {
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

export async function adaptJourneyStageAssignments(input: AssignmentAdapterInput): Promise<COOAssignment[]> {
  const stageAgents = getAgentsForMissionStage(input.currentStage);
  const planSafeAgents = await agentManager.getRecommendedAgents(input.currentStage, input.plan);

  return [
    {
      source: 'getAgentsForMissionStage',
      scope: 'user',
      confidence: stageAgents.length > 0 ? 'derived' : 'fallback',
      fallback: stageAgents.length > 0 ? 'none' : 'no-stage-agent-match',

      id: `assignment-stage-${input.currentStage}`,
      basis: 'journey_stage',
      objective: `Support current journey stage: ${input.currentStage}`,
      recommendedAgents: stageAgents,
      reasoning: [`Mapped current stage ${input.currentStage} through getAgentsForMissionStage.`],
      executionMode: stageAgents.length > 1 ? 'multi_agent' : 'single_agent',
      contextSource: input.currentStage,
    },
    {
      source: 'agentManager.getRecommendedAgents',
      scope: 'user',
      confidence: planSafeAgents.length > 0 ? 'derived' : 'fallback',
      fallback: planSafeAgents.length > 0 ? 'none' : 'no-plan-safe-agent-match',

      id: `assignment-stage-plan-${input.currentStage}`,
      basis: 'journey_stage',
      objective: `Support current journey stage within plan: ${input.currentStage}`,
      recommendedAgents: planSafeAgents,
      reasoning: [`Filtered stage agents by tenant plan ${input.plan}.`],
      executionMode: planSafeAgents.length > 1 ? 'multi_agent' : 'single_agent',
      contextSource: `${input.currentStage}:${input.plan}`,
    },
  ];
}

export function adaptExplicitGoalAssignment(input: AssignmentAdapterInput): COOAssignment[] {
  if (!input.explicitGoal) return [];

  const agents = selectGoalAgentsWithoutExecution(input.explicitGoal, input.plan);

  return [
    {
      source: 'workforce-orchestrator.orchestrateForGoal:planning',
      scope: 'user',
      confidence: agents.length > 0 ? 'derived' : 'fallback',
      fallback: agents.length > 0 ? 'none' : 'no-goal-agent-match',

      id: `assignment-goal-${input.explicitGoal.slice(0, 48)}`,
      basis: 'explicit_goal',
      objective: input.explicitGoal,
      recommendedAgents: agents,
      reasoning: ['Wrapped workforce-orchestrator goal selection semantics without executing agents.'],
      executionMode: agents.length > 1 ? 'multi_agent' : 'single_agent',
      contextSource: input.explicitGoal,
    },
  ];
}

export function adaptBusinessOpportunityAssignments(input: AssignmentAdapterInput): COOAssignment[] {
  if (input.businessRecommendations && input.businessRecommendations.length > 0) {
    const agents = uniqueAgents(input.businessRecommendations.flatMap((recommendation) => {
      const domainAgents: Partial<Record<COORecommendation['domain'], AgentId[]>> = {
        brand: ['brand_strategist'],
        content: ['content_director'],
        traffic: ['traffic_strategist'],
        funnel: ['funnel_architect'],
        crm: ['crm_manager'],
        sales: ['sales_coach'],
        operations: ['ceo_advisor'],
        team: ['ceo_advisor'],
      };

      return domainAgents[recommendation.domain] ?? [];
    }));

    if (agents.length === 0) return [];

    return [
      {
        source: 'business_state.recommendations',
        scope: 'user',
        confidence: input.businessRecommendations.some((item) => item.confidence === 'fallback') ? 'fallback' : 'derived',
        fallback: input.businessRecommendations.some((item) => item.fallback !== 'none') ? 'business_state_projection_fallback' : 'none',

        id: 'assignment-business-state-opportunity',
        basis: 'business_opportunity',
        objective: 'Support canonical Business State recommendations.',
        recommendedAgents: agents,
        reasoning: input.businessRecommendations.slice(0, 3).map((recommendation) => (
          `${recommendation.title}: ${recommendation.summary}`
        )),
        executionMode: agents.length > 1 ? 'multi_agent' : 'single_agent',
        contextSource: 'business_state',
      },
    ];
  }

  if (!input.ceoReport) return [];

  const actionAgents = input.ceoReport.actions.flatMap((action) => [action.agentRecommended]);
  const opportunityAgents = input.ceoReport.opportunities.flatMap((opportunity) => (
    opportunity.agentRecommended ? [opportunity.agentRecommended] : []
  ));
  const agents = uniqueAgents([...input.ceoReport.agentRecommendations, ...actionAgents, ...opportunityAgents]);

  if (agents.length === 0) return [];

  return [
    {
      source: 'ceoAdvisorEngine.agentRecommendations',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',

      id: 'assignment-business-opportunity',
      basis: 'business_opportunity',
      objective: 'Support CEO Advisor strategic business opportunities.',
      recommendedAgents: agents,
      reasoning: [
        input.ceoReport.summary,
        `Wrapped ${agents.length} CEO Advisor agent recommendation(s).`,
      ],
      executionMode: agents.length > 1 ? 'multi_agent' : 'single_agent',
      contextSource: 'fallback_ceo_advisor',
    },
  ];
}

export async function adaptAssignments(input: AssignmentAdapterInput): Promise<COOAssignment[]> {
  const [stageAssignments, goalAssignments, opportunityAssignments] = await Promise.all([
    adaptJourneyStageAssignments(input),
    Promise.resolve(adaptExplicitGoalAssignment(input)),
    Promise.resolve(adaptBusinessOpportunityAssignments(input)),
  ]);

  return [
    ...stageAssignments,
    ...goalAssignments,
    ...opportunityAssignments,
  ];
}
