import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { funnelBuilderService } from '@/modules/funnel/services/funnel-builder-service';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  await sharedAiRateLimitGuard(user, { feature: 'generation' });
  const data = await funnelBuilderService.publishLandingPage(user);
  const mission = await notifyMissionProgress(user, 'funnel_published');
  return NextResponse.json({ data, mission });
});
