import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { contentEngineService } from '@/modules/content-engine/contentEngineService';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';

const CalendarSchema = z.object({
  days: z.union([z.literal(30), z.literal(90), z.literal(180)]),
  track: z.enum(['retail', 'recruitment']).default('retail'),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const { days, track } = CalendarSchema.parse(body);
  const calendar = await contentEngineService.generateCalendar(
    user.id,
    days,
    track,
  );
  const missionResults = await Promise.all([
    notifyMissionProgress(user, 'content_calendar_generated'),
    notifyMissionProgress(user, 'first_content_generated'),
  ]);

  return NextResponse.json({
    data: calendar,
    mission:
      missionResults.find((result) => result.isNewMilestone) ??
      missionResults[0],
  });
});
