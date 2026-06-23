import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { customerHealthEngine } from '@/modules/customer-health/services/customer-health-engine';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const projection = await customerHealthEngine.getProjection(user.id, user.tenantId);

  return NextResponse.json({ data: projection });
});
