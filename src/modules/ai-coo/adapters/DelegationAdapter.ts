import type { AgentId } from '@/modules/ai/types/agents';
import type { COOAssignment } from '../contracts/COOAssignment';
import type { COODelegatedAgent, COODelegation } from '../contracts/COODelegation';

function delegatedAgentsFromAssignment(assignment: COOAssignment): COODelegatedAgent[] {
  return assignment.recommendedAgents.map((agentId, index, agents) => ({
    agentId,
    role: index === 0 ? 'lead' : 'support',
    objective: assignment.objective,
    dependsOn: agents.slice(0, index) as AgentId[],
  }));
}

export function adaptDelegations(assignments: COOAssignment[]): COODelegation[] {
  return assignments
    .filter((assignment) => assignment.recommendedAgents.length > 0)
    .map((assignment) => ({
      source: `${assignment.source}:delegation-plan`,
      scope: assignment.scope,
      confidence: assignment.confidence,
      fallback: assignment.fallback,

      id: `delegation-${assignment.id}`,
      assignmentId: assignment.id,
      objective: assignment.objective,
      executionMode: assignment.executionMode,
      status: 'planned',
      agents: delegatedAgentsFromAssignment(assignment),
      reviewRequired: assignment.executionMode !== 'advisory_only',
      handoffNotes: [
        'Delegation is planning-only.',
        'Agent Runtime still owns execution dispatch and tool invocation.',
      ],
    }));
}
