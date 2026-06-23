import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { aiCOODecisionEngine } from '@/modules/ai-coo/services/ai-coo-decision-engine';
import type { ExecutionProjection } from '../contracts/AutonomousExecution';
import { planExecutionAction } from './action-planner';
import { buildExecutionProjection } from './execution-projection';
import { executionQueue } from './execution-queue';
import { guardrailEngine } from './guardrail-engine';
import { autonomousScheduler } from './autonomous-scheduler';

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
  const current = await executionQueue.findAction(input.userId, input.tenantId, input.actionId);
  if (!current) throw new AppError('EXECUTION_NOT_FOUND', 404, 'Execution action not found.');
  if (current.executionLevel === 'FORBIDDEN' || current.guardrail?.allowed === false) {
    throw new AppError('EXECUTION_FORBIDDEN', 403, 'This execution action is blocked by guardrails.');
  }
  if (!current.requiresApproval) {
    throw new AppError('APPROVAL_NOT_REQUIRED', 400, 'This execution action does not require approval.');
  }
  if (guardrailEngine.isApprovalExpired({ expiresAt: current.approvalExpiresAt })) {
    await executionQueue.transition({
      userId: input.userId,
      tenantId: input.tenantId,
      actionId: input.actionId,
      state: 'cancelled',
      outcome: 'Approval expired. Re-request approval before execution.',
    });
    throw new AppError('APPROVAL_EXPIRED', 400, 'Approval expired. Re-request approval before execution.');
  }

  const approved = await executionQueue.transition({
    userId: input.userId,
    tenantId: input.tenantId,
    actionId: input.actionId,
    state: 'approved',
    outcome: 'Execution approved by user.',
  });
  if (approved?.guardrail) {
    await guardrailEngine.writeAudit({
      tenantId: input.tenantId,
      actorId: input.userId,
      action: 'agent.action.approved',
      guardrail: approved.guardrail,
    });
  }

  return buildExecutionProjection(await executionQueue.list(input.userId, input.tenantId));
}

export async function rejectExecution(input: {
  userId: string;
  tenantId: string;
  actionId: string;
  reason?: string;
}): Promise<ExecutionProjection> {
  const rejected = await executionQueue.transition({
    userId: input.userId,
    tenantId: input.tenantId,
    actionId: input.actionId,
    state: 'cancelled',
    outcome: input.reason ?? 'Execution rejected by user.',
  });
  if (rejected?.guardrail) {
    await guardrailEngine.writeAudit({
      tenantId: input.tenantId,
      actorId: input.userId,
      action: 'agent.action.rejected',
      guardrail: rejected.guardrail,
    });
  }

  return buildExecutionProjection(await executionQueue.list(input.userId, input.tenantId));
}

export const autonomousExecutionEngine = {
  getProjection: getAutonomousExecutionProjection,
  approve: approveExecution,
  reject: rejectExecution,
  runAutonomous: autonomousScheduler.run,
};
