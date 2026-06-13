import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { missionEngineService } from '@/modules/mission-engine/missionEngineService';
import type { MissionStageId } from '@/modules/mission-engine/missionStages';

const CompleteMissionSchema = z.object({
  stageId: z.string().min(1).max(100),
});

/**
 * POST /api/mission/complete
 * Mark a mission stage as complete, returns the next mission and any unlocked achievements.
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const input = CompleteMissionSchema.parse(body);

  const result = await missionEngineService.completeCurrentMission(
    user.id,
    user.tenantId,
    input.stageId as MissionStageId,
  );

  return NextResponse.json({
    data: result,
    mission: result, // for mission-celebration-store compatibility
  });
});
