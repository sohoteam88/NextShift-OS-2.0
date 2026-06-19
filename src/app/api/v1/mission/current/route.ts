import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { missionEngineAuthorityService } from '@/modules/mission-engine/services/MissionEngineAuthorityService';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const authority = await missionEngineAuthorityService.getCurrentMission(user.id);

  return NextResponse.json({
    data: {
      currentJourney: authority.currentJourney,
      currentMission: authority.currentMission,
      nextMission: authority.nextMission,
      progress: authority.progress,
      estimatedCompletion: authority.estimatedCompletion,
    },
  });
});
