import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { WorkforceExecutionResult } from '../contracts/AgentWorkforce';

const TARGET_TYPE = 'agent_workforce';

function metadataRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function resultFromMetadata(value: Prisma.JsonValue): WorkforceExecutionResult | null {
  const metadata = metadataRecord(value);
  const result = metadata.result;
  if (!result || typeof result !== 'object' || Array.isArray(result)) return null;
  return result as WorkforceExecutionResult;
}

export const agentExecutionTracker = {
  async record(input: {
    userId: string;
    tenantId: string;
    result: WorkforceExecutionResult;
  }) {
    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        actorId: input.userId,
        action: input.result.status === 'completed'
          ? 'AGENT_TASK_COMPLETED'
          : input.result.status === 'approval_required'
            ? 'AGENT_TASK_WAITING_APPROVAL'
            : 'AGENT_TASK_FAILED',
        targetType: TARGET_TYPE,
        metadata: {
          assignmentId: input.result.assignmentId,
          actionId: input.result.actionId,
          agentType: input.result.agentType,
          result: input.result,
        } as Prisma.InputJsonValue,
      },
    });

    return input.result;
  },

  async list(userId: string, tenantId: string, limit = 50): Promise<WorkforceExecutionResult[]> {
    const rows = await prisma.auditLog.findMany({
      where: {
        tenantId,
        actorId: userId,
        targetType: TARGET_TYPE,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return rows
      .map((row) => resultFromMetadata(row.metadata))
      .filter((result): result is WorkforceExecutionResult => Boolean(result));
  },
};
