import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { funnelBuilderService } from '@/modules/funnel/services/funnel-builder-service';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const { funnelType } = z.object({ funnelType: z.enum(['lead_magnet','webinar','whatsapp','consultation','challenge']) }).parse(await request.json());
  const data = await funnelBuilderService.generate(user.id, funnelType);
  if (data.healthScore >= 80) await notifyMissionProgress(user, 'funnel_published');
  return NextResponse.json({ data });
});
