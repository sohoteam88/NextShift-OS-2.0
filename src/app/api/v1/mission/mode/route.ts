import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { missionService } from '@/modules/mission/services/mission-service';

const ModeSchema = z.object({
  mode: z.enum(['guided', 'advanced']),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const input = ModeSchema.parse(body);
  const progress = await missionService.setMode(user, input.mode);
  return NextResponse.json({ data: { mode: progress.mode } });
});
