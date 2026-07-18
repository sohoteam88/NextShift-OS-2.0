import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { dailyActionService } from '@/modules/member/services/daily-action-service';

const ActionSchema = z.object({
  type: z.string().trim().min(1),
  description: z.string().trim().min(1),
});

const BodySchema = z.object({
  actions: z.array(ActionSchema).min(1),
});

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator']);
  const actions = await dailyActionService.getDefaultActions(user.tenantId);
  return NextResponse.json({ data: actions });
});

export const PUT = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator']);
  const body = await request.json();
  const input = BodySchema.parse(body);
  const actions = await dailyActionService.updateDefaultActions(user.tenantId, input.actions);
  return NextResponse.json({ data: actions });
});
