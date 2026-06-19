import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { expansionEngine } from '@/modules/expansion/services/expansion-engine';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const projection = await expansionEngine.getProjection(user.id, user.tenantId);

  return NextResponse.json({ data: projection });
});
