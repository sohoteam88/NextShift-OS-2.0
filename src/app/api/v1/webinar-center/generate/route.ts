import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { webinarService } from '@/modules/webinar-center/webinarService';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';
import { resolveRequestWorkspaceContext } from '@/modules/workspace/request-workspace-context';

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  await sharedAiRateLimitGuard(user, { feature: 'webinar-center' });
  const workspaceContext = await resolveRequestWorkspaceContext({ user, request });
  const data = await webinarService.generate(user.id, user.tenantId, workspaceContext);
  if (data.qualityScore >= 80) await notifyMissionProgress(user, 'webinar_created');
  return NextResponse.json({ data });
});
