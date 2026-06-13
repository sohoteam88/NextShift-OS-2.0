import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { trafficEngineService } from '@/modules/traffic-engine/trafficEngineService';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const { goal, platform, budget } = z.object({
    goal: z.enum(['lead_generation','webinar_registration','whatsapp_conversation','consultation_booking','content_growth']),
    platform: z.enum(['facebook','instagram','tiktok','xhs']),
    budget: z.enum(['starter','growth','scale']),
  }).parse(await request.json());
  const data = await trafficEngineService.generate(user.id, goal, platform, budget);
  if (data.readiness.score >= 80) await notifyMissionProgress(user, 'traffic_campaign_launched');
  return NextResponse.json({ data });
});
