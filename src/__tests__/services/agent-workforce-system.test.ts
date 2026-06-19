import { describe, expect, it } from 'vitest';
import type { AutonomousExecutionAction } from '@/modules/autonomous-execution/contracts/AutonomousExecution';
import { getAgentsForAction } from '@/modules/agent-workforce/services/agent-registry';
import { routeActionToAgent } from '@/modules/agent-workforce/services/agent-router';
import { buildAgentPerformance } from '@/modules/agent-workforce/services/agent-performance-engine';

const leadMagnetAction: AutonomousExecutionAction = {
  actionId: 'exec-lead-magnet',
  decisionId: 'decision-1',
  actionType: 'LEAD_MAGNET_GENERATION',
  title: '创建第一个引流磁铁',
  reason: 'Prepare a lead magnet.',
  route: '/lead-magnet',
  priority: 'high',
  executionMode: 'assisted',
  requiresApproval: false,
  estimatedImpact: 'high',
  estimatedEffort: 'medium',
  successMetric: 'Capture the first qualified lead',
  state: 'queued',
  createdAt: '2026-06-19T00:00:00.000Z',
  updatedAt: '2026-06-19T00:00:00.000Z',
};

describe('AI-005 agent workforce system', () => {
  it('registers specialized agents by supported execution action', () => {
    const agents = getAgentsForAction('LEAD_MAGNET_GENERATION');

    expect(agents[0]).toMatchObject({
      agentType: 'lead_magnet_agent',
      runtimeAgentId: 'funnel_architect',
      availability: 'available',
    });
  });

  it('routes execution actions to replaceable specialized agents', () => {
    const assignment = routeActionToAgent(leadMagnetAction);

    expect(assignment).toMatchObject({
      assignmentId: 'workforce-exec-lead-magnet-lead_magnet_agent',
      agentType: 'lead_magnet_agent',
      runtimeAgentId: 'funnel_architect',
      status: 'assigned',
      priority: 'high',
    });
  });

  it('keeps approval-required actions out of executable assigned status', () => {
    const assignment = routeActionToAgent({
      ...leadMagnetAction,
      actionId: 'exec-funnel',
      actionType: 'FUNNEL_GENERATION',
      requiresApproval: true,
    });

    expect(assignment).toMatchObject({
      agentType: 'funnel_agent',
      status: 'approval_required',
    });
  });

  it('builds agent performance from completed and failed task results', () => {
    const performance = buildAgentPerformance([
      {
        assignmentId: 'assignment-1',
        actionId: 'exec-1',
        agentType: 'lead_magnet_agent',
        status: 'completed',
        output: {},
        confidence: 'medium',
        executionSummary: 'Done',
        completedAt: '2026-06-19T00:00:00.000Z',
      },
      {
        assignmentId: 'assignment-2',
        actionId: 'exec-2',
        agentType: 'lead_magnet_agent',
        status: 'failed',
        output: {},
        confidence: 'low',
        executionSummary: 'Failed',
        completedAt: '2026-06-19T01:00:00.000Z',
      },
    ]);

    expect(performance).toEqual([
      {
        agentType: 'lead_magnet_agent',
        completedTasks: 1,
        failedTasks: 1,
        successRate: 50,
      },
    ]);
  });
});
