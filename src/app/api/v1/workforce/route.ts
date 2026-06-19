import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { agentWorkforceService } from '@/modules/agent-workforce/services/agent-workforce-service';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const data = await agentWorkforceService.getProjection(user.id, user.tenantId);

  return NextResponse.json({ data });
});
