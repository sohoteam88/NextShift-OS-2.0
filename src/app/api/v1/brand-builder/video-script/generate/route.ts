import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { videoScriptService } from '@/modules/brand-builder/services/video-script-service';

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
  const body = await request.json();
  const input = GenerateSchema.parse(body);
  const script = await videoScriptService.generate(user, input);
  return NextResponse.json({ data: script }, { status: 201 });
});
