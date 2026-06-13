import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { contentService } from '@/modules/ai/services/content-service';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';

const UpdateContentSchema = z.object({
  content: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  status: z.enum(['draft', 'published']).optional(),
  platform: z.string().min(1).optional(),
});

async function getContentId(
  context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined,
) {
  return (await Promise.resolve(context!.params)).id;
}

export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const id = await getContentId(context);
  const content = await contentService.getById(user, id);
  return NextResponse.json({ data: content });
});

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const id = await getContentId(context);
  const body = await request.json();
  const input = UpdateContentSchema.parse(body);
  const content = await contentService.update(user, id, input);
  const mission = input.status === 'published' ? await notifyMissionProgress(user, 'content_published') : undefined;
  return NextResponse.json({ data: content, mission });
});

export const DELETE = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const id = await getContentId(context);
  const result = await contentService.delete(user, id);
  return NextResponse.json({ data: result });
});
