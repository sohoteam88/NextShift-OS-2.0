import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { socialSetupService } from '@/modules/social-setup/socialSetupService';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  await sharedAiRateLimitGuard(user, { feature: 'social-setup' });
  const [setup, readiness] = await Promise.all([
    socialSetupService.generateSetup(user.id),
    socialSetupService.getReadiness(user.id),
  ]);
  if (readiness.score >= 80) await notifyMissionProgress(user, 'social_setup_completed');
  return NextResponse.json({ data: setup, readiness });
});
