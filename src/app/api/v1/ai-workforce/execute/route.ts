import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { agentManager } from '@/modules/ai-agents/agentManager';
import { orchestrateForGoal } from '@/modules/ai-agents/workforceOrchestrator';
import { agentMemoryService } from '@/modules/ai-agents/agentMemoryService';
import prisma from '@/lib/prisma';

const Schema = z.object({
  agentId: z.string().optional(),
  goal: z.string().optional(),
  multi: z.boolean().optional(),
});

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  const body = Schema.parse(await req.json());
  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId }, select: { plan: true } });

  // Multi-agent orchestration
  if (body.goal && body.multi) {
    const result = await orchestrateForGoal({ objective: body.goal, userId: user.id, tenantId: user.tenantId }, tenant?.plan ?? 'free');
    for (const report of result.agents) await agentMemoryService.remember(user.id, report);
    return NextResponse.json({ data: result });
  }

  // Single agent execution
  if (body.agentId) {
    const report = await agentManager.executeAgent({ agentId: body.agentId as any, userId: user.id, tenantId: user.tenantId, objective: body.goal ?? '分析并给出建议' });
    await agentMemoryService.remember(user.id, report);
    return NextResponse.json({ data: report });
  }

  // Default: run recommended agents
  const progress = await prisma.userProgress.findUnique({ where: { userId: user.id }, select: { currentStageId: true } });
  const recommended = await agentManager.getRecommendedAgents(progress?.currentStageId ?? 'account_approved', tenant?.plan ?? 'free');
  const result = await agentManager.executeMultiAgent(recommended.slice(0, 2), { userId: user.id, tenantId: user.tenantId, objective: '分析当前状态并给出建议' });
  for (const report of result.agents) await agentMemoryService.remember(user.id, report);
  return NextResponse.json({ data: result });
});
