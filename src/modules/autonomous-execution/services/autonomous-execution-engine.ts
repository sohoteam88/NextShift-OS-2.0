import prisma from '@/lib/prisma';
import { aiCOODecisionEngine } from '@/modules/ai-coo/services/ai-coo-decision-engine';
import type { ExecutionProjection } from '../contracts/AutonomousExecution';
import { planExecutionAction } from './action-planner';
import { buildExecutionProjection } from './execution-projection';
import { executionQueue } from './execution-queue';

export async function getAutonomousExecutionProjection(userId: string, tenantId?: string): Promise<ExecutionProjection> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, tenantId: true },
  });

  if (!user) throw new Error('User not found');

  const resolvedTenantId = tenantId ?? user.tenantId;
  const decision = await aiCOODecisionEngine.getDecision(user.id, resolvedTenantId);
  const plannedAction = planExecutionAction(decision);
  await executionQueue.enqueue({
    userId: user.id,
    tenantId: resolvedTenantId,
    action: plannedAction,
  });

  return buildExecutionProjection(await executionQueue.list(user.id, resolvedTenantId));
}

export async function approveExecution(input: {
  userId: string;
  tenantId: string;
  actionId: string;
}): Promise<ExecutionProjection> {
  const approved = await executionQueue.transition({
    userId: input.userId,
    tenantId: input.tenantId,
    actionId: input.actionId,
    state: 'approved',
    outcome: 'Execution approved by user.',
  });

  return buildExecutionProjection(await executionQueue.list(input.userId, input.tenantId));
}

export async function rejectExecution(input: {
  userId: string;
  tenantId: string;
  actionId: string;
  reason?: string;
}): Promise<ExecutionProjection> {
  await executionQueue.transition({
    userId: input.userId,
    tenantId: input.tenantId,
    actionId: input.actionId,
    state: 'cancelled',
    outcome: input.reason ?? 'Execution rejected by user.',
  });

  return buildExecutionProjection(await executionQueue.list(input.userId, input.tenantId));
}

export const autonomousExecutionEngine = {
  getProjection: getAutonomousExecutionProjection,
  approve: approveExecution,
  reject: rejectExecution,
};
