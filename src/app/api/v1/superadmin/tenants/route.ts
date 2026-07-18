import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { getSearchParams } from '@/lib/query-helpers';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { platformAdminService } from '@/modules/admin/services/platform-admin-service';
import { createPlatformTenantWithAudit } from '@/modules/admin/services/platform-mutation-service';
import { resolvePlatformCorrelationId } from '@/modules/admin/services/platform-request-authority';

const QuerySchema = z.object({ page: z.coerce.number().int().min(1).optional(), limit: z.coerce.number().int().min(1).max(50).optional(), search: z.string().trim().optional(), plan: z.string().trim().optional(), status: z.string().trim().optional() });
const CreateSchema = z.object({ name: z.string().min(1).max(120), slug: z.string().min(1).max(120), plan: z.enum(['starter', 'growth', 'pro']), ownerId: z.string().uuid().optional(), ownerEmail: z.string().email(), ownerName: z.string().min(1).max(120) });

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request); requireRoleApi(user, ['platform_admin']);
  return NextResponse.json(await platformAdminService.listTenants(QuerySchema.parse(getSearchParams(request))));
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request); requireRoleApi(user, ['platform_admin']);
  const body = CreateSchema.parse(await request.json());
  const data = await createPlatformTenantWithAudit(
    user.id,
    resolvePlatformCorrelationId(request),
    { ...body, ownerId: body.ownerId ?? randomUUID() },
  );
  return NextResponse.json({ data }, { status: 201 });
});
