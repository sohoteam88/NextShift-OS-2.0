import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { platformOperatingService } from '@/modules/admin/services/platformOperatingService';
import { platformAdminService } from '@/modules/admin/services/platform-admin-service';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['platform_admin']);
  const [operatingData, stats] = await Promise.all([platformOperatingService.getOperatingData(), platformAdminService.getPlatformStats()]);
  return NextResponse.json({ data: { operatingData, stats } });
});
