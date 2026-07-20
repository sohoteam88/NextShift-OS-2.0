import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { getSearchParams } from '@/lib/query-helpers';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { adminService } from '@/modules/admin/services/admin-service';

const Query = z.object({ search: z.string().optional(), role: z.string().optional(), status: z.string().optional(), page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().positive().optional() });
export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['platform_admin']);
  return NextResponse.json(await adminService.listUsers(user.tenantId, Query.parse(getSearchParams(request)), { includeAllTenants: true }));
});
