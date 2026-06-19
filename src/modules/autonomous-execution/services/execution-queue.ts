import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { AutonomousExecutionAction, ExecutionState } from '../contracts/AutonomousExecution';

const TARGET_TYPE = 'autonomous_execution';

type QueueEventAction =
  | 'EXECUTION_QUEUED'
  | 'EXECUTION_APPROVED'
  | 'EXECUTION_REJECTED'
  | 'EXECUTION_EXECUTING'
  | 'EXECUTION_COMPLETED'
  | 'EXECUTION_FAILED'
  | 'EXECUTION_CANCELLED';

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

export const executionQueue = {
  async enqueue(input: {
    userId: string;
    tenantId: string;
    action: AutonomousExecutionAction;
  }): Promise<AutonomousExecutionAction> {
    const existing = await this.findAction(input.userId, input.tenantId, input.action.actionId);
    if (existing) return existing;

    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        actorId: input.userId,
        action: 'EXECUTION_QUEUED',
        targetType: TARGET_TYPE,
        metadata: {
          actionId: input.action.actionId,
          decisionId: input.action.decisionId,
          action: input.action,
        } as Prisma.InputJsonValue,
      },
    });

    return input.action;
  },

  async transition(input: {
    userId: string;
    tenantId: string;
    actionId: string;
    state: Exclude<ExecutionState, 'queued'>;
    outcome?: string;
  }): Promise<AutonomousExecutionAction | null> {
    const current = await this.findAction(input.userId, input.tenantId, input.actionId);
    if (!current) return null;

    const eventAction: Record<Exclude<ExecutionState, 'queued'>, QueueEventAction> = {
      approved: 'EXECUTION_APPROVED',
      executing: 'EXECUTION_EXECUTING',
      completed: 'EXECUTION_COMPLETED',
      failed: 'EXECUTION_FAILED',
      cancelled: 'EXECUTION_CANCELLED',
    };
    const transitioned: AutonomousExecutionAction = {
      ...current,
      state: input.state,
      outcome: input.outcome ?? current.outcome,
      updatedAt: new Date().toISOString(),
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
          action: transitioned,
        } as Prisma.InputJsonValue,
      },
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
