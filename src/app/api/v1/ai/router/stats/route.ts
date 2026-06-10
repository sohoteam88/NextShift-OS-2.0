import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { estimateFromActualUsage } from '@/modules/ai/router';

function pct(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
}

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator']);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [modelRows, tierRows, total, escalated, costEstimate] = await Promise.all([
    prisma.aIUsageLog.groupBy({
      by: ['model'],
      where: { tenantId: user.tenantId, createdAt: { gte: startOfMonth } },
      _count: { _all: true },
      _sum: { costUsd: true },
    }),
    prisma.aIUsageLog.groupBy({
      by: ['routedTier'],
      where: { tenantId: user.tenantId, createdAt: { gte: startOfMonth } },
      _count: { _all: true },
    }),
    prisma.aIUsageLog.count({
      where: { tenantId: user.tenantId, createdAt: { gte: startOfMonth } },
    }),
    prisma.aIUsageLog.count({
      where: { tenantId: user.tenantId, createdAt: { gte: startOfMonth }, wasEscalated: true },
    }),
    estimateFromActualUsage(user.tenantId),
  ]);

  return NextResponse.json({
    data: {
      modelDistribution: modelRows
        .map((row) => ({
          model: row.model,
          calls: row._count._all,
          percentage: pct(row._count._all, total),
          cost: Number(row._sum.costUsd ?? 0),
        }))
        .sort((a, b) => b.calls - a.calls),
      tierDistribution: tierRows
        .map((row) => ({
          tier: row.routedTier ?? 'unknown',
          calls: row._count._all,
          percentage: pct(row._count._all, total),
        }))
        .sort((a, b) => b.calls - a.calls),
      escalationRate: pct(escalated, total),
      costEstimate,
    },
  });
});
