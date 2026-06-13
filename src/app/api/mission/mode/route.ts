import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { missionEngineService } from '@/modules/mission-engine/missionEngineService';

const ModeSchema = z.object({
  mode: z.enum(['beginner', 'advanced']),
});

/**
 * POST /api/mission/mode
 * Switch between beginner and advanced mission mode.
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const input = ModeSchema.parse(body);

  const result = await missionEngineService.switchMissionMode(
    user.id,
    user.tenantId,
    input.mode,
  );

  return NextResponse.json({ data: result });
});
