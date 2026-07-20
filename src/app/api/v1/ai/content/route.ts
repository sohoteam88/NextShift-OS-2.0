import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { contentService } from '@/modules/ai/services/content-service';
import { parseContentLibraryQuery } from '@/lib/content-library-contracts';
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
  const query = parseContentLibraryQuery(request.nextUrl.searchParams);
  const result = await contentService.listSavedContent(user, query);
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
