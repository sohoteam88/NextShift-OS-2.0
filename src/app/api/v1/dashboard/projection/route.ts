import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { getDashboardProjection } from '@/modules/dashboard/adapters/DashboardProjectionAdapter';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const data = await getDashboardProjection(user.id, user.tenantId);
  return NextResponse.json({ data });
});
