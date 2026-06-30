import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { leadMagnetService } from '@/modules/lead-magnet/leadMagnetService';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';
import { resolveRequestWorkspaceContext } from '@/modules/workspace/request-workspace-context';

const Schema = z.object({
  type: z.enum(['guide', 'checklist', 'template']),
  track: z.enum(['retail', 'recruitment']).default('retail'),
  workspaceId: z.string().optional(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  await sharedAiRateLimitGuard(user, { feature: 'generation' });
  const body = await request.json();
  const input = Schema.parse(body);
  const workspaceContext = await resolveRequestWorkspaceContext({
    user,
    request,
    body,
    legacyWorkspaceType: input.track,
  });
  const data = await leadMagnetService.generate(
    user.id,
    input.type,
    input.track,
    workspaceContext,
  );
  const mission =
    data.qualityScore >= 70
      ? await notifyMissionProgress(user, 'lead_magnet_created')
      : undefined;
  return NextResponse.json({ data, mission });
});
