import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { contentEngineService } from '@/modules/content-engine/contentEngineService';

const CalendarSchema = z.object({ days: z.union([z.literal(30), z.literal(90), z.literal(180)]) });

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const { days } = CalendarSchema.parse(body);
  const calendar = await contentEngineService.generateCalendar(user.id, days);
  return NextResponse.json({ data: calendar });
});
