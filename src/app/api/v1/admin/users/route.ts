import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { getSearchParams } from '@/lib/query-helpers';
import { adminService } from '@/modules/admin/services/admin-service';

const QuerySchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator', 'platform_admin']);

  const query = QuerySchema.parse(getSearchParams(request));
  const result = await adminService.listUsers(user.tenantId, query);
  return NextResponse.json(result);
});
