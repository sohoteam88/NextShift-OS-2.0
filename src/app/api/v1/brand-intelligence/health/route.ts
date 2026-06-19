import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { brandHealthService } from '@/modules/brand-intelligence/services/health-service';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const health = await brandHealthService.getSnapshot(user.id);
  return NextResponse.json({ data: health });
});
