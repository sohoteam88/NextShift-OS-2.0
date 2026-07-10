import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { getCommandCenterRecommendation } from '@/modules/dashboard/services/recommendation-service';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const data = await getCommandCenterRecommendation(user);

  return NextResponse.json({ data });
});
