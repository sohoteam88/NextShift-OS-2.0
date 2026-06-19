import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { valueRealizationEngine } from '@/modules/value/services/value-realization-engine';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const projection = await valueRealizationEngine.getProjection(user.id, user.tenantId);

  return NextResponse.json({ data: projection });
});
