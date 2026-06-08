import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { dailyActionService } from '@/modules/member/services/daily-action-service';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const history = await dailyActionService.getHistory(user, 30);
  const streak = await dailyActionService.getStreak(user);
  void request;
  return NextResponse.json({ data: { days: history, streak } });
});
