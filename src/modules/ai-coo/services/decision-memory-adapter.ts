import { businessMemoryEventStore } from '@/modules/business-context-memory/services/business-memory-event-store';
import type { WorkspaceContext } from '@/modules/workspace/types';
import type { AICOODecision } from '../contracts/AICOODecision';

export async function recordAICOODecision(input: {
  userId: string;
  tenantId: string;
  decision: AICOODecision;
  workspaceContext?: WorkspaceContext;
}) {
  return businessMemoryEventStore.appendOnce({
    type: 'COO_DECISION_MADE',
    tenantId: input.tenantId,
    userId: input.userId,
    title: input.decision.currentFocus,
    summary: input.decision.decisionReason,
    referenceId: input.decision.decisionId,
    metadata: {
      focusArea: input.decision.focusArea,
      priority: input.decision.priority,
      confidence: input.decision.confidence,
      recommendedMissionId: input.decision.recommendedMission.id,
      primaryRisk: input.decision.primaryRisk?.code,
      primaryOpportunity: input.decision.primaryOpportunity?.code,
      workspaceId: input.workspaceContext?.workspaceId,
      workspaceType: input.workspaceContext?.workspaceType,
      templateNamespace: input.workspaceContext?.templateNamespace,
    },
  });
}
