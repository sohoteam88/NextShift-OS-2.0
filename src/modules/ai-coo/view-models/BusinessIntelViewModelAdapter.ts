import type { AgentId } from '@/modules/ai/types/agents';
import type { CEOReport, NextBestAction } from '@/modules/business-intelligence/types';
import type { COOAssignment } from '../contracts/COOAssignment';
import type { COOPlan } from '../contracts/COOPlan';
import type { COORecommendation } from '../contracts/COORecommendation';

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function agentsFromAssignments(assignments: COOAssignment[]): string[] {
  return unique(assignments.flatMap((assignment) => assignment.recommendedAgents));
}

function fallbackAgentForRecommendation(
  recommendation: COORecommendation,
  fallbackAction: NextBestAction | undefined,
  assignmentAgents: string[],
): string {
  if (fallbackAction?.agentRecommended) return fallbackAction.agentRecommended;

  const domainAgent: Partial<Record<COORecommendation['domain'], AgentId>> = {
    brand: 'brand_strategist',
    content: 'content_director',
    traffic: 'traffic_strategist',
    funnel: 'funnel_architect',
    crm: 'crm_manager',
    sales: 'sales_coach',
    operations: 'ceo_advisor',
    team: 'ceo_advisor',
  };

  return assignmentAgents[0] ?? domainAgent[recommendation.domain] ?? 'ceo_advisor';
}

function toAction(
  recommendation: COORecommendation,
  index: number,
  assignmentAgents: string[],
  fallbackAction: NextBestAction | undefined,
): NextBestAction {
  return {
    priority: fallbackAction?.priority ?? index + 1,
    action: recommendation.title,
    expectedImpact: recommendation.expectedOutcome || recommendation.summary,
    agentRecommended: fallbackAgentForRecommendation(recommendation, fallbackAction, assignmentAgents),
    route: recommendation.relatedRoute ?? fallbackAction?.route,
  };
}

export function toBusinessIntelViewModel(plan: COOPlan, fallback: CEOReport): CEOReport {
  const assignmentAgents = agentsFromAssignments(plan.assignments);
  const actions = plan.recommendations.length > 0
    ? plan.recommendations.map((recommendation, index) => (
      toAction(recommendation, index, assignmentAgents, fallback.actions[index])
    ))
    : fallback.actions;

  return {
    summary: fallback.summary,
    health: fallback.health,
    bottlenecks: fallback.bottlenecks,
    opportunities: fallback.opportunities,
    actions,
    risks: fallback.risks,
    forecast: fallback.forecast,
    agentRecommendations: assignmentAgents.length > 0 ? assignmentAgents : fallback.agentRecommendations,
    automationRecommendations: fallback.automationRecommendations,
  };
}
