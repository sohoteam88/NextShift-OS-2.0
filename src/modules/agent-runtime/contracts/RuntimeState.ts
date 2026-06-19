import type { AgentId } from '@/modules/ai/types/agents';
import type { RuntimeAssignment } from './RuntimeAssignment';
import type { RuntimeExecution } from './RuntimeExecution';
import type { RuntimeAuthorityScope, RuntimeConfidence } from './RuntimeLifecycle';
import type { RuntimeResult } from './RuntimeResult';

export type RuntimeHealth = 'optimal' | 'good' | 'attention' | 'blocked';

export interface RuntimeState {
  source: string;
  scope: RuntimeAuthorityScope;
  confidence: RuntimeConfidence;
  fallback: string | 'none';

  userId: string;
  tenantId: string;
  availableAgents: AgentId[];
  recommendedAgents: AgentId[];
  activeExecutions: RuntimeExecution[];
  recentResults: RuntimeResult[];
  pendingAssignments: RuntimeAssignment[];
  health: RuntimeHealth;
  generatedAt: string;
}
