import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { deletePlatformUserWithAudit, updatePlatformUserWithAudit } from '@/modules/admin/services/platform-mutation-service';
import { resolvePlatformCorrelationId } from '@/modules/admin/services/platform-request-authority';

const Body = z.object({ role: z.enum(['member','leader','operator','platform_admin']).optional(), status: z.enum(['active','pending','suspended']).optional() });
const target = async (context: { params?: Promise<Record<string,string>> | Record<string,string> } | undefined) => (await Promise.resolve(context?.params ?? {})).id;

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request); requireRoleApi(user, ['platform_admin']);
  const id = await target(context);
  const data = await updatePlatformUserWithAudit(user.id, id, resolvePlatformCorrelationId(request), Body.parse(await request.json()));
  return NextResponse.json({ data });
});

export const DELETE = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request); requireRoleApi(user, ['platform_admin']);
  const id = await target(context);
  const data = await deletePlatformUserWithAudit(user.id, id, resolvePlatformCorrelationId(request));
  return NextResponse.json({ data });
});
