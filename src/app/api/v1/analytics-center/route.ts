import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { analyticsService } from '@/modules/analytics/analyticsService';
import { resolveRequestWorkspaceContext } from '@/modules/workspace/request-workspace-context';
export const GET = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  const workspaceContext = await resolveRequestWorkspaceContext({ user, request: req });
  return NextResponse.json({
    data: await analyticsService.getAnalyticsCenter(user.id, user.tenantId, workspaceContext),
  });
});
