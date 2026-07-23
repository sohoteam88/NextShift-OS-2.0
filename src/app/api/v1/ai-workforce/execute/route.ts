import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { agentManager } from '@/modules/ai/services/agent-manager';
import { orchestrateForGoal } from '@/modules/ai/services/workforce-orchestrator';
import { agentMemoryService } from '@/modules/ai/services/agent-memory';
import { runtimeStateService } from '@/modules/agent-runtime/services/RuntimeStateService';
import type { RuntimeAssignment } from '@/modules/agent-runtime/contracts/RuntimeAssignment';
import type { AgentId } from '@/modules/ai/types/agents';
import {
  createRuntimeTelemetryContext,
  emitExternalServiceFailed,
  emitRuntimeAssignmentReceived,
  emitRuntimeExecutionCompleted,
  emitRuntimeExecutionFailed,
  emitRuntimeExecutionStarted,
} from '@/modules/agent-runtime/telemetry/runtime-telemetry';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';

const Schema = z.object({
  assignmentId: z.string().optional(),
  agentId: z.string().optional(),
  goal: z.string().optional(),
  multi: z.boolean().optional(),
  overrideReason: z.string().optional(),
});

function failureCodeFrom(error: unknown) {
  return error instanceof Error && error.name ? error.name : 'RUNTIME_EXECUTION_FAILED';
}

function telemetryModeForAssignment(assignment: RuntimeAssignment) {
  return assignment.selectedAgents.length > 1 ? 'multi_agent' : 'direct_agent';
}

async function rememberReports(userId: string, result: Awaited<ReturnType<typeof agentManager.executeMultiAgent>> | Awaited<ReturnType<typeof agentManager.executeAgent>>) {
  if ('agents' in result) {
    for (const report of result.agents) await agentMemoryService.remember(userId, report);
    return;
  }

  await agentMemoryService.remember(userId, result);
}

