import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { z } from 'zod';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { writePlatformAudit } from '@/modules/admin/services/platform-audit-service';
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
  try {
    await writePlatformAudit({ actorId: user.id, actorRole: 'platform_admin', action: 'platform.usage.record', targetType: 'usage', targetKey: `${body.section}:${body.targetId}`, outcome: 'success', correlationId, metadata: { event_type: body.eventType, target_kind: body.targetKind, path: '/superadmin' } });
    return NextResponse.json({ data: { accepted: true } });
  } catch (error) {
    await writePlatformAudit({ actorId: user.id, actorRole: 'platform_admin', action: 'platform.usage.record', targetType: 'usage', targetKey: `${body.section}:${body.targetId}`, outcome: 'failure', correlationId, metadata: { failure_code: error instanceof Error ? error.name : 'UNKNOWN' } });
    throw error;
  }
});
