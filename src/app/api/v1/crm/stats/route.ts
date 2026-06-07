import { NextRequest, NextResponse } from 'next/server';
import { type Prisma } from '@prisma/client';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);

  // Build owner filter based on role
  const ownerFilter: Prisma.LeadWhereInput = {};
  if (user.role === 'member') {
    ownerFilter.ownerId = user.id;
  } else if (user.role === 'leader') {
    const downline = await prisma.user.findMany({
      where: { tenantId: user.tenantId, sponsorId: user.id },
      select: { id: true },
    });
    ownerFilter.ownerId = { in: [user.id, ...downline.map((u) => u.id)] };
  }

  const base: Prisma.LeadWhereInput = { tenantId: user.tenantId, deletedAt: null, ...ownerFilter };

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalLeads,
    leadsByStageRaw,
    allScores,
    convertedCount,
    overdueCount,
    todayFollowupCount,
    leadsThisWeek,
    activitiesThisWeek,
  ] = await Promise.all([
    prisma.lead.count({ where: base }),
    prisma.lead.groupBy({ by: ['pipelineStage'], where: base, _count: true }),
    prisma.lead.findMany({ where: base, select: { score: true } }),
    prisma.lead.count({ where: { ...base, pipelineStage: '已转化' } }),
    prisma.lead.count({ where: { ...base, nextFollowup: { lt: todayStart, not: null } } }),
    prisma.lead.count({ where: { ...base, nextFollowup: { gte: todayStart, lte: new Date(todayStart.getTime() + 86_400_000 - 1) } } }),
    prisma.lead.count({ where: { ...base, createdAt: { gte: weekAgo } } }),
    prisma.activity.count({ where: { tenantId: user.tenantId, createdAt: { gte: weekAgo }, ...ownerFilter.ownerId ? { userId: typeof ownerFilter.ownerId === 'string' ? ownerFilter.ownerId : undefined } : {} } }),
  ]);

  const hot = allScores.filter((l) => l.score >= 70).length;
  const warm = allScores.filter((l) => l.score >= 40 && l.score < 70).length;
  const cold = allScores.filter((l) => l.score < 40).length;

  return NextResponse.json({
    data: {
      total_leads: totalLeads,
      leads_by_stage: leadsByStageRaw.map((s) => ({ stage: s.pipelineStage, count: s._count })),
      leads_by_score: { hot, warm, cold },
      conversion_rate: totalLeads > 0 ? Math.round((convertedCount / totalLeads) * 1000) / 10 : 0,
      followup_overdue: overdueCount,
      followup_today: todayFollowupCount,
      leads_this_week: leadsThisWeek,
      activities_this_week: activitiesThisWeek,
    },
  });
});
