import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { AppError } from '@/lib/errors';
import prisma from '@/lib/prisma';

async function getId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).id;
}

export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const funnelId = await getId(context);

  const funnel = await prisma.funnel.findFirst({ where: { id: funnelId, tenantId: user.tenantId } });
  if (!funnel) throw new AppError('NOT_FOUND', 404, 'Funnel not found');

  // WhatsApp clicks from AnalyticsEvent
  const whatsapp_clicks = await prisma.analyticsEvent.count({
    where: { funnelId, eventName: 'whatsapp_click' },
  });

  // 30-day trend from AnalyticsEvent
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const viewEvents = await prisma.analyticsEvent.findMany({
    where: { funnelId, eventName: 'funnel_view', createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
  });
  const submitEvents = await prisma.analyticsEvent.findMany({
    where: { funnelId, eventName: 'funnel_submit', createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
  });

  function groupByDate(events: { createdAt: Date }[]) {
    const map = new Map<string, number>();
    for (const e of events) {
      const d = e.createdAt.toISOString().split('T')[0];
      map.set(d, (map.get(d) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
  }

  const conversion_rate = funnel.views > 0
    ? Math.round((funnel.conversions / funnel.views) * 1000) / 10
    : 0;

  return NextResponse.json({
    data: {
      views: funnel.views,
      submissions: funnel.conversions,
      whatsapp_clicks,
      conversion_rate,
      views_trend: groupByDate(viewEvents),
      submissions_trend: groupByDate(submitEvents),
    },
  });
});
