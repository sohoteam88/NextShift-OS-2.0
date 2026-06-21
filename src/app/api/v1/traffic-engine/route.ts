import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { businessStateService } from '@/modules/business-state/services/BusinessStateService';
import { toTrafficReadinessViewModel } from '@/modules/business-state/view-models/TrafficReadinessViewModelAdapter';
import { trafficEngineService } from '@/modules/traffic-engine/trafficEngineService';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const [state, savedPackage, prerequisites] = await Promise.all([
    businessStateService.getBusinessState(user.id),
    trafficEngineService.get(user.id),
    trafficEngineService.getPrerequisites(user.id),
  ]);
  return NextResponse.json({
    data: savedPackage ?? toTrafficReadinessViewModel(state),
    prerequisites,
  });
});
