import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { leadMagnetService } from '@/modules/lead-magnet/leadMagnetService';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';

export const POST = apiHandler(async (request: NextRequest) => {
  void request;
  const user = await requireAuthApi(request);
  const data = await leadMagnetService.publish(user);
  await notifyMissionProgress(user, 'lead_magnet_created');
  return NextResponse.json({ data });
});
