import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { AutonomousExecutionAction, ExecutionState } from '../contracts/AutonomousExecution';
import { executionStateMachine, type ExecutionTransitionResult } from './ExecutionStateMachine';

const TARGET_TYPE = 'autonomous_execution';

type QueueEventAction =
  | 'EXECUTION_QUEUED'
  | 'EXECUTION_APPROVED'
  | 'EXECUTION_REJECTED'
  | 'EXECUTION_EXECUTING'
  | 'EXECUTION_COMPLETED'
  | 'EXECUTION_FAILED'
  | 'EXECUTION_BLOCKED'
  | 'EXECUTION_CANCELLED';

type AgentExecutionAuditAction =
  | 'agent.execution.queued'
  | 'agent.execution.started'
  | 'agent.execution.completed'
  | 'agent.execution.failed'
  | 'agent.execution.blocked'
  | 'agent.execution.cancelled';

function metadataRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stateFor(action: QueueEventAction): ExecutionState {
  switch (action) {
    case 'EXECUTION_APPROVED':
      return 'approved';
    case 'EXECUTION_EXECUTING':
      return 'executing';
    case 'EXECUTION_COMPLETED':
      return 'completed';
    case 'EXECUTION_FAILED':
      return 'failed';
    case 'EXECUTION_BLOCKED':
      return 'blocked';
    case 'EXECUTION_REJECTED':
    case 'EXECUTION_CANCELLED':
      return 'cancelled';
    case 'EXECUTION_QUEUED':
    default:
      return 'queued';
  }
}

function actionFromMetadata(row: {
  action: string;
  metadata: Prisma.JsonValue;
  createdAt: Date;
}): AutonomousExecutionAction | null {
  const metadata = metadataRecord(row.metadata);
  const action = metadata.action;

  if (!action || typeof action !== 'object' || Array.isArray(action)) return null;

  return {
    ...(action as AutonomousExecutionAction),
    state: stateFor(row.action as QueueEventAction),
    updatedAt: row.createdAt.toISOString(),
    outcome: typeof metadata.outcome === 'string' ? metadata.outcome : (action as AutonomousExecutionAction).outcome,
  };
}

function agentAuditActionFor(action: QueueEventAction): AgentExecutionAuditAction {
  switch (action) {
    case 'EXECUTION_EXECUTING':
      return 'agent.execution.started';
    case 'EXECUTION_COMPLETED':
      return 'agent.execution.completed';
    case 'EXECUTION_FAILED':
      return 'agent.execution.failed';
    case 'EXECUTION_BLOCKED':
      return 'agent.execution.blocked';
    case 'EXECUTION_CANCELLED':
    case 'EXECUTION_REJECTED':
      return 'agent.execution.cancelled';
    case 'EXECUTION_QUEUED':
    case 'EXECUTION_APPROVED':
    default:
      return 'agent.execution.queued';
  }
}

