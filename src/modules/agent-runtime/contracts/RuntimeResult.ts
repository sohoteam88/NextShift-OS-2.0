import type { AgentId } from '@/modules/ai/types/agents';
import type { RuntimeAuthorityScope, RuntimeConfidence, RuntimeLifecycleStatus } from './RuntimeLifecycle';

export interface RuntimeAction {
  description: string;
  module: string;
  route?: string;
}

export interface RuntimeAgentResult {
  agentId: AgentId;
  objective: string;
  findings: string[];
  recommendations: string[];
  actions: RuntimeAction[];
  confidenceScore: number;
  startedAt?: string;
  completedAt: string;
  error?: string;
}

export interface RuntimeResult {
  source: string;
  scope: RuntimeAuthorityScope;
  confidence: RuntimeConfidence;
  fallback: string | 'none';

  executionId: string;
  status: RuntimeLifecycleStatus;
  summary: string;
  agentResults: RuntimeAgentResult[];
  recommendedActions: Array<{
    priority: number;
    action: string;
    agentId: AgentId;
    route?: string;
  }>;
  overallConfidence: number;
  errors: string[];
  completedAt: string;
}
