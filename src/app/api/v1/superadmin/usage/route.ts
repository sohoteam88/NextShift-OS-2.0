import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { writePlatformAudit } from '@/modules/admin/services/platform-audit-service';

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
  try {
    await prisma.analyticsEvent.create({ data: { tenantId: user.tenantId, userId: user.id, eventName: 'superadmin_dashboard_interaction', properties: { ...body, path: '/superadmin', dashboardVersion: 'v3' } satisfies Prisma.InputJsonValue } });
    await writePlatformAudit({ actorId: user.id, actorRole: 'platform_admin', action: 'platform.usage.record', targetType: 'usage', targetKey: `${body.section}:${body.targetId}`, outcome: 'success', metadata: { event_type: body.eventType } });
    return NextResponse.json({ data: { accepted: true } });
  } catch (error) {
    await writePlatformAudit({ actorId: user.id, actorRole: 'platform_admin', action: 'platform.usage.record', targetType: 'usage', targetKey: `${body.section}:${body.targetId}`, outcome: 'failure', metadata: { failure_code: error instanceof Error ? error.name : 'UNKNOWN' } });
    throw error;
  }
});
