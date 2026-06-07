import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { followupService } from '@/modules/crm/services/followup-service';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const mode = request.nextUrl.searchParams.get('mode');

  if (mode === 'counts') {
    const counts = await followupService.getFollowupCounts(user);
    return NextResponse.json({ data: counts });
  }

  const result = await followupService.getTodayFollowups(user);
  return NextResponse.json({
    data: result,
    meta: {
      overdue_count: result.overdue.length,
      today_count: result.today.length,
      upcoming_count: result.upcoming.length,
    },
  });
});
