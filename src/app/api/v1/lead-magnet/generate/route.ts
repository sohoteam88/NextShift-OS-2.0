import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { leadMagnetService } from '@/modules/lead-magnet/leadMagnetService';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';

const Schema = z.object({ type: z.enum(['assessment','quiz','checklist']), audiencePain: z.string().min(1) });

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  await sharedAiRateLimitGuard(user, { feature: 'generation' });
  const body = await request.json();
  const input = Schema.parse(body);
  const data = await leadMagnetService.generate(user.id, input.type, input.audiencePain);
  if (data.qualityScore >= 80) await notifyMissionProgress(user, 'lead_magnet_created');
  return NextResponse.json({ data });
});
