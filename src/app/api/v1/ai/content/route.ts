import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { contentService } from '@/modules/ai/services/content-service';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';

const SaveContentSchema = z.object({
  content: z.string().min(1),
  platform: z.string().min(1),
  title: z.string().min(1).optional(),
  status: z.enum(['draft', 'published']).optional(),
  language: z.enum(['zh', 'en', 'ms']).optional(),
  promptUsed: z.string().optional(),
});

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const page = Number(request.nextUrl.searchParams.get('page') ?? '1');
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? '10');
  const result = await contentService.listSavedContent(user, {
    page: Number.isFinite(page) ? page : 1,
    limit: Number.isFinite(limit) ? limit : 10,
  });
  return NextResponse.json({ data: result.items, meta: result.meta });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const input = SaveContentSchema.parse(body);
  const content = await contentService.saveContent(user, input);
  const mission = input.status === 'published' ? await notifyMissionProgress(user, 'content_published') : undefined;
  return NextResponse.json({ data: content, mission }, { status: 201 });
});
