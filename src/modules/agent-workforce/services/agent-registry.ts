import type { AutonomousActionType } from '@/modules/autonomous-execution/contracts/AutonomousExecution';
import type { WorkforceAgentDefinition, WorkforceAgentType } from '../contracts/AgentWorkforce';

export const WORKFORCE_AGENT_REGISTRY: Record<WorkforceAgentType, WorkforceAgentDefinition> = {
  coo_agent: {
    agentType: 'coo_agent',
    runtimeAgentId: 'ceo_advisor',
    name: 'COO Agent',
    capabilities: ['strategy', 'prioritization', 'focus selection'],
    supportedActions: ['REPORT_GENERATION', 'TASK_CREATION'],
    priority: 100,
    availability: 'available',
  },
  content_agent: {
    agentType: 'content_agent',
    runtimeAgentId: 'content_director',
    name: 'Content Agent',
    capabilities: ['content planning', 'content generation', 'caption generation', 'content calendar'],
    supportedActions: ['CONTENT_GENERATION'],
    priority: 80,
    availability: 'available',
  },
  lead_magnet_agent: {
    agentType: 'lead_magnet_agent',
    runtimeAgentId: 'funnel_architect',
    name: 'Lead Magnet Agent',
    capabilities: ['lead magnet creation', 'PDF planning', 'checklist generation', 'guide generation'],
    supportedActions: ['LEAD_MAGNET_GENERATION'],
    priority: 90,
    availability: 'available',
  },
  funnel_agent: {
    agentType: 'funnel_agent',
    runtimeAgentId: 'funnel_architect',
    name: 'Funnel Agent',
    capabilities: ['funnel architecture', 'funnel optimization', 'funnel analysis'],
    supportedActions: ['FUNNEL_GENERATION'],
    priority: 85,
    availability: 'available',
  },
  landing_page_agent: {
    agentType: 'landing_page_agent',
    runtimeAgentId: 'funnel_architect',
    name: 'Landing Page Agent',
    capabilities: ['page structure', 'copy generation', 'conversion optimization'],
    supportedActions: ['LANDING_PAGE_GENERATION'],
    priority: 84,
    availability: 'available',
  },
  traffic_agent: {
    agentType: 'traffic_agent',
    runtimeAgentId: 'traffic_strategist',
    name: 'Traffic Agent',
    capabilities: ['campaign preparation', 'audience targeting', 'traffic recommendations'],
    supportedActions: [],
    priority: 70,
    availability: 'limited',
  },
  analytics_agent: {
    agentType: 'analytics_agent',
    runtimeAgentId: 'ceo_advisor',
    name: 'Analytics Agent',
    capabilities: ['KPI analysis', 'bottleneck detection', 'growth reporting'],
    supportedActions: ['REPORT_GENERATION'],
    priority: 75,
    availability: 'available',
  },
  crm_agent: {
    agentType: 'crm_agent',
    runtimeAgentId: 'crm_manager',
    name: 'CRM Agent',
    capabilities: ['lead management', 'segmentation', 'follow-up workflows'],
    supportedActions: ['CRM_UPDATE'],
    priority: 78,
    availability: 'available',
  },
  offer_agent: {
    agentType: 'offer_agent',
    runtimeAgentId: 'ceo_advisor',
    name: 'Offer Agent',
    capabilities: ['offer review', 'objection analysis', 'pricing suggestions'],
    supportedActions: ['TASK_CREATION'],
    priority: 76,
    availability: 'available',
  },
  sop_generator_agent: {
    agentType: 'sop_generator_agent',
    runtimeAgentId: 'ceo_advisor',
    name: 'SOP Generator Agent',
    capabilities: ['SOP generation', 'process documentation', 'handoff planning'],
    supportedActions: ['TASK_CREATION'],
    priority: 72,
    availability: 'available',
  },
};

export function getWorkforceAgents(): WorkforceAgentDefinition[] {
  return Object.values(WORKFORCE_AGENT_REGISTRY).sort((a, b) => b.priority - a.priority);
}

export function getAgentsForAction(actionType: AutonomousActionType): WorkforceAgentDefinition[] {
  return getWorkforceAgents().filter((agent) => (
    agent.availability !== 'offline' && agent.supportedActions.includes(actionType)
  ));
}
