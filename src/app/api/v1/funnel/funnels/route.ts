import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { getSearchParams } from '@/lib/query-helpers';
import { funnelService } from '@/modules/funnel/services/funnel-service';
import { CreateFunnelSchema, FunnelQuerySchema } from '@/modules/funnel/schemas/funnel-schemas';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const query = FunnelQuerySchema.parse(getSearchParams(request));
  const result = await funnelService.list(user, query);
  return NextResponse.json({ data: result.items, meta: result.meta });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const input = CreateFunnelSchema.parse(body);
  const funnel = await funnelService.create(user, input);
  const configType = typeof input.config?.type === 'string' ? input.config.type : null;
  const templateType = funnel.template?.type ?? null;
  const mission =
    configType === 'lead_magnet' || templateType === 'lead_magnet'
      ? await notifyMissionProgress(user, 'lead_magnet_created')
      : undefined;
      try {
        const { trackFunnelCreated } = await import('@/lib/telemetry/tracker');
        trackFunnelCreated(user.id, { funnel_type: configType || 'landing', template_used: !!input.template_id, title: input.title });
      } catch {}

  return NextResponse.json({ data: funnel, mission }, { status: 201 });
});
