import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { dailyActionService } from '@/modules/member/services/daily-action-service';

const ToggleSchema = z.object({
  index: z.number().int().nonnegative(),
});

export const PATCH = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const input = ToggleSchema.parse(body);
  const today = await dailyActionService.toggleAction(user, input.index);
  return NextResponse.json({ data: today });
});
