import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { getSearchParams } from '@/lib/query-helpers';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { platformAdminService } from '@/modules/admin/services/platform-admin-service';

const TenantListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  search: z.string().trim().optional(),
  plan: z.string().trim().optional(),
  status: z.string().trim().optional(),
});

const TenantCreateSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120),
  plan: z.enum(['starter', 'growth', 'pro']),
  ownerId: z.string().uuid().optional(),
  ownerEmail: z.string().email(),
  ownerName: z.string().min(1).max(120),
});

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['platform_admin']);
  const query = TenantListQuerySchema.parse(getSearchParams(request));
  const data = await platformAdminService.listTenants(query);
  return NextResponse.json(data);
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['platform_admin']);
  const body = TenantCreateSchema.parse(await request.json());
  const ownerId = body.ownerId ?? randomUUID();
  const result = await platformAdminService.createTenant({
    name: body.name,
    slug: body.slug,
    plan: body.plan,
    ownerId,
    ownerEmail: body.ownerEmail,
    ownerName: body.ownerName,
  });
  return NextResponse.json({ data: result }, { status: 201 });
});
