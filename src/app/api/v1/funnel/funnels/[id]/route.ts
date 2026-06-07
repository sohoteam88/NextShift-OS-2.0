import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { funnelService } from '@/modules/funnel/services/funnel-service';
import { UpdateFunnelSchema } from '@/modules/funnel/schemas/funnel-schemas';

async function getId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).id;
}

export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const id = await getId(context);
  const funnel = await funnelService.getById(user, id);
  return NextResponse.json({ data: funnel });
});

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const id = await getId(context);
  const body = await request.json();
  const input = UpdateFunnelSchema.parse(body);
  const funnel = await funnelService.update(user, id, input);
  return NextResponse.json({ data: funnel });
});

export const DELETE = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const id = await getId(context);
  const result = await funnelService.delete(user, id);
  return NextResponse.json({ data: result });
});
