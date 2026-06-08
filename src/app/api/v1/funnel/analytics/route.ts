import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import prisma from '@/lib/prisma';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);

  const where = user.role === 'member'
    ? { tenantId: user.tenantId, ownerId: user.id }
    : { tenantId: user.tenantId };

  const funnels = await prisma.funnel.findMany({
    where,
    select: { id: true, title: true, status: true, views: true, conversions: true },
    orderBy: { views: 'desc' },
  });

  const total_funnels = funnels.length;
  const published_funnels = funnels.filter(f => f.status === 'published').length;
  const total_views = funnels.reduce((s, f) => s + f.views, 0);
  const total_submissions = funnels.reduce((s, f) => s + f.conversions, 0);
  const overall_conversion_rate = total_views > 0
    ? Math.round((total_submissions / total_views) * 1000) / 10
    : 0;

  const top_funnels = funnels.slice(0, 5).map(f => ({
    id: f.id,
    name: f.title,
    views: f.views,
    submissions: f.conversions,
    conversion_rate: f.views > 0 ? Math.round((f.conversions / f.views) * 1000) / 10 : 0,
  }));

  return NextResponse.json({
    data: { total_funnels, published_funnels, total_views, total_submissions, overall_conversion_rate, top_funnels },
  });
});
