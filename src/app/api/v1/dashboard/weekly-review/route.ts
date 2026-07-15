import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { getWeeklyReview } from '@/modules/dashboard/services/weekly-review-service';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const data = await getWeeklyReview(user);

  return NextResponse.json({ data });
});
