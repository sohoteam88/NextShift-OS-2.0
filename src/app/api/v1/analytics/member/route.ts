import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { analyticsService } from '@/modules/analytics/services/analytics-service';
import { growthLoopStateService } from '@/modules/growth-loop/services/GrowthLoopStateService';
import { toMemberAnalyticsViewModel } from '@/modules/growth-loop/view-models/MemberAnalyticsViewModelAdapter';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['member']);

  const period = request.nextUrl.searchParams.get('period');
  const [growthLoopState, fallback] = await Promise.all([
    growthLoopStateService.getGrowthLoopState(user.id),
    analyticsService.getMemberAnalytics(user, period),
  ]);
  const data = toMemberAnalyticsViewModel(growthLoopState, fallback);

  return NextResponse.json({ data });
});
