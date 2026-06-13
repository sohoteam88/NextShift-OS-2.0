import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import prisma from '@/lib/prisma';
import type { Prisma as PrismaNS } from '@prisma/client';
import type { WorkflowDefinition } from '@/modules/automation/types';
import { WORKFLOW_TEMPLATES } from '@/modules/automation/workflowTemplates';

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  const meta = (user as any)?.metadata ?? {};
  const workflows: WorkflowDefinition[] = Array.isArray(meta.automation_workflows) ? meta.automation_workflows : WORKFLOW_TEMPLATES;
  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId }, select: { plan: true } });
  const available = workflows.filter(w => {
    const tierOrder: Record<string, number> = { free: 0, starter: 1, pro: 2, agency: 3 };
    return (tierOrder[tenant?.plan ?? 'free'] ?? 0) >= (tierOrder[w.requiredPlan] ?? 0);
  });

  // Get recent executions from activity log
  const executions = await prisma.activity.findMany({
    where: { userId: user.id, type: { in: ['workflow_execution', 'automation'] } },
    orderBy: { createdAt: 'desc' }, take: 10,
  });

  return NextResponse.json({ data: { workflows: available, executions: executions.map(e => ({ id: e.id, workflowName: e.description, trigger: e.type, status: 'completed', actionsExecuted: 1, executedAt: e.createdAt.toISOString(), conditionsMet: true, errors: [], durationMs: 0 })), health: { score: available.filter(w => w.enabled).length > 0 ? 80 : 20, activeWorkflows: available.filter(w => w.enabled).length, recommendations: available.filter(w => w.enabled).length === 0 ? ['激活至少一个工作流模板'] : [] } } });
});

export const POST = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  const { workflowId, enabled } = z.object({ workflowId: z.string(), enabled: z.boolean() }).parse(await req.json());
  const meta = (await prisma.user.findUnique({ where: { id: user.id }, select: { metadata: true } }))?.metadata as Record<string, unknown> ?? {};
  let workflows: WorkflowDefinition[] = Array.isArray(meta.automation_workflows) ? (meta.automation_workflows as WorkflowDefinition[]) : [];

  const existing = workflows.findIndex(w => w.id === workflowId);
  if (existing >= 0) { workflows[existing] = { ...workflows[existing], enabled }; }
  else { const tpl = WORKFLOW_TEMPLATES.find(t => t.id === workflowId); if (tpl) workflows.push({ ...tpl, enabled }); }

  await prisma.user.update({ where: { id: user.id }, data: { metadata: { ...meta, automation_workflows: workflows as unknown as PrismaNS.InputJsonValue } as PrismaNS.InputJsonValue } });

  // Log the toggle action
  await prisma.activity.create({ data: { tenantId: user.tenantId, userId: user.id, type: 'automation', description: `${enabled ? 'Activated' : 'Deactivated'} workflow: ${workflowId}` } });

  return NextResponse.json({ data: { workflowId, enabled } });
});
