import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { businessStateService } from '@/modules/business-state/services/BusinessStateService';
import { toTrafficReadinessViewModel } from '@/modules/business-state/view-models/TrafficReadinessViewModelAdapter';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const state = await businessStateService.getBusinessState(user.id);
  return NextResponse.json({ data: toTrafficReadinessViewModel(state) });
});
