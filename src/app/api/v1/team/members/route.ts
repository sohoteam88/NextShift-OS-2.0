import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { teamService } from '@/modules/team/services/team-service';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['leader', 'operator']);
  const includeStats = request.nextUrl.searchParams.get('include_stats') !== 'false';
  const data = await teamService.getDirectDownline(user, includeStats);
  return NextResponse.json({ data });
});
