import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { AppError } from '@/lib/errors';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { brandInterviewService } from '@/modules/brand-builder/services/brand-interview-service';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';

export const dynamic = 'force-dynamic';

async function getId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).id;
}

export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const id = await getId(context);
  const body = (await request.json().catch(() => ({}))) as { voice_profile_id?: string };

  const interview = await brandInterviewService.getInterview(id, user.tenantId);
  if (!interview) throw new AppError('NOT_FOUND', 404, 'Interview not found');

  if (body.voice_profile_id) {
    await brandInterviewService.linkVoiceProfile(id, body.voice_profile_id);
  }

  const extracted = await brandInterviewService.extractBrandProfile(id, user);
  const mission = await notifyMissionProgress(user, 'brand_discovery_completed');
  return NextResponse.json({ data: extracted, mission });
});
