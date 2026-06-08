import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { analyticsService } from '@/modules/analytics/services/analytics-service';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['leader']);

  const period = request.nextUrl.searchParams.get('period');
  const data = await analyticsService.getLeaderAnalytics(user, period);

  return NextResponse.json({ data });
});
