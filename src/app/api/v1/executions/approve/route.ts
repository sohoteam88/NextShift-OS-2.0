import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { autonomousExecutionEngine } from '@/modules/autonomous-execution/services/autonomous-execution-engine';

const ApproveSchema = z.object({
  actionId: z.string().min(1),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = ApproveSchema.parse(await request.json());
  const data = await autonomousExecutionEngine.approve({
    userId: user.id,
    tenantId: user.tenantId,
    actionId: body.actionId,
  });

  return NextResponse.json({ data });
});
