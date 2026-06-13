import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { trafficEngineService } from '@/modules/traffic-engine/trafficEngineService';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  return NextResponse.json({ data: await trafficEngineService.get(user.id) });
});
