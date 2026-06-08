import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { adminService } from '@/modules/admin/services/admin-service';

const BodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  logo_url: z.string().trim().url().optional().or(z.literal('')),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator', 'platform_admin']);
  const data = await adminService.getTenantSettings(user.tenantId);
  return NextResponse.json({ data });
});

export const PATCH = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator', 'platform_admin']);
  const body = await request.json();
  const input = BodySchema.parse(body);
  const data = await adminService.updateTenantSettings(user.id, user.tenantId, {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.logo_url !== undefined ? { logo_url: input.logo_url || undefined } : {}),
    ...(input.settings !== undefined ? { settings: input.settings } : {}),
  });
  return NextResponse.json({ data });
});
