import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { webinarService } from '@/modules/webinar-center/webinarService';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const data = await webinarService.get(user.id);
  return NextResponse.json({ data });
});
