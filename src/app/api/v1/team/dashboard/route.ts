import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { withPrismaRetry } from '@/lib/prisma-retry';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { leaderDashboardService } from '@/modules/team/services/leader-dashboard-service';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const data = await withPrismaRetry(() => leaderDashboardService.getData(user));
  return NextResponse.json({ data });
});
