import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { z } from 'zod';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { recordPlatformUsageWithAudit } from '@/modules/admin/services/platform-mutation-service';
import { resolvePlatformCorrelationId } from '@/modules/admin/services/platform-request-authority';

const UsageEventSchema = z.object({
  eventType: z.enum(['view', 'click']),
  targetId: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  targetKind: z.enum(['dashboard', 'card', 'action', 'queue']),
  section: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  path: z.enum(['/platform-admin', '/superadmin']),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request); requireRoleApi(user, ['platform_admin']);
  const body = UsageEventSchema.parse(await request.json().catch(() => ({})));
  const correlationId = resolvePlatformCorrelationId(request);
  await recordPlatformUsageWithAudit(user.id, correlationId, body);
  return NextResponse.json({ data: { accepted: true } });
});
