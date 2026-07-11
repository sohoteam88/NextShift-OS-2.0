import prisma from '@/lib/prisma';
import { runtimeFallbackLogger } from '@/lib/runtime-fallback-logger';
import type { WorkspaceContext } from '@/modules/workspace/types';
import type { AnalyticsCenter, KPIOverview } from './businessTypes';
import { detectAnomalies } from './analyticsEngines';
import { applyProjectionToAnalyticsCenter } from './adapters/AnalyticsProjectionAdapter';
import {
  resolveAnalyticsRuntimeProjection,
  type AnalyticsRuntimeMetadata,
} from './runtime';

export type AnalyticsCenterRuntimeOptions = {
  onRuntimeResolved?: (runtime: AnalyticsRuntimeMetadata) => void;
  resolveRuntimeProjection?: typeof resolveAnalyticsRuntimeProjection;
};

export const analyticsService = {
  async getAnalyticsCenter(
    userId: string,
    tenantId: string,
    workspaceContext?: WorkspaceContext,
    runtimeOptions: AnalyticsCenterRuntimeOptions = {},
  ): Promise<AnalyticsCenter> {
    const analyticsFocus = workspaceContext?.analyticsContext.focus[0] ?? 'sales';
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
      leadResponseRate: analyticsFocus === 'appointments' ? 75 : 70, // Placeholder until workspace-aware analytics repositories land.
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

    const { projection, runtime } = await (runtimeOptions.resolveRuntimeProjection ?? resolveAnalyticsRuntimeProjection)({
      userId,
      tenantId,
      source: 'analytics-center',
      projectionType: 'analytics-center',
      workspaceFocus: analyticsFocus,
    }, {
      logger: runtimeFallbackLogger,
    });
    runtimeOptions.onRuntimeResolved?.(runtime);

    return applyProjectionToAnalyticsCenter({
      kpi, anomalies, contentBreakdown,
      funnelMetrics: { views: leadCount * 10, conversions: customerCount, rate: kpi.conversionRate },
    }, projection);
  },
};