async function writeTransitionAudit(input: {
  userId: string;
  tenantId: string;
  actionId: string;
  transition: ExecutionTransitionResult;
}) {
  await prisma.auditLog.create({
    data: {
      tenantId: input.tenantId,
      actorId: input.userId,
      action: input.transition.allowed
        ? 'execution.transition.allowed'
        : 'execution.transition.rejected',
      targetType: 'autonomous_execution_transition',
      metadata: {
        executionId: input.actionId,
        from: input.transition.from,
        to: input.transition.to,
        result: input.transition.result,
        timestamp: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  });
}

async function writeAgentExecutionAudit(input: {
  userId: string;
  tenantId: string;
  eventAction: QueueEventAction;
  action: AutonomousExecutionAction;
  outcome?: string;
}) {
  await prisma.auditLog.create({
    data: {
      tenantId: input.tenantId,
      actorId: input.userId,
      action: input.action.guardrail?.allowed === false
        ? 'agent.execution.blocked'
        : agentAuditActionFor(input.eventAction),
      targetType: 'autonomous_execution_audit',
      metadata: {
        executionId: input.action.actionId,
        agent: input.action.agentId,
        action: input.action.actionType,
        trigger: input.action.triggerType,
        risk: input.action.riskClass,
        result: input.outcome ?? input.action.outcome,
        assetIds: input.action.assetIds ?? [],
        executionLevel: input.action.executionLevel,
        approvalStatus: input.action.approvalStatus,
        startedAt: input.action.startedAt,
        completedAt: input.action.completedAt,
        timestamp: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  });
}

export const executionQueue = {
  async enqueue(input: {
    userId: string;
    tenantId: string;
    action: AutonomousExecutionAction;
  }): Promise<AutonomousExecutionAction> {
    const existing = await this.findAction(input.userId, input.tenantId, input.action.actionId);
    if (existing) return existing;
    const queueEventAction: QueueEventAction = input.action.state === 'cancelled'
      ? 'EXECUTION_CANCELLED'
      : 'EXECUTION_QUEUED';

    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        actorId: input.userId,
        action: queueEventAction,
        targetType: TARGET_TYPE,
        metadata: {
          actionId: input.action.actionId,
          decisionId: input.action.decisionId,
          guardrail: input.action.guardrail,
          executionLevel: input.action.executionLevel,
          approvalStatus: input.action.approvalStatus,
          risk: input.action.riskClass,
          outcome: input.action.outcome,
          action: input.action,
        } as Prisma.InputJsonValue,
      },
    });
    await writeAgentExecutionAudit({
      userId: input.userId,
      tenantId: input.tenantId,
      eventAction: queueEventAction,
      action: input.action,
      outcome: input.action.outcome,
    });
    if (input.action.state === 'cancelled' && input.action.guardrail) {
      await prisma.auditLog.create({
        data: {
          tenantId: input.tenantId,
          actorId: input.userId,
          action: 'agent.action.blocked',
          targetType: 'autonomous_guardrail',
          metadata: {
            actionId: input.action.actionId,
            decisionId: input.action.decisionId,
            guardrail: input.action.guardrail,
            executionLevel: input.action.executionLevel,
            approvalStatus: input.action.approvalStatus,
            risk: input.action.riskClass,
            affectedResources: input.action.guardrail.affectedResources,
            outcome: input.action.outcome,
          } as Prisma.InputJsonValue,
        },
      });
    }

    return input.action;
  },

  async transition(input: {
    userId: string;
    tenantId: string;
    actionId: string;
    state: ExecutionState;
    outcome?: string;
    assetIds?: string[];
  }): Promise<AutonomousExecutionAction | null> {
    const current = await this.findAction(input.userId, input.tenantId, input.actionId);
    if (!current) return null;
    const transition = executionStateMachine.validate({
      from: current.state,
      to: input.state,
    });
    await writeTransitionAudit({
      userId: input.userId,
      tenantId: input.tenantId,
      actionId: input.actionId,
      transition,
    });
    executionStateMachine.assert({
      from: current.state,
      to: input.state,
    });

    const eventAction: Record<ExecutionState, QueueEventAction> = {
      queued: 'EXECUTION_QUEUED',
      approved: 'EXECUTION_APPROVED',
      executing: 'EXECUTION_EXECUTING',
      completed: 'EXECUTION_COMPLETED',
      failed: 'EXECUTION_FAILED',
      blocked: 'EXECUTION_BLOCKED',
      cancelled: 'EXECUTION_CANCELLED',
    };
    const transitioned: AutonomousExecutionAction = {
      ...current,
      state: input.state,
      approvalStatus: input.state === 'approved'
        ? 'approved'
        : input.state === 'queued' && current.state === 'blocked' && current.requiresApproval
          ? 'approved'
          : input.state === 'queued'
            ? 'not_required'
        : input.state === 'cancelled' && current.requiresApproval
          ? 'rejected'
          : input.state === 'blocked'
            ? 'blocked'
            : current.approvalStatus,
      guardrail: current.guardrail
        ? {
            ...current.guardrail,
            approvalStatus: input.state === 'approved'
              ? 'approved'
              : input.state === 'queued' && current.state === 'blocked' && current.requiresApproval
                ? 'approved'
                : input.state === 'queued'
                  ? 'not_required'
              : input.state === 'cancelled' && current.requiresApproval
                ? 'rejected'
                : input.state === 'blocked'
                  ? 'blocked'
                  : current.guardrail.approvalStatus,
            approvedBy: input.state === 'approved' ? input.userId : current.guardrail.approvedBy,
          }
        : current.guardrail,
      outcome: input.outcome ?? current.outcome,
      assetIds: input.assetIds ?? current.assetIds,
      updatedAt: new Date().toISOString(),
      startedAt: input.state === 'queued' ? undefined : input.state === 'executing' ? new Date().toISOString() : current.startedAt,
      completedAt: input.state === 'completed' || input.state === 'failed' || input.state === 'cancelled' || input.state === 'blocked'
        ? new Date().toISOString()
        : input.state === 'queued'
          ? null
        : current.completedAt,
    };

    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        actorId: input.userId,
        action: eventAction[input.state],
        targetType: TARGET_TYPE,
        metadata: {
          actionId: input.actionId,
          decisionId: transitioned.decisionId,
          outcome: input.outcome,
          guardrail: transitioned.guardrail,
          executionLevel: transitioned.executionLevel,
          approvalStatus: transitioned.approvalStatus,
          risk: transitioned.riskClass,
          action: transitioned,
        } as Prisma.InputJsonValue,
      },
    });
    await writeAgentExecutionAudit({
      userId: input.userId,
      tenantId: input.tenantId,
      eventAction: eventAction[input.state],
      action: transitioned,
      outcome: input.outcome,
    });

    return transitioned;
  },

  async findAction(userId: string, tenantId: string, actionId: string): Promise<AutonomousExecutionAction | null> {
    const actions = await this.list(userId, tenantId);
    return actions.find((action) => action.actionId === actionId) ?? null;
  },

  async list(userId: string, tenantId: string, limit = 100): Promise<AutonomousExecutionAction[]> {
    const rows = await prisma.auditLog.findMany({
      where: {
        tenantId,
        actorId: userId,
        targetType: TARGET_TYPE,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    const latestByActionId = new Map<string, AutonomousExecutionAction>();

    for (const row of rows) {
      const action = actionFromMetadata(row);
      if (action && !latestByActionId.has(action.actionId)) {
        latestByActionId.set(action.actionId, action);
      }
    }

    return Array.from(latestByActionId.values());
  },
};
