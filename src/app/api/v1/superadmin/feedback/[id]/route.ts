import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { updatePlatformFeedbackWithAudit } from '@/modules/admin/services/platform-mutation-service';
import { resolvePlatformCorrelationId } from '@/modules/admin/services/platform-request-authority';

const Body = z.object({ status: z.enum(['open', 'acknowledged', 'in_progress', 'resolved', 'closed']) });

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['platform_admin']);
  const { id } = await Promise.resolve(context?.params ?? {});
  const { status } = Body.parse(await request.json());
  const data = await updatePlatformFeedbackWithAudit(
    user.id,
    id,
    resolvePlatformCorrelationId(request),
    status,
  );
  return NextResponse.json({ data });
});
