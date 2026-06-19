import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { journeyStateService } from '@/modules/journey/services/JourneyStateService';
import { toJourneyProgressViewModel } from '@/modules/journey/view-models/JourneyProgressViewModelAdapter';

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
          lastActivityAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const now = Date.now();
  const data = await Promise.all(members.map(async (member) => {
    const journeyState = await journeyStateService.getJourneyState(member.id);
    return toJourneyProgressViewModel(journeyState, {
      userId: member.id,
      name: member.name,
      lastActivityAt: member.userProgress?.lastActivityAt ?? null,
      now,
    });
  }));

  return NextResponse.json({ data });
});
