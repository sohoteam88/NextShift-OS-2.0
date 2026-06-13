import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { adminCommandService } from '@/modules/admin/services/adminCommandService';

export const GET = apiHandler(async (req: NextRequest) => {
  const user = await requireAuthApi(req);
  requireRoleApi(user, ['owner', 'admin']);
  return NextResponse.json({ data: await adminCommandService.getOverview() });
});
