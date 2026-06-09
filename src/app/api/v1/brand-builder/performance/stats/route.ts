import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { postPerformanceService } from '@/modules/brand-builder/services/post-performance-service';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const period = (request.nextUrl.searchParams.get('period') ?? '30d') as '7d' | '30d' | '90d';
  const validPeriods = ['7d', '30d', '90d'];
  const safePeriod = validPeriods.includes(period) ? period : '30d';
  const stats = await postPerformanceService.getStats(user, safePeriod);
  return NextResponse.json({ data: stats });
});
