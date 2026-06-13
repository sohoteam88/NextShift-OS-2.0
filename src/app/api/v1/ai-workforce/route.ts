import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { agentManager } from '@/modules/ai-agents/agentManager';
import { agentMemoryService } from '@/modules/ai-agents/agentMemoryService';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId }, select: { plan: true } });
  const progress = await prisma.userProgress.findUnique({ where: { userId: user.id }, select: { currentStageId: true } });
  const [state, reports] = await Promise.all([
    agentManager.getWorkforceState(user.id, user.tenantId, tenant?.plan ?? 'free', progress?.currentStageId ?? 'account_approved'),
    agentMemoryService.recall(user.id),
  ]);
  return NextResponse.json({ data: { ...state, reports: reports.slice(-5) } });
});
