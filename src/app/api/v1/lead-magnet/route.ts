import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { leadMagnetService } from '@/modules/lead-magnet/leadMagnetService';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const data = await leadMagnetService.get(user.id);
  return NextResponse.json({ data });
});
