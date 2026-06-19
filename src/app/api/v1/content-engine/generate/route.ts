import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { contentEngineService } from '@/modules/content-engine/contentEngineService';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';

const GenSchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'tiktok', 'xhs', 'threads', 'email', 'blog']),
  format: z.enum(['text_post', 'carousel', 'reel', 'short_video', 'story', 'email', 'blog']),
  funnelStage: z.enum(['awareness', 'consideration', 'conversion', 'retention']),
  pillarName: z.string().optional(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  await sharedAiRateLimitGuard(user, { feature: 'generation' });
  const body = await request.json();
  const input = GenSchema.parse(body);
  const post = await contentEngineService.generatePlatformPost(
    user.id, user.tenantId, input.platform, input.format, input.funnelStage, input.pillarName,
  );
  await notifyMissionProgress(user, 'first_content_generated');
  return NextResponse.json({ data: post });
});
