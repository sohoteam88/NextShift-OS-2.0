import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { autonomousExecutionEngine } from '@/modules/autonomous-execution/services/autonomous-execution-engine';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const data = await autonomousExecutionEngine.getProjection(user.id, user.tenantId);

  return NextResponse.json({ data });
});
