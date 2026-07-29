import prisma from '@/lib/prisma';
import { createAudit, runAuditBestEffort } from '@/lib/audit-log-writer';
import { autonomousExecutionEngine } from '@/modules/autonomous-execution/services/autonomous-execution-engine';
import { executionQueue } from '@/modules/autonomous-execution/services/execution-queue';
import type {
  AgentWorkforceProjection,
  WorkforceAssignment,
  WorkforceExecutionResult,
} from '../contracts/AgentWorkforce';
import { getWorkforceAgents } from './agent-registry';
import { routeActionsToAgents } from './agent-router';
import { agentExecutionTracker } from './agent-execution-tracker';
import { buildAgentPerformance } from './agent-performance-engine';
import { WORKFORCE_AUDIT_ACTIONS } from './WorkforceOrchestrator';
import { assertTenantOperational } from '@/modules/tenant/services/tenant-operational-guard';

function confidenceFor(assignment: WorkforceAssignment): WorkforceExecutionResult['confidence'] {
  if (assignment.action.executionMode === 'autonomous') return 'high';
  if (assignment.action.executionMode === 'assisted') return 'medium';
  return 'low';
}

function buildResult(assignment: WorkforceAssignment): WorkforceExecutionResult {
  const completedAt = new Date().toISOString();

  if (assignment.status === 'approval_required') {
    return {
      assignmentId: assignment.assignmentId,
      actionId: assignment.actionId,
      agentType: assignment.agentType,
      status: 'approval_required',
      output: { approvalRequired: true, actionType: assignment.action.actionType },
      confidence: 'medium',
      executionSummary: `${assignment.agentType} is waiting for approval before executing ${assignment.action.actionType}.`,
      recommendedNextAction: 'Approve or reject the pending execution.',
      completedAt,
    };
  }

  return {
    assignmentId: assignment.assignmentId,
    actionId: assignment.actionId,
    agentType: assignment.agentType,
    status: 'completed',
    output: {
      actionType: assignment.action.actionType,
      title: assignment.action.title,
      route: assignment.action.route,
      successMetric: assignment.action.successMetric,
    },
    confidence: confidenceFor(assignment),
    executionSummary: `${assignment.agentType} completed ${assignment.action.actionType}: ${assignment.action.title}.`,
    recommendedNextAction: assignment.action.route ? `Review ${assignment.action.route}` : 'Review the generated deliverable.',
    completedAt,
  };
}

export const agentWorkforceService = {
  async getProjection(userId: string, tenantId?: string): Promise<AgentWorkforceProjection> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, tenantId: true },
    });

    if (!user) throw new Error('User not found');

    const resolvedTenantId = tenantId ?? user.tenantId;
    const [executionProjection, completedAgentTasks] = await Promise.all([
      autonomousExecutionEngine.getProjection(user.id, resolvedTenantId),
      agentExecutionTracker.list(user.id, resolvedTenantId),
    ]);
    const currentAssignments = routeActionsToAgents([
      ...executionProjection.pendingApprovals,
      ...executionProjection.queuedExecutions,
      ...(executionProjection.currentExecution ? [executionProjection.currentExecution] : []),
    ]).filter((assignment, index, array) => (
      array.findIndex((item) => item.assignmentId === assignment.assignmentId) === index
    ));

    return {
      activeAgents: getWorkforceAgents().filter((agent) => agent.availability !== 'offline'),
      completedAgentTasks: completedAgentTasks.slice(0, 10),
      agentPerformance: buildAgentPerformance(completedAgentTasks),
      currentAssignments,
    };
  },

  async executeAssignment(input: {
    userId: string;
    tenantId: string;
    assignmentId?: string;
    actionId?: string;
  }): Promise<WorkforceExecutionResult> {
    await assertTenantOperational(input.tenantId, 'claim');
    const projection = await this.getProjection(input.userId, input.tenantId);
    const assignment = projection.currentAssignments.find((item) => (
      item.assignmentId === input.assignmentId || item.actionId === input.actionId
    )) ?? projection.currentAssignments[0];

    if (!assignment) throw new Error('No workforce assignment available');

    const result = buildResult(assignment);

    if (result.status === 'completed') {
      await assertTenantOperational(input.tenantId, 'pre_side_effect');
      await runAuditBestEffort({
        operation: 'executeAssignmentAudit',
        tenantId: input.tenantId,
        actorId: input.userId,
        assignmentId: assignment.assignmentId,
      }, () => createAudit({
        tenantId: input.tenantId,
        actorId: input.userId,
        action: WORKFORCE_AUDIT_ACTIONS.assignmentStarted,
        targetType: 'agent_workforce',
        targetId: null,
        targetKey: assignment.assignmentId,
        metadata: {
          assignmentId: assignment.assignmentId,
          actionId: assignment.actionId,
          agentType: assignment.agentType,
        },
      }));
      if (assignment.action.state !== 'executing') {
        await executionQueue.transition({
          userId: input.userId,
          tenantId: input.tenantId,
          actionId: assignment.actionId,
          state: 'executing',
          outcome: `${assignment.agentType} started ${assignment.action.actionType}.`,
        });
      }
      await executionQueue.transition({
        userId: input.userId,
        tenantId: input.tenantId,
        actionId: assignment.actionId,
        state: 'completed',
        outcome: result.executionSummary,
      });
    }

    return agentExecutionTracker.record({
      userId: input.userId,
      tenantId: input.tenantId,
      result,
    });
  },
};
