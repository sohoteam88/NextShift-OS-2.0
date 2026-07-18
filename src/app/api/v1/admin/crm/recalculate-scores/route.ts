import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { recalculateAllLeadScores } from '@/modules/crm/services/scoring-service';

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator']);

  const updated = await recalculateAllLeadScores(user.tenantId);

  return NextResponse.json({ data: { updated_count: updated } });
});
