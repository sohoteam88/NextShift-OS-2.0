import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { funnelBuilderService } from '@/modules/funnel/services/funnel-builder-service';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';
import { resolveRequestWorkspaceContext } from '@/modules/workspace/request-workspace-context';

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  await sharedAiRateLimitGuard(user, { feature: 'generation' });
  const body = await request.json();
  const { funnelType, track } = z.object({
    funnelType: z.enum(['lead_magnet','webinar','whatsapp','consultation','challenge']),
    track: z.enum(['retail', 'recruitment']).default('retail'),
    workspaceId: z.string().optional(),
  }).parse(body);
  const workspaceContext = await resolveRequestWorkspaceContext({
    user,
    request,
    body,
    legacyWorkspaceType: track,
  });
  const data = await funnelBuilderService.generate(user.id, funnelType, track, workspaceContext);
  if (data.healthScore >= 80) await notifyMissionProgress(user, 'funnel_published');
  return NextResponse.json({ data });
});
