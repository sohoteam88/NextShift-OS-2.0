import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { agentManager } from '@/modules/ai/services/agent-manager';
import { orchestrateForGoal } from '@/modules/ai/services/workforce-orchestrator';
import { agentMemoryService } from '@/modules/ai/services/agent-memory';
import {
  createRuntimeTelemetryContext,
  emitExternalServiceFailed,
  emitRuntimeAssignmentReceived,
  emitRuntimeExecutionCompleted,
  emitRuntimeExecutionFailed,
  emitRuntimeExecutionStarted,
} from '@/modules/agent-runtime/telemetry/runtime-telemetry';
import prisma from '@/lib/prisma';

const Schema = z.object({
  agentId: z.string().optional(),
  goal: z.string().optional(),
  multi: z.boolean().optional(),
});

function failureCodeFrom(error: unknown) {
  return error instanceof Error && error.name ? error.name : 'RUNTIME_EXECUTION_FAILED';
}

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  await sharedAiRateLimitGuard(user, { feature: 'generation' });
  const body = Schema.parse(await req.json());
  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId }, select: { plan: true } });

  // Multi-agent orchestration
  if (body.goal && body.multi) {
    const telemetry = createRuntimeTelemetryContext({
      userId: user.id,
      tenantId: user.tenantId,
      agentId: 'workforce_orchestrator',
      executionMode: 'multi_agent',
    });
    const startedAt = Date.now();

    emitRuntimeAssignmentReceived(telemetry);
    emitRuntimeExecutionStarted(telemetry);

    try {
      const result = await orchestrateForGoal({ objective: body.goal, userId: user.id, tenantId: user.tenantId }, tenant?.plan ?? 'free');
      for (const report of result.agents) await agentMemoryService.remember(user.id, report);
      emitRuntimeExecutionCompleted({ ...telemetry, durationMs: Date.now() - startedAt });
      return NextResponse.json({ data: result });
    } catch (error) {
      const failureCode = failureCodeFrom(error);
      emitRuntimeExecutionFailed({ ...telemetry, durationMs: Date.now() - startedAt, failureCode });
      emitExternalServiceFailed({
        userId: user.id,
        tenantId: user.tenantId,
        correlationId: telemetry.correlationId,
        provider: 'workforce-orchestrator',
        operation: 'orchestrateForGoal',
        failureCode,
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
    });
    const startedAt = Date.now();

    emitRuntimeAssignmentReceived(telemetry);
    emitRuntimeExecutionStarted(telemetry);

    try {
      const report = await agentManager.executeAgent({ agentId: body.agentId as any, userId: user.id, tenantId: user.tenantId, objective: body.goal ?? '分析并给出建议' });
      await agentMemoryService.remember(user.id, report);
      emitRuntimeExecutionCompleted({ ...telemetry, durationMs: Date.now() - startedAt });
      return NextResponse.json({ data: report });
    } catch (error) {
      const failureCode = failureCodeFrom(error);
      emitRuntimeExecutionFailed({ ...telemetry, durationMs: Date.now() - startedAt, failureCode });
      emitExternalServiceFailed({
        userId: user.id,
        tenantId: user.tenantId,
        correlationId: telemetry.correlationId,
        provider: 'agent-manager',
        operation: 'executeAgent',
        failureCode,
      });
      throw error;
    }
  }

  // Default: run recommended agents
  const progress = await prisma.userProgress.findUnique({ where: { userId: user.id }, select: { currentStageId: true } });
  const recommended = await agentManager.getRecommendedAgents(progress?.currentStageId ?? 'account_approved', tenant?.plan ?? 'free');
  const telemetry = createRuntimeTelemetryContext({
    userId: user.id,
    tenantId: user.tenantId,
    agentId: recommended.slice(0, 2).join(',') || 'recommended_agents',
    executionMode: 'recommended_agents',
  });
  const startedAt = Date.now();

  emitRuntimeAssignmentReceived(telemetry);
  emitRuntimeExecutionStarted(telemetry);

  try {
    const result = await agentManager.executeMultiAgent(recommended.slice(0, 2), { userId: user.id, tenantId: user.tenantId, objective: '分析当前状态并给出建议' });
    for (const report of result.agents) await agentMemoryService.remember(user.id, report);
    emitRuntimeExecutionCompleted({ ...telemetry, durationMs: Date.now() - startedAt });
    return NextResponse.json({ data: result });
  } catch (error) {
    const failureCode = failureCodeFrom(error);
    emitRuntimeExecutionFailed({ ...telemetry, durationMs: Date.now() - startedAt, failureCode });
    emitExternalServiceFailed({
      userId: user.id,
      tenantId: user.tenantId,
      correlationId: telemetry.correlationId,
      provider: 'agent-manager',
      operation: 'executeMultiAgent',
      failureCode,
    });
    throw error;
  }
});
