import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { getBrandVersionHistorySnapshot } from '@/modules/brand-intelligence/projections/brand-version-history-projection';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const snapshot = await getBrandVersionHistorySnapshot(user.id);

  return NextResponse.json({ data: snapshot });
});
