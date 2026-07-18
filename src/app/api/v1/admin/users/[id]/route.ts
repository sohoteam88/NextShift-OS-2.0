import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { adminService } from '@/modules/admin/services/admin-service';

const BodySchema = z.object({
  role: z.enum(['member', 'leader', 'operator', 'platform_admin']).optional(),
  status: z.enum(['active', 'pending', 'suspended']).optional(),
  password: z.string().min(8).max(128).optional(),
});

export const dynamic = 'force-dynamic';

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator']);

  const params = await Promise.resolve(context?.params ?? {});
  const { id } = params;
  const body = await request.json();
  const input = BodySchema.parse(body);
  const { password, ...profileInput } = input;

  let updated = null;
  if (Object.keys(profileInput).length > 0) {
    updated = await adminService.updateUser(user.id, user.tenantId, id, profileInput);
  }
  if (password) {
    await adminService.resetUserPassword(user.id, id, password);
  }

  return NextResponse.json({ data: updated });
});

export const DELETE = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator']);

  const params = await Promise.resolve(context?.params ?? {});
  const { id } = params;
  const deleted = await adminService.deleteUser(user.id, id);
  return NextResponse.json({ data: deleted });
});
