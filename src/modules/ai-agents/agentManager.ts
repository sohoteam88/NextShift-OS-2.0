// Agent Manager — chooses and executes the right agent
import type { AgentId, AgentExecutionInput, AgentExecutionReport, WorkforceState } from './types';
import { getAgent, getAgentsForPlan, getAgentsForMissionStage } from './agentRegistry';

const AGENT_EXECUTORS: Record<AgentId, (input: AgentExecutionInput) => Promise<AgentExecutionReport>> = {
  brand_strategist: (i) => import('./agents/brandStrategistAgent').then(m => m.executeBrandStrategist(i)),
  content_director: (i) => import('./agents/contentDirectorAgent').then(m => m.executeContentDirector(i)),
  video_producer: (i) => import('./agents/videoProducerAgent').then(m => m.executeVideoProducer(i)),
  funnel_architect: (i) => import('./agents/funnelArchitectAgent').then(m => m.executeFunnelArchitect(i)),
  traffic_strategist: (i) => import('./agents/trafficStrategistAgent').then(m => m.executeTrafficStrategist(i)),
  sales_coach: (i) => import('./agents/salesCoachAgent').then(m => m.executeSalesCoach(i)),
  crm_manager: (i) => import('./agents/crmManagerAgent').then(m => m.executeCRMManager(i)),
  ceo_advisor: (i) => import('./agents/ceoAdvisorAgent').then(m => m.executeCEOAdvisor(i)),
};

export const agentManager = {
  getAvailableAgents(plan: string) {
    return getAgentsForPlan(plan);
  },

  async executeAgent(input: AgentExecutionInput): Promise<AgentExecutionReport> {
    const executor = AGENT_EXECUTORS[input.agentId];
    if (!executor) throw new Error(`Unknown agent: ${input.agentId}`);
    return executor(input);
  },

  async getRecommendedAgents(currentStage: string, plan: string): Promise<AgentId[]> {
    const stageAgents = getAgentsForMissionStage(currentStage);
    const available = getAgentsForPlan(plan).map(a => a.id);
    return stageAgents.filter(id => available.includes(id));
  },

  async getWorkforceState(userId: string, tenantId: string, plan: string, currentStage: string): Promise<WorkforceState> {
    const available = getAgentsForPlan(plan).map(a => a.id);
    const recommended = await this.getRecommendedAgents(currentStage, plan);
    return { available, recommended, active: [], recentReports: [], health: available.length > 4 ? 'optimal' : available.length > 2 ? 'good' : 'attention' };
  },

  async executeMultiAgent(agentIds: AgentId[], input: Omit<AgentExecutionInput, 'agentId'>): Promise<{ summary: string; agents: AgentExecutionReport[]; recommendedActions: Array<{ priority: number; action: string; agent: AgentId }>; overallConfidence: number }> {
    const reports: AgentExecutionReport[] = [];
    for (const agentId of agentIds) {
      const report = await this.executeAgent({ ...input, agentId });
      reports.push(report);
    }
    const allActions = reports.flatMap(r => r.actions.map(a => ({ action: a.description, agent: r.agent })));
    const uniqueActions = allActions.slice(0, 5);
    const avgConfidence = Math.round(reports.reduce((s, r) => s + r.confidenceScore, 0) / Math.max(reports.length, 1));
    return {
      summary: `${reports.length}个AI Agent已完成分析，发现${reports.flatMap(r => r.findings).length}个发现点。`,
      agents: reports,
      recommendedActions: uniqueActions.map((a, i) => ({ priority: i + 1, ...a })),
      overallConfidence: avgConfidence,
    };
  },
};
