import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { platformAdminService } from '@/modules/admin/services/platform-admin-service';

const TenantUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  slug: z.string().min(1).max(120).optional(),
  plan: z.enum(['starter', 'growth', 'pro']).optional(),
  status: z.string().trim().optional(),
  maxMembers: z.coerce.number().int().positive().optional(),
  maxAiCalls: z.coerce.number().int().positive().optional(),
});

async function getTenantId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context?.params ?? {})).id;
}

export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['platform_admin']);
  const tenantId = await getTenantId(context);
  const data = await platformAdminService.getTenantDetail(tenantId);
  return NextResponse.json({ data });
});

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  void request; void context;
  return NextResponse.json({ error: { code: 'GONE', message: 'Use /api/v1/superadmin/tenants/:id' } }, { status: 410 });
});

export const DELETE = apiHandler(async (request: NextRequest, context) => {
  void request; void context;
  return NextResponse.json({ error: { code: 'GONE', message: 'Use /api/v1/superadmin/tenants/:id' } }, { status: 410 });
});
