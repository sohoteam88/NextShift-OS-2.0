import prisma from '@/lib/prisma';
import type { AnalyticsCenter, KPIOverview } from './businessTypes';
import { calculateHealthScore, generateInsights, generateNextActions, detectAnomalies, getBenchmark } from './analyticsEngines';
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';

export const analyticsService = {
  async getAnalyticsCenter(userId: string, tenantId: string): Promise<AnalyticsCenter> {
    // Gather data from all modules
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true, onboardingCompleted: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};

    const ctx = await getBrandContext(userId);
    const brandDNAExists = !!ctx;
    const funnelExists = !!(meta.funnel_builder);
    const whatsappConfigured = !!(meta.whatsapp_ai);

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

    // Health
    const health = calculateHealthScore(brandDNAExists, contentCount, videoCount, funnelExists, leadCount, customerCount, whatsappConfigured);

    // Insights + actions
    const insights = generateInsights(kpi, health);
    const nextActions = generateNextActions(health, kpi);

    // Anomalies (compare with previous period)
    const weekAgo = new Date(Date.now() - 7*86400000);
    const prevLeads = await prisma.lead.count({ where: { tenantId, createdAt: { lt: weekAgo }, deletedAt: null } });
    const anomalies = detectAnomalies(prevLeads, leadCount, 0, 0);

    // Benchmark
    const benchmark = getBenchmark(kpi);

    // Content breakdown by platform
    const contentPlatforms = await prisma.content.groupBy({ by: ['platform'], where: { ownerId: userId }, _count: true });
    const contentBreakdown: Record<string,number> = {};
    for (const g of contentPlatforms) { if (g.platform) contentBreakdown[g.platform] = g._count; }

    return {
      health, kpi, insights, nextActions, anomalies, benchmark, contentBreakdown,
      funnelMetrics: { views: leadCount * 10, conversions: customerCount, rate: kpi.conversionRate },
    };
  },
};
