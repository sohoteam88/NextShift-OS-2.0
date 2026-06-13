import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { contentCalendarService } from '@/modules/brand-builder/services/content-calendar-service';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';

export const dynamic = 'force-dynamic';

async function getId(
  context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined,
) {
  return (await Promise.resolve(context!.params)).id;
}

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const id = await getId(context);
  const user = await requireAuthApi(request);
  const body = (await request.json()) as Record<string, string>;
  const item = await contentCalendarService.updateItem(user, id, body);
  const mission = body.status === 'published' ? await notifyMissionProgress(user, 'content_published') : undefined;
  return NextResponse.json({ data: item, mission });
});

export const DELETE = apiHandler(async (request: NextRequest, context) => {
  const id = await getId(context);
  const user = await requireAuthApi(request);
  await contentCalendarService.deleteItem(user, id);
  return NextResponse.json({ success: true });
});
