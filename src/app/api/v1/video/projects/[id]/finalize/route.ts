import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { videoFinalizeService } from '@/modules/video/services/video-finalize-service';

async function getId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).id;
}

const Schema = z.object({
  additional_platforms: z.array(z.enum(['facebook_reel', 'instagram_reel', 'tiktok', 'instagram_story', 'xiaohongshu', 'youtube_shorts'])).optional(),
});

export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const body = Schema.parse(await request.json().catch(() => ({})));
  const result = await videoFinalizeService.finalize(user, await getId(context), body.additional_platforms ?? []);
  return NextResponse.json({ data: result });
});
