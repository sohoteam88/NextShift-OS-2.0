import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { missionEngineService } from '@/modules/mission-engine/missionEngineService';

/**
 * GET /api/mission/current
 * Returns the current mission, progress, and achievements for the authenticated user.
 */
export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);

  const [currentMission, progress, achievements] = await Promise.all([
    missionEngineService.getCurrentMission(user.id, user.tenantId),
    missionEngineService.getMissionProgress(user.id, user.tenantId),
    missionEngineService.getAchievements(user.id, user.tenantId),
  ]);

  return NextResponse.json({
    data: {
      currentMission,
      progress,
      achievements,
    },
  });
});
