import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { AppError } from '@/lib/errors';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { contentCalendarService } from '@/modules/brand-builder/services/content-calendar-service';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const sp = request.nextUrl.searchParams;
  const startParam = sp.get('start');
  const endParam = sp.get('end');
  const startDate = startParam ? new Date(startParam) : undefined;
  const endDate = endParam ? new Date(endParam) : undefined;
  const items = await contentCalendarService.getCalendar(user, startDate, endDate);
  return NextResponse.json({ data: items });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = (await request.json()) as {
    date?: string;
    pillar?: string;
    pillarEmoji?: string;
    title?: string;
    hook?: string;
    platform?: string;
    format?: string;
    notes?: string;
  };
  if (!body.date || !body.pillar || !body.title || !body.platform || !body.format) {
    throw new AppError('VALIDATION_ERROR', 400, 'date, pillar, title, platform, format required');
  }
  const item = await contentCalendarService.addItem(user, {
    date: new Date(body.date),
    pillar: body.pillar,
    pillarEmoji: body.pillarEmoji,
    title: body.title,
    hook: body.hook,
    platform: body.platform,
    format: body.format,
    notes: body.notes,
  });
  return NextResponse.json({ data: item }, { status: 201 });
});
