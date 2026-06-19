import type { AgentId } from '@/modules/ai/types/agents';
import type { COOAssignmentExecutionMode } from './COOAssignment';
import type { COOAuthorityScope, COOConfidence } from './COORecommendation';

export type COODelegationStatus =
  | 'planned'
  | 'ready_for_review'
  | 'approved'
  | 'blocked';

export interface COODelegatedAgent {
  agentId: AgentId;
  role: string;
  objective: string;
  dependsOn: AgentId[];
}

export interface COODelegation {
  source: string;
  scope: COOAuthorityScope;
  confidence: COOConfidence;
  fallback: string | 'none';

  id: string;
  assignmentId: string;
  objective: string;
  executionMode: COOAssignmentExecutionMode;
  status: COODelegationStatus;
  agents: COODelegatedAgent[];
  reviewRequired: boolean;
  handoffNotes: string[];
}
