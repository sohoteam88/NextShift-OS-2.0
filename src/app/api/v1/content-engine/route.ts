import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { contentEngineService } from '@/modules/content-engine/contentEngineService';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const [pillars, lastPost, calendar, publishedCount] = await Promise.all([
    contentEngineService.getPillars(user.id),
    contentEngineService.getLastPost(user.id),
    contentEngineService.getCalendar(user.id),
    contentEngineService.getPublishedCount(user.id),
  ]);

  return NextResponse.json({ data: { pillars, lastPost, calendar, publishedCount } });
});
