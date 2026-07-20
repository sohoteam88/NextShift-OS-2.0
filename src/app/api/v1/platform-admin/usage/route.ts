import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['platform_admin']);

  return NextResponse.json({ error: { code: 'GONE', message: 'Use /api/v1/superadmin/usage' } }, { status: 410 });
});