async function executeRuntimeAssignment(input: {
  userId: string;
  tenantId: string;
  assignment: RuntimeAssignment;
}) {
  const { userId, tenantId, assignment } = input;
  const selectedAgents = assignment.selectedAgents.slice(0, 5);

  if (selectedAgents.length === 0 || assignment.executionMode === 'advisory_only') {
    throw new AppError('VALIDATION_ERROR', 400, 'Runtime assignment has no executable agents.');
  }

  const telemetry = createRuntimeTelemetryContext({
    userId,
    tenantId,
    agentId: selectedAgents.join(','),
    executionMode: telemetryModeForAssignment(assignment),
    executionSource: 'assignment',
    assignmentId: assignment.assignmentId,
  });
  const startedAt = Date.now();

  emitRuntimeAssignmentReceived(telemetry);
  emitRuntimeExecutionStarted(telemetry);

  try {
    const result = selectedAgents.length > 1
      ? await agentManager.executeMultiAgent(selectedAgents, {
          userId,
          tenantId,
          objective: assignment.objective,
          context: {
            executionSource: 'assignment',
            assignmentId: assignment.assignmentId,
            assignmentBasis: assignment.basis,
            assignmentSource: assignment.source,
          },
        })
      : await agentManager.executeAgent({
          agentId: selectedAgents[0] as AgentId,
          userId,
          tenantId,
          objective: assignment.objective,
          context: {
            executionSource: 'assignment',
            assignmentId: assignment.assignmentId,
            assignmentBasis: assignment.basis,
            assignmentSource: assignment.source,
          },
        });

    await rememberReports(userId, result);
    emitRuntimeExecutionCompleted({ ...telemetry, durationMs: Date.now() - startedAt });
    return result;
  } catch (error) {
    const failureCode = failureCodeFrom(error);
    emitRuntimeExecutionFailed({ ...telemetry, durationMs: Date.now() - startedAt, failureCode });
    emitExternalServiceFailed({
      userId,
      tenantId,
      correlationId: telemetry.correlationId,
      provider: 'agent-manager',
      operation: selectedAgents.length > 1 ? 'executeMultiAgent' : 'executeAgent',
      failureCode,
      extra: { executionSource: 'assignment', assignmentId: assignment.assignmentId },
    });
    throw error;
  }
}

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  await sharedAiRateLimitGuard(user, { feature: 'ai-workforce' });
  const body = Schema.parse(await req.json());
  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId }, select: { plan: true } });

  if (body.assignmentId) {
    const runtimeState = await runtimeStateService.getRuntimeState(user.id);
    const assignment = runtimeState.pendingAssignments.find((item) => item.assignmentId === body.assignmentId);
    if (!assignment) throw new AppError('NOT_FOUND', 404, 'Runtime assignment not found.');

    return NextResponse.json({
      data: await executeRuntimeAssignment({
        userId: user.id,
        tenantId: user.tenantId,
        assignment,
      }),
    });
  }

  if (!body.assignmentId && !body.agentId && !body.goal) {
    const runtimeState = await runtimeStateService.getRuntimeState(user.id);
    const assignment = runtimeState.pendingAssignments[0];
    if (!assignment) throw new AppError('NOT_FOUND', 404, 'No runtime assignment available.');

    return NextResponse.json({
      data: await executeRuntimeAssignment({
        userId: user.id,
        tenantId: user.tenantId,
        assignment,
      }),
    });
  }

  // Advanced manual override
  if (body.goal && body.multi) {
    if (!body.overrideReason?.trim()) {
      throw new AppError('VALIDATION_ERROR', 400, 'Manual goal override requires overrideReason.');
    }

    const telemetry = createRuntimeTelemetryContext({
      userId: user.id,
      tenantId: user.tenantId,
      agentId: 'workforce_orchestrator',
      executionMode: 'multi_agent',
      executionSource: 'manual_override',
    });
    const startedAt = Date.now();

    emitRuntimeAssignmentReceived({ ...telemetry, extra: { overrideReason: body.overrideReason } });
    emitRuntimeExecutionStarted({ ...telemetry, extra: { overrideReason: body.overrideReason } });

    try {
      const result = await orchestrateForGoal({ objective: body.goal, userId: user.id, tenantId: user.tenantId }, tenant?.plan ?? 'free');
      for (const report of result.agents) await agentMemoryService.remember(user.id, report);
      emitRuntimeExecutionCompleted({ ...telemetry, durationMs: Date.now() - startedAt, extra: { overrideReason: body.overrideReason } });
      return NextResponse.json({ data: result });
    } catch (error) {
      const failureCode = failureCodeFrom(error);
      emitRuntimeExecutionFailed({ ...telemetry, durationMs: Date.now() - startedAt, failureCode, extra: { overrideReason: body.overrideReason } });
      emitExternalServiceFailed({
        userId: user.id,
        tenantId: user.tenantId,
        correlationId: telemetry.correlationId,
        provider: 'workforce-orchestrator',
        operation: 'orchestrateForGoal',
        failureCode,
        extra: { executionSource: 'manual_override', overrideReason: body.overrideReason },
      });
      throw error;
    }
  }

  // Single agent execution
  if (body.agentId) {
    const telemetry = createRuntimeTelemetryContext({
      userId: user.id,
      tenantId: user.tenantId,
      agentId: body.agentId,
      executionMode: 'direct_agent',
      executionSource: 'manual_override',
    });
    const startedAt = Date.now();

    emitRuntimeAssignmentReceived({ ...telemetry, extra: { overrideReason: body.overrideReason ?? 'direct_agent_request' } });
    emitRuntimeExecutionStarted({ ...telemetry, extra: { overrideReason: body.overrideReason ?? 'direct_agent_request' } });

    try {
      const report = await agentManager.executeAgent({
        agentId: body.agentId as any,
        userId: user.id,
        tenantId: user.tenantId,
        objective: body.goal ?? '分析并给出建议',
        context: {
          executionSource: 'manual_override',
          overrideReason: body.overrideReason ?? 'direct_agent_request',
        },
      });
      await agentMemoryService.remember(user.id, report);
      emitRuntimeExecutionCompleted({ ...telemetry, durationMs: Date.now() - startedAt, extra: { overrideReason: body.overrideReason ?? 'direct_agent_request' } });
      return NextResponse.json({ data: report });
    } catch (error) {
      const failureCode = failureCodeFrom(error);
      emitRuntimeExecutionFailed({ ...telemetry, durationMs: Date.now() - startedAt, failureCode, extra: { overrideReason: body.overrideReason ?? 'direct_agent_request' } });
      emitExternalServiceFailed({
        userId: user.id,
        tenantId: user.tenantId,
        correlationId: telemetry.correlationId,
        provider: 'agent-manager',
        operation: 'executeAgent',
        failureCode,
        extra: { executionSource: 'manual_override', overrideReason: body.overrideReason ?? 'direct_agent_request' },
      });
      throw error;
    }
  }

  throw new AppError('VALIDATION_ERROR', 400, 'No executable workforce request provided.');
});
