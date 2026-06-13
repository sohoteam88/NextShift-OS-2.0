import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { videoProductionService } from '@/modules/video-production/videoProductionService';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';

const BriefSchema = z.object({
  brief: z.object({
    contentPillar: z.string().min(1), audiencePain: z.string().min(1),
    funnelStage: z.enum(['awareness','trust_building','consideration','conversion','follow_up']),
    platformType: z.enum(['facebook_reels','instagram_reels','tiktok','youtube_shorts','xhs_video']),
    videoType: z.enum(['personal_story','education','objection_handling','transformation','lifestyle','invitation','testimonial','comparison','myth_busting']),
    videoLength: z.union([z.literal(15),z.literal(30),z.literal(45),z.literal(60)]),
    tone: z.string(), ctaGoal: z.string(),
  }),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const { brief } = BriefSchema.parse(body);
  const pkg = await videoProductionService.generateVideoPackage(user.id, user.tenantId, brief);
  await notifyMissionProgress(user, 'first_video_generated');
  return NextResponse.json({ data: pkg });
});
