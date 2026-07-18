import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { reconcilePlatformAuthUidWithAudit } from '@/modules/admin/services/platform-mutation-service';
import { resolvePlatformCorrelationId } from '@/modules/admin/services/platform-request-authority';

const Body = z.object({
  targetTenantId: z.string().uuid(),
  currentUserId: z.string().uuid(),
  desiredAuthUserId: z.string().uuid(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const actor = await requireAuthApi(request);
  requireRoleApi(actor, ['platform_admin']);
  const body = Body.parse(await request.json());
  const data = await reconcilePlatformAuthUidWithAudit(
    actor.id,
    resolvePlatformCorrelationId(request),
    body,
  );
  return NextResponse.json({ data });
});
