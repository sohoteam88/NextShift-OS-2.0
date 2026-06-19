import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { videoScriptService } from '@/modules/brand-builder/services/video-script-service';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';

export const dynamic = 'force-dynamic';

const GenerateSchema = z.object({
  topic: z.string().min(1).max(200),
  platform: z.enum(['facebook_reel', 'instagram_reel', 'tiktok', 'story']),
  duration: z.enum(['15s', '30s', '60s']),
  style: z.enum(['talking_head', 'faceless', 'broll_voiceover', 'tutorial']),
  calendarId: z.string().optional(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  await sharedAiRateLimitGuard(user, { feature: 'generation' });
  const body = await request.json();
  const input = GenerateSchema.parse(body);
  const script = await videoScriptService.generate(user, input);
  const mission = await notifyMissionProgress(user, 'first_video_generated');
  return NextResponse.json({ data: script, mission }, { status: 201 });
});
