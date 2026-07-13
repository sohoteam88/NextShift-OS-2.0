import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { getCommandCenterBusinessScore } from '@/modules/dashboard/services/business-score-service';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const data = await getCommandCenterBusinessScore(user);

  return NextResponse.json({ data });
});
