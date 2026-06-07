import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { getSearchParams } from '@/lib/query-helpers';
import { funnelService } from '@/modules/funnel/services/funnel-service';
import { CreateFunnelSchema, FunnelQuerySchema } from '@/modules/funnel/schemas/funnel-schemas';

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
  return NextResponse.json({ data: funnel }, { status: 201 });
});
