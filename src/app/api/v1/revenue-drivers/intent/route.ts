import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';

const IntentAuditSchema = z.object({
  route: z.string().min(1).max(200),
  intent: z.string().max(120).nullable().optional(),
  status: z.enum(['resolved', 'invalid', 'fallback']),
  resolvedTool: z.string().max(160).nullable().optional(),
  timestamp: z.string().max(80).optional(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const input = IntentAuditSchema.parse(await request.json());

  const action = input.status === 'resolved'
    ? 'intent.resolved'
    : input.status === 'invalid'
      ? 'intent.invalid'
      : 'intent.fallback';

  await prisma.auditLog.create({
    data: {
      tenantId: user.tenantId,
      actorId: user.id,
      action,
      targetType: 'revenue_driver_intent',
      metadata: {
        route: input.route,
        intent: input.intent ?? null,
        resolvedTool: input.resolvedTool ?? null,
        status: input.status,
        timestamp: input.timestamp ?? new Date().toISOString(),
      },
    },
  });

  return NextResponse.json({ data: { action } }, { status: 201 });
});
