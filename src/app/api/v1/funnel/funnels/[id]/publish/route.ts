import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { funnelService } from '@/modules/funnel/services/funnel-service';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';

async function getId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).id;
}

const UnpublishSchema = z.object({ action: z.literal('unpublish') }).optional();

export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const id = await getId(context);

  // Check if body contains { action: 'unpublish' }
  let body: unknown;
  try { body = await request.json(); } catch { body = null; }
  const parsed = UnpublishSchema.safeParse(body);

  if (parsed.success && parsed.data?.action === 'unpublish') {
    const funnel = await funnelService.unpublish(user, id);
    return NextResponse.json({ data: funnel });
  }

  const funnel = await funnelService.publish(user, id);
  const mission = await notifyMissionProgress(user, 'funnel_published');
  return NextResponse.json({ data: funnel, mission });
});
