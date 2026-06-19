import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { apiHandler } from '@/lib/api-handler';
import prisma from '@/lib/prisma';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';

const UsageEventSchema = z.object({
  eventType: z.enum(['view', 'click']),
  targetId: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  targetKind: z.enum(['dashboard', 'card', 'action', 'queue']),
  section: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  path: z.literal('/platform-admin'),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['platform_admin']);

  const body = UsageEventSchema.parse(await request.json().catch(() => ({})));

  await prisma.analyticsEvent.create({
    data: {
      tenantId: user.tenantId,
      userId: user.id,
      eventName: 'platform_admin_dashboard_interaction',
      properties: {
        eventType: body.eventType,
        targetId: body.targetId,
        targetKind: body.targetKind,
        section: body.section,
        path: body.path,
        dashboardVersion: 'v3',
      } satisfies Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ ok: true });
});
