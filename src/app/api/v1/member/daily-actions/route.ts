import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { dailyActionService } from '@/modules/member/services/daily-action-service';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const today = await dailyActionService.getToday(user);
  return NextResponse.json({ data: today });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  void request;
  const today = await dailyActionService.createDailyPlan(user, new Date());
  return NextResponse.json({ data: today });
});
