import type { PlanTier } from '@/modules/ai-router/types';
import type { FeatureKey } from '@/modules/saas/types';

export type AgentId = 'brand_strategist' | 'content_director' | 'video_producer' | 'funnel_architect' | 'traffic_strategist' | 'sales_coach' | 'crm_manager' | 'ceo_advisor';

export interface AgentDefinition {
  id: AgentId;
  name: string;
  description: string;
  capabilities: string[];
  allowedActions: string[];
  requiredFeatures: FeatureKey[];
  requiredPlan: PlanTier;
  dependencies: string[];
  emoji: string;
}

export interface AgentExecutionInput {
  agentId: AgentId;
  userId: string;
  tenantId: string;
  objective: string;
  context?: Record<string, unknown>;
}

export interface AgentExecutionReport {
  agent: AgentId;
  objective: string;
  findings: string[];
  recommendations: string[];
  actions: Array<{ description: string; route?: string; module: string }>;
  confidenceScore: number;
  executedAt: string;
}

export interface MultiAgentReport {
  summary: string;
  agents: AgentExecutionReport[];
  recommendedActions: Array<{ priority: number; action: string; agent: AgentId }>;
  overallConfidence: number;
}

export interface WorkforceState {
  available: AgentId[];
  recommended: AgentId[];
  active: Array<{ agent: AgentId; objective: string; startedAt: string }>;
  recentReports: AgentExecutionReport[];
  health: 'optimal' | 'good' | 'attention';
}
