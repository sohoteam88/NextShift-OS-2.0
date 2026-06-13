import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { videoProductionService } from '@/modules/video-production/videoProductionService';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const latestPackage = await videoProductionService.getLatestPackage(user.id);
  return NextResponse.json({ data: { latestPackage } });
});
