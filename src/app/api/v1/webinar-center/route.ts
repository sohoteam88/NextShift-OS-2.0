import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { webinarDeleteSchema, webinarPatchSchema } from '@/modules/webinar-center/input';
import { webinarService } from '@/modules/webinar-center/webinarService';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const data = await webinarService.get(user.id);
  return NextResponse.json({ data });
});

export const PATCH = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request); const { id, ...patch } = webinarPatchSchema.parse(await request.json());
  return NextResponse.json({ data: await webinarService.update(user.id, id, patch) });
});

export const DELETE = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request); const input = webinarDeleteSchema.parse(await request.json());
  return NextResponse.json({ data: await webinarService.delete(user.id, input.id) });
});
