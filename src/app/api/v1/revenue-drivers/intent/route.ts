import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { recordRevenueDriverIntentAudit } from '@/modules/revenue-drivers/services/revenue-driver-intent-service';

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

  const data = await recordRevenueDriverIntentAudit(user, input);

  return NextResponse.json({ data }, { status: 201 });
});
