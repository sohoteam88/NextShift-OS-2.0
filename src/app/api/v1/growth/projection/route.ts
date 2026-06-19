import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { growthLoopEngine } from '@/modules/growth-loop/services/growth-loop-engine';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const projection = await growthLoopEngine.getProjection(user.id);

  return NextResponse.json({
    data: {
      growthScore: projection.growthScore,
      currentGrowthStage: projection.currentGrowthStage,
      primaryBottleneck: projection.primaryBottleneck,
      primaryOpportunity: projection.primaryOpportunity,
      recommendedGrowthAction: projection.recommendedGrowthAction,
    },
  });
});
