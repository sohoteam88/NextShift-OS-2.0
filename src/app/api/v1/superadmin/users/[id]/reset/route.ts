import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { resolvePlatformCorrelationId } from '@/modules/admin/services/platform-request-authority';
import { resetUserBusinessDataWithAudit } from '@/modules/admin/services/user-data-reset-service';

const Body = z.object({ confirmEmail: z.string().email() });
const target = async (context: { params?: Promise<Record<string, string>> | Record<string, string> } | undefined) =>
  (await Promise.resolve(context?.params ?? {})).id;

export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['platform_admin']);
  const id = await target(context);
  const body = Body.parse(await request.json());
  const data = await resetUserBusinessDataWithAudit(
    user.id,
    id,
    body.confirmEmail,
    resolvePlatformCorrelationId(request),
  );
  return NextResponse.json({ data });
});
