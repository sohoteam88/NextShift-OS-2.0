import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { checkQuota } from '@/modules/ai/usage/quota';
import { getUsageStats } from '@/modules/ai/usage/tracker';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const scope = request.nextUrl.searchParams.get('scope') ?? 'user';

  if (scope === 'tenant') {
    requireRoleApi(user, ['operator']);
  } else if (scope !== 'user') {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid scope' } },
      { status: 400 },
    );
  }

  const quota = await checkQuota(user.tenantId);
  const usage = await getUsageStats(user.tenantId, scope === 'user' ? user.id : undefined);

  return NextResponse.json({
    data: {
      used: usage.totalCalls,
      limit: quota.limit,
      remaining: scope === 'user' ? Math.max(0, quota.limit - usage.totalCalls) : quota.remaining,
      percentUsed:
        quota.limit > 0
          ? Math.min(100, (scope === 'user' ? usage.totalCalls : quota.used) / quota.limit * 100)
          : 100,
      totalCost: usage.totalCost,
      byFeature: usage.byFeature,
      totalTokens: usage.totalTokens,
    },
  });
});
