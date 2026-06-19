import prisma from '@/lib/prisma';
import type { AnalyticsCenter, KPIOverview } from './businessTypes';
import { detectAnomalies } from './analyticsEngines';
import { applyProjectionToAnalyticsCenter, getAnalyticsProjection } from './adapters/AnalyticsProjectionAdapter';

export const analyticsService = {
  async getAnalyticsCenter(userId: string, tenantId: string): Promise<AnalyticsCenter> {
    const contentCount = await prisma.content.count({ where: { ownerId: userId } });
    const videoCount = await prisma.videoProject.count({ where: { userId } });
    const leadCount = await prisma.lead.count({ where: { tenantId, deletedAt: null } });
    const customerCount = await prisma.customer.count({ where: { tenantId } });

    // KPI
    const kpi: KPIOverview = {
      totalPosts: contentCount,
      totalVideos: videoCount,
      totalLeads: leadCount,
      totalConversions: customerCount,
      totalRevenue: 0, // Would come from actual sales data
      conversionRate: leadCount > 0 ? Math.round((customerCount / leadCount) * 100) : 0,
      leadResponseRate: 70, // Placeholder
    };

    // Calculate revenue from opportunities
    const customers = await prisma.customer.findMany({ where: { tenantId }, select: { metadata: true } });
    kpi.totalRevenue = customers.reduce((sum, c) => sum + (((c.metadata as Record<string,unknown>)?.value as number) ?? 0), 0);

    // Anomalies (compare with previous period)
    const weekAgo = new Date(Date.now() - 7*86400000);
    const prevLeads = await prisma.lead.count({ where: { tenantId, createdAt: { lt: weekAgo }, deletedAt: null } });
    const anomalies = detectAnomalies(prevLeads, leadCount, 0, 0);

    // Content breakdown by platform
    const contentPlatforms = await prisma.content.groupBy({ by: ['platform'], where: { ownerId: userId }, _count: true });
    const contentBreakdown: Record<string,number> = {};
    for (const g of contentPlatforms) { if (g.platform) contentBreakdown[g.platform] = g._count; }

    const projection = await getAnalyticsProjection(userId, tenantId);

    return applyProjectionToAnalyticsCenter({
      kpi, anomalies, contentBreakdown,
      funnelMetrics: { views: leadCount * 10, conversions: customerCount, rate: kpi.conversionRate },
    }, projection);
  },
};
