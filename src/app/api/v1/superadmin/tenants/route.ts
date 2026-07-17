import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { getSearchParams } from '@/lib/query-helpers';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { platformAdminService } from '@/modules/admin/services/platform-admin-service';
import { writePlatformAudit } from '@/modules/admin/services/platform-audit-service';

const QuerySchema = z.object({ page: z.coerce.number().int().min(1).optional(), limit: z.coerce.number().int().min(1).max(50).optional(), search: z.string().trim().optional(), plan: z.string().trim().optional(), status: z.string().trim().optional() });
const CreateSchema = z.object({ name: z.string().min(1).max(120), slug: z.string().min(1).max(120), plan: z.enum(['starter', 'growth', 'pro']), ownerId: z.string().uuid().optional(), ownerEmail: z.string().email(), ownerName: z.string().min(1).max(120) });

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request); requireRoleApi(user, ['platform_admin']);
  return NextResponse.json(await platformAdminService.listTenants(QuerySchema.parse(getSearchParams(request))));
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request); requireRoleApi(user, ['platform_admin']);
  const body = CreateSchema.parse(await request.json());
  try {
    const data = await platformAdminService.createTenant({ ...body, ownerId: body.ownerId ?? randomUUID() });
    await writePlatformAudit({ actorId: user.id, actorRole: 'platform_admin', action: 'tenant.create', targetType: 'tenant', targetId: data.tenant.id, targetKey: data.tenant.id, outcome: 'success', metadata: { tenant_name: data.tenant.name } });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    await writePlatformAudit({ actorId: user.id, actorRole: 'platform_admin', action: 'tenant.create', targetType: 'tenant', targetKey: body.slug, outcome: 'failure', metadata: { failure_code: error instanceof Error ? error.name : 'UNKNOWN' } });
    throw error;
  }
});
