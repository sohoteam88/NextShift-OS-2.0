import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { autonomousExecutionEngine } from '@/modules/autonomous-execution/services/autonomous-execution-engine';

const RejectSchema = z.object({
  actionId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = RejectSchema.parse(await request.json().catch(() => ({})));
  const data = await autonomousExecutionEngine.reject({
    userId: user.id,
    tenantId: user.tenantId,
    actionId: body.actionId,
    reason: body.reason,
  });

  return NextResponse.json({ data });
});
