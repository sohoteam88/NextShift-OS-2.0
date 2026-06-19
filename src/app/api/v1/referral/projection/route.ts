import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { referralEngine } from '@/modules/referral/services/referral-engine';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const projection = await referralEngine.getProjection(user.id, user.tenantId);

  return NextResponse.json({ data: projection });
});
