import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { getProgressPercent, getStageById, type CompletedChecksValue } from '@/modules/mission/constants/journey-map';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['leader', 'operator', 'platform_admin']);

  const members = await prisma.user.findMany({
    where:
      user.role === 'leader'
        ? { tenantId: user.tenantId, sponsorId: user.id, deletedAt: null }
        : { tenantId: user.tenantId, role: 'member', deletedAt: null },
    select: {
      id: true,
      name: true,
      userProgress: {
        select: {
          currentStageId: true,
          completedChecks: true,
          lastActivityAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const now = Date.now();
  const data = members.map((member) => {
    const progress = member.userProgress;
    const currentStage = progress?.currentStageId ? getStageById(progress.currentStageId as never) : null;
    const progressPercent = progress ? getProgressPercent(progress.completedChecks as CompletedChecksValue) : 0;
    const daysSinceLastActivity = progress
      ? Math.floor((now - progress.lastActivityAt.getTime()) / 86_400_000)
      : null;

    return {
      userId: member.id,
      name: member.name,
      progressPercent,
      currentStageId: progress?.currentStageId ?? null,
      currentStageName: currentStage?.name_zh ?? '尚未开始',
      daysSinceLastActivity,
      stalled: typeof daysSinceLastActivity === 'number' && daysSinceLastActivity > 3,
    };
  });

  return NextResponse.json({ data });
});
