import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';

/** Historical mutating GET: authorization first, then permanently fail closed. */
export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['platform_admin']);
  return NextResponse.json({ error: { code: 'GONE', message: 'Use POST /api/v1/superadmin/auth/uid-reconciliation' } }, { status: 410 });
});
