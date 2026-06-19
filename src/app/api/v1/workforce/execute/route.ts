import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { agentWorkforceService } from '@/modules/agent-workforce/services/agent-workforce-service';

const ExecuteSchema = z.object({
  assignmentId: z.string().optional(),
  actionId: z.string().optional(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = ExecuteSchema.parse(await request.json().catch(() => ({})));
  const data = await agentWorkforceService.executeAssignment({
    userId: user.id,
    tenantId: user.tenantId,
    assignmentId: body.assignmentId,
    actionId: body.actionId,
  });

  return NextResponse.json({ data });
});
