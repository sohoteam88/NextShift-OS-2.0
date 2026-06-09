import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { contentCalendarService } from '@/modules/brand-builder/services/content-calendar-service';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const items = await contentCalendarService.getTodayContent(user);
  return NextResponse.json({ data: items });
});
