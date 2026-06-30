import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { trafficEngineService } from '@/modules/traffic-engine/trafficEngineService';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';
import { resolveRequestWorkspaceContext } from '@/modules/workspace/request-workspace-context';

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  await sharedAiRateLimitGuard(user, { feature: 'generation' });
  const body = await request.json();
  const { goal, platform, budget } = z.object({
    goal: z.enum(['lead_generation','webinar_registration','whatsapp_conversation','consultation_booking','content_growth']),
    platform: z.enum(['facebook','instagram','tiktok','xhs']),
    budget: z.enum(['starter','growth','scale']),
    workspaceId: z.string().optional(),
  }).parse(body);
  const workspaceContext = await resolveRequestWorkspaceContext({ user, request, body });
  const data = await trafficEngineService.generate(user.id, goal, platform, budget, workspaceContext);
  if (data.readiness.score >= 80) await notifyMissionProgress(user, 'traffic_campaign_launched');
  return NextResponse.json({ data });
});
