import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { analyticsService } from '@/modules/analytics/analyticsService';
export const GET = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  return NextResponse.json({ data: await analyticsService.getAnalyticsCenter(user.id, user.tenantId) });
});
