import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { contentEngineService } from '@/modules/content-engine/contentEngineService';
import { CONTENT_ENGINE_PLATFORMS } from '@/modules/content-engine/types';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';
import { resolveRequestWorkspaceContext } from '@/modules/workspace/request-workspace-context';

const GenSchema = z.object({
  platform: z.enum(CONTENT_ENGINE_PLATFORMS),
  format: z.enum(['text_post', 'carousel', 'reel', 'short_video', 'story', 'email', 'blog']),
  funnelStage: z.enum(['awareness', 'consideration', 'conversion', 'retention']),
  pillarName: z.string().optional(),
  workspaceId: z.string().optional(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  await sharedAiRateLimitGuard(user, { feature: 'generation' });
  const body = await request.json();
  const input = GenSchema.parse(body);
  const workspaceContext = await resolveRequestWorkspaceContext({ user, request, body });
  const post = await contentEngineService.generatePlatformPost(
    user.id, user.tenantId, input.platform, input.format, input.funnelStage, input.pillarName,
    workspaceContext,
  );
  await notifyMissionProgress(user, 'first_content_generated');
  return NextResponse.json({ data: post });
});
